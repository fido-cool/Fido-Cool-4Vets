import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, AlertTriangle, Info, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Evento } from "@shared/schema";

// Validation schema for message
const messageSchema = z.object({
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type MessageForm = z.infer<typeof messageSchema>;

interface EventoConDetalles extends Evento {
  mascota: {
    id: number;
    nombre: string;
    cliente: {
      id: number;
      nombre: string;
      telefono: string;
      email: string;
    };
  };
}

interface Notificacion {
  id: string;
  tipo: "sin_visita" | "cita_proxima";
  mensaje: string;
  mascotaNombre: string;
  mascotaRaza?: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  diasTranscurridos?: number;
  semanas?: number;
  fechaUltimaVisita?: Date;
  fechaCita?: Date;
  prioridad: "alta" | "media" | "baja";
}

export default function Notificaciones() {
  const [resueltas, setResueltas] = useState<Set<string>>(new Set());
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<Notificacion | null>(null);
  const { toast } = useToast();

  const form = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      mensaje: "",
    },
  });

  const { data: eventos, isLoading } = useQuery<EventoConDetalles[]>({
    queryKey: ["/api/eventos"],
  });

  const generarNotificaciones = (): Notificacion[] => {
    if (!eventos) return [];

    const ahora = new Date();
    const notificaciones: Notificacion[] = [];
    const mascotasVisitadas = new Map<number, Date>();

    // Notificaciones de clientes sin visitas recientes
    eventos
      .filter((e) => new Date(e.fecha) < ahora)
      .forEach((evento) => {
        const fechaEvento = new Date(evento.fecha);
        const mascotaId = evento.mascota.id;
        
        if (!mascotasVisitadas.has(mascotaId) || fechaEvento > mascotasVisitadas.get(mascotaId)!) {
          mascotasVisitadas.set(mascotaId, fechaEvento);
        }
      });

    mascotasVisitadas.forEach((ultimaVisita, mascotaId) => {
      const diasTranscurridos = Math.floor((ahora.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasTranscurridos >= 21) {
        const evento = eventos.find((e) => e.mascota.id === mascotaId);
        if (!evento) return;

        const semanas = Math.floor(diasTranscurridos / 7);
        notificaciones.push({
          id: `sin_visita_${mascotaId}`,
          tipo: "sin_visita",
          mensaje: `Han pasado ${semanas} ${semanas === 1 ? 'semana' : 'semanas'} desde la última visita de ${evento.mascota.nombre} (${evento.mascota.cliente.nombre})`,
          mascotaNombre: evento.mascota.nombre,
          clienteNombre: evento.mascota.cliente.nombre,
          clienteTelefono: evento.mascota.cliente.telefono,
          clienteEmail: evento.mascota.cliente.email,
          diasTranscurridos,
          semanas,
          fechaUltimaVisita: ultimaVisita,
          prioridad: diasTranscurridos >= 60 ? "alta" : diasTranscurridos >= 30 ? "media" : "baja",
        });
      }
    });

    // Notificaciones de citas próximas (≤3 días)
    const eventosFuturos = eventos.filter((e) => new Date(e.fecha) > ahora);
    eventosFuturos.forEach((evento) => {
      const fechaEvento = new Date(evento.fecha);
      const diasHastaEvento = Math.floor((fechaEvento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

      if (diasHastaEvento <= 3 && diasHastaEvento >= 0) {
        const diasTexto = diasHastaEvento === 0 ? 'hoy' : 
                         diasHastaEvento === 1 ? 'mañana' : 
                         `en ${diasHastaEvento} días`;
        
        notificaciones.push({
          id: `cita_proxima_${evento.id}`,
          tipo: "cita_proxima",
          mensaje: `${evento.mascota.nombre} (${evento.mascota.cliente.nombre}) tiene cita ${diasTexto}`,
          mascotaNombre: evento.mascota.nombre,
          clienteNombre: evento.mascota.cliente.nombre,
          clienteTelefono: evento.mascota.cliente.telefono,
          clienteEmail: evento.mascota.cliente.email,
          fechaCita: fechaEvento,
          prioridad: diasHastaEvento === 0 ? "alta" : diasHastaEvento === 1 ? "media" : "baja",
        });
      }
    });

    return notificaciones.sort((a, b) => {
      const prioridadOrder = { alta: 0, media: 1, baja: 2 };
      return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
    });
  };

  const generarMensajeSugerido = (notificacion: Notificacion): string => {
    if (notificacion.tipo === "sin_visita") {
      const semanas = notificacion.semanas || 1;
      
      return `Hola ${notificacion.clienteNombre},\n\n` +
        `Notamos que han pasado ${semanas} ${semanas === 1 ? 'semana' : 'semanas'} desde la última visita de ${notificacion.mascotaNombre}. ` +
        `Nos gustaría recordarte la importancia de mantener las revisiones periódicas para asegurar su bienestar.\n\n` +
        `¿Te gustaría agendar una cita? Estamos disponibles para atenderte.\n\n` +
        `Saludos cordiales,\nFidoCool - Clínica Veterinaria`;
    } else if (notificacion.tipo === "cita_proxima") {
      const fechaTexto = notificacion.fechaCita 
        ? format(new Date(notificacion.fechaCita), "dd 'de' MMMM 'a las' HH:mm", { locale: es })
        : "";
      
      return `Hola ${notificacion.clienteNombre},\n\n` +
        `Este es un recordatorio de que ${notificacion.mascotaNombre} tiene una cita programada para el ${fechaTexto}.\n\n` +
        `Por favor, confirma tu asistencia o contáctanos si necesitas reprogramar.\n\n` +
        `¡Te esperamos!\n\nSaludos cordiales,\nFidoCool - Clínica Veterinaria`;
    }
    return "";
  };

  const notificaciones = generarNotificaciones().filter((n) => !resueltas.has(n.id));

  const marcarResuelto = (id: string) => {
    setResueltas(new Set(Array.from(resueltas).concat(id)));
  };

  const abrirDialogRecordatorio = (notificacion: Notificacion) => {
    setNotificacionSeleccionada(notificacion);
    const mensajeSugerido = generarMensajeSugerido(notificacion);
    form.reset({ mensaje: mensajeSugerido });
  };

  const cerrarDialogRecordatorio = () => {
    setNotificacionSeleccionada(null);
    form.reset({ mensaje: "" });
  };

  const enviarRecordatorio = (data: MessageForm) => {
    if (!notificacionSeleccionada) return;

    // Simulación de envío
    console.log("Enviando recordatorio a:", notificacionSeleccionada.clienteNombre);
    console.log("Teléfono:", notificacionSeleccionada.clienteTelefono);
    console.log("Email:", notificacionSeleccionada.clienteEmail);
    console.log("Mensaje:", data.mensaje);

    toast({
      title: "Recordatorio enviado",
      description: `Se ha enviado el recordatorio a ${notificacionSeleccionada.clienteNombre}.`,
    });

    marcarResuelto(notificacionSeleccionada.id);
    cerrarDialogRecordatorio();
  };

  const getNotificacionStyles = (tipo: string) => {
    switch (tipo) {
      case "sin_visita":
        return {
          container: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900",
          icon: "text-orange-600 dark:text-orange-400",
          title: "text-orange-900 dark:text-orange-100",
        };
      case "cita_proxima":
        return {
          container: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
          icon: "text-blue-600 dark:text-blue-400",
          title: "text-blue-900 dark:text-blue-100",
        };
      default:
        return {
          container: "bg-muted",
          icon: "text-muted-foreground",
          title: "text-foreground",
        };
    }
  };

  const getTipoIcon = (tipo: string, styles: any) => {
    switch (tipo) {
      case "sin_visita":
        return <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />;
      case "cita_proxima":
        return <Info className={`w-6 h-6 ${styles.icon}`} />;
      default:
        return <Bell className={`w-6 h-6 ${styles.icon}`} />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Cargando notificaciones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Enviar Notificaciones
        </h1>
        <p className="text-muted-foreground mt-1">
          Alertas y recordatorios de Fido para tus pacientes
        </p>
      </div>

      <div className="space-y-4">
        {notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Bell className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay notificaciones pendientes</h3>
            <p className="text-muted-foreground">
              Fido te avisará cuando haya citas próximas o clientes sin visitas recientes.
            </p>
          </div>
        ) : (
          notificaciones.map((notif) => {
            const styles = getNotificacionStyles(notif.tipo);
            
            return (
              <div
                key={notif.id}
                className={`relative rounded-lg border p-6 ${styles.container}`}
                data-testid={`notification-${notif.id}`}
              >
                <button
                  onClick={() => marcarResuelto(notif.id)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                  data-testid={`button-dismiss-${notif.id}`}
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-start gap-4 mb-4">
                  <div className="mt-1">{getTipoIcon(notif.tipo, styles)}</div>
                  <div className="flex-1 pr-8">
                    <h3 className={`text-base font-semibold mb-3 ${styles.title}`}>
                      {notif.mensaje}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Cliente:</span> {notif.clienteNombre}
                      </div>
                      <div>
                        <span className="font-medium">Mascota:</span> {notif.mascotaNombre}
                        {notif.mascotaRaza && ` (${notif.mascotaRaza})`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => marcarResuelto(notif.id)}
                    className="bg-background"
                    data-testid={`button-resolve-${notif.id}`}
                  >
                    Marcar como resuelto
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => abrirDialogRecordatorio(notif)}
                    className="gap-2"
                    data-testid={`button-send-reminder-${notif.id}`}
                  >
                    <Send className="h-4 w-4" />
                    Enviar recordatorio
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog para enviar recordatorio */}
      <Dialog open={!!notificacionSeleccionada} onOpenChange={(open) => !open && cerrarDialogRecordatorio()}>
        <DialogContent className="max-w-2xl" data-testid="dialog-send-reminder">
          <DialogHeader>
            <DialogTitle>Enviar Recordatorio</DialogTitle>
            <DialogDescription>
              Revisa y personaliza el mensaje antes de enviarlo a {notificacionSeleccionada?.clienteNombre}.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(enviarRecordatorio)} className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Destinatario:</span> {notificacionSeleccionada?.clienteNombre}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Contacto:</span> {notificacionSeleccionada?.clienteTelefono} · {notificacionSeleccionada?.clienteEmail}
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="mensaje"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensaje</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={10}
                        placeholder="Escribe tu mensaje..."
                        className="resize-none"
                        data-testid="textarea-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cerrarDialogRecordatorio}
                  data-testid="button-cancel-reminder"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="gap-2"
                  data-testid="button-confirm-send-reminder"
                >
                  <Send className="h-4 w-4" />
                  Enviar Recordatorio
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
