import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertTriangle, CheckCircle, X, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Evento, Mascota, Cliente } from "@shared/schema";

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
  tipo: "sin_visita" | "vacuna_proxima" | "seguimiento";
  mensaje: string;
  mascotaNombre: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  diasTranscurridos?: number;
  fechaUltimaVisita?: Date;
  prioridad: "alta" | "media" | "baja";
}

export default function Notificaciones() {
  const [resueltas, setResueltas] = useState<Set<string>>(new Set());

  const { data: eventos, isLoading } = useQuery<EventoConDetalles[]>({
    queryKey: ["/api/eventos"],
  });

  const generarNotificaciones = (): Notificacion[] => {
    if (!eventos) return [];

    const ahora = new Date();
    const notificaciones: Notificacion[] = [];
    const mascotasVisitadas = new Map<number, Date>();

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
          mensaje: `Han pasado ${semanas} ${semanas === 1 ? 'semana' : 'semanas'} desde la última visita de ${evento.mascota.nombre}.`,
          mascotaNombre: evento.mascota.nombre,
          clienteNombre: evento.mascota.cliente.nombre,
          clienteTelefono: evento.mascota.cliente.telefono,
          clienteEmail: evento.mascota.cliente.email,
          diasTranscurridos,
          fechaUltimaVisita: ultimaVisita,
          prioridad: diasTranscurridos >= 60 ? "alta" : diasTranscurridos >= 30 ? "media" : "baja",
        });
      }
    });

    const eventosFuturos = eventos.filter((e) => new Date(e.fecha) > ahora);
    eventosFuturos.forEach((evento) => {
      const fechaEvento = new Date(evento.fecha);
      const diasHastaEvento = Math.floor((fechaEvento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

      if (diasHastaEvento <= 7 && diasHastaEvento >= 0 && evento.tipo === "vacunacion") {
        notificaciones.push({
          id: `vacuna_proxima_${evento.id}`,
          tipo: "vacuna_proxima",
          mensaje: `${evento.mascota.nombre} tiene vacunación programada en ${diasHastaEvento} ${diasHastaEvento === 1 ? 'día' : 'días'}.`,
          mascotaNombre: evento.mascota.nombre,
          clienteNombre: evento.mascota.cliente.nombre,
          clienteTelefono: evento.mascota.cliente.telefono,
          clienteEmail: evento.mascota.cliente.email,
          prioridad: diasHastaEvento <= 2 ? "alta" : "media",
        });
      }
    });

    return notificaciones.sort((a, b) => {
      const prioridadOrder = { alta: 0, media: 1, baja: 2 };
      return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
    });
  };

  const notificaciones = generarNotificaciones().filter((n) => !resueltas.has(n.id));

  const marcarResuelto = (id: string) => {
    setResueltas(new Set([...resueltas, id]));
  };

  const enviarRecordatorio = (notificacion: Notificacion) => {
    console.log("Enviando recordatorio a:", notificacion.clienteNombre);
    marcarResuelto(notificacion.id);
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "destructive";
      case "media":
        return "default";
      case "baja":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "sin_visita":
        return <AlertTriangle className="w-5 h-5" />;
      case "vacuna_proxima":
        return <Bell className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
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
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Bell className="h-8 w-8" />
          Notificaciones Inteligentes
        </h1>
        <p className="text-muted-foreground mt-1">
          Alertas y recordatorios generados por Fido para mantener a tus clientes al día
        </p>
      </div>

      <div className="grid gap-4">
        {notificaciones.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <CheckCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Todo al día</h3>
              <p className="text-muted-foreground text-center">
                No hay notificaciones pendientes. Fido te avisará cuando haya algo que requiera tu atención.
              </p>
            </CardContent>
          </Card>
        ) : (
          notificaciones.map((notif) => (
            <Card key={notif.id} className="hover-elevate" data-testid={`notification-${notif.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getTipoIcon(notif.tipo)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{notif.mensaje}</CardTitle>
                      <Badge variant={getPrioridadColor(notif.prioridad)} className="text-xs">
                        {notif.prioridad}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Cliente:</span> {notif.clienteNombre}
                      </div>
                      <div>
                        <span className="font-medium">Mascota:</span> {notif.mascotaNombre}
                      </div>
                      <div>
                        <span className="font-medium">Contacto:</span> {notif.clienteTelefono} · {notif.clienteEmail}
                      </div>
                      {notif.fechaUltimaVisita && (
                        <div className="text-xs">
                          Última visita: {format(notif.fechaUltimaVisita, "dd/MM/yyyy", { locale: es })} 
                          ({formatDistanceToNow(notif.fechaUltimaVisita, { locale: es, addSuffix: true })})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => marcarResuelto(notif.id)}
                  data-testid={`button-dismiss-${notif.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => enviarRecordatorio(notif)}
                  size="sm"
                  className="gap-2"
                  data-testid={`button-send-reminder-${notif.id}`}
                >
                  <Send className="h-4 w-4" />
                  Enviar Recordatorio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => marcarResuelto(notif.id)}
                  data-testid={`button-resolve-${notif.id}`}
                >
                  Marcar como resuelto
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
