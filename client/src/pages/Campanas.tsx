import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Send, User, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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

interface ClienteInactivo {
  clienteId: number;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  mascotaNombre: string;
  mascotaId: number;
  ultimaVisita: Date;
  diasInactivo: number;
}

export default function Campanas() {
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [mensajePersonalizado, setMensajePersonalizado] = useState("");
  const [enviado, setEnviado] = useState(false);
  const { toast } = useToast();

  const { data: eventos, isLoading } = useQuery<EventoConDetalles[]>({
    queryKey: ["/api/eventos"],
  });

  const obtenerClientesInactivos = (): ClienteInactivo[] => {
    if (!eventos) return [];

    const ahora = new Date();
    const ultimasVisitas = new Map<number, { fecha: Date; mascotaNombre: string; mascotaId: number; cliente: any }>();

    eventos
      .filter((e) => new Date(e.fecha) < ahora)
      .forEach((evento) => {
        const fechaEvento = new Date(evento.fecha);
        const clienteId = evento.mascota.cliente.id;
        
        if (!ultimasVisitas.has(clienteId) || fechaEvento > ultimasVisitas.get(clienteId)!.fecha) {
          ultimasVisitas.set(clienteId, {
            fecha: fechaEvento,
            mascotaNombre: evento.mascota.nombre,
            mascotaId: evento.mascota.id,
            cliente: evento.mascota.cliente,
          });
        }
      });

    const clientesInactivos: ClienteInactivo[] = [];
    ultimasVisitas.forEach((data, clienteId) => {
      const diasInactivo = Math.floor((ahora.getTime() - data.fecha.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasInactivo >= 30) {
        clientesInactivos.push({
          clienteId,
          clienteNombre: data.cliente.nombre,
          clienteTelefono: data.cliente.telefono,
          clienteEmail: data.cliente.email,
          mascotaNombre: data.mascotaNombre,
          mascotaId: data.mascotaId,
          ultimaVisita: data.fecha,
          diasInactivo,
        });
      }
    });

    return clientesInactivos.sort((a, b) => b.diasInactivo - a.diasInactivo);
  };

  const clientesInactivos = obtenerClientesInactivos();

  const toggleCliente = (clienteId: number) => {
    const newSet = new Set(seleccionados);
    if (newSet.has(clienteId)) {
      newSet.delete(clienteId);
    } else {
      newSet.add(clienteId);
    }
    setSeleccionados(newSet);
  };

  const seleccionarTodos = () => {
    if (seleccionados.size === clientesInactivos.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(clientesInactivos.map((c) => c.clienteId)));
    }
  };

  const generarMensajeSugerido = (cliente?: ClienteInactivo) => {
    if (!cliente) {
      return `Hola, notamos que ha pasado tiempo desde la última visita. Queremos recordarte que estamos aquí para el cuidado de tu mascota. ¿Quieres agendar una cita?`;
    }
    return `Hola ${cliente.clienteNombre}, notamos que ha pasado tiempo desde la última visita de ${cliente.mascotaNombre}. Queremos recordarte que estamos aquí para su cuidado. ¿Quieres agendar una cita?`;
  };

  const enviarCampana = () => {
    const clientesSeleccionados = clientesInactivos.filter((c) =>
      seleccionados.has(c.clienteId)
    );

    if (clientesSeleccionados.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar al menos un cliente para enviar la campaña.",
      });
      return;
    }

    console.log("Enviando campaña a:", clientesSeleccionados);
    console.log("Mensaje:", mensajePersonalizado || generarMensajeSugerido());
    
    setEnviado(true);
    toast({
      title: "Campaña enviada",
      description: `Se enviaron ${clientesSeleccionados.length} mensajes de reactivación.`,
    });

    setTimeout(() => {
      setEnviado(false);
      setSeleccionados(new Set());
      setMensajePersonalizado("");
    }, 3000);
  };

  const getInactividadColor = (dias: number) => {
    if (dias >= 90) return "destructive";
    if (dias >= 60) return "default";
    return "secondary";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Cargando campañas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Megaphone className="h-8 w-8" />
          Campañas de Reactivación
        </h1>
        <p className="text-muted-foreground mt-1">
          Mantén contacto con clientes que no han visitado la clínica recientemente
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Clientes Inactivos</CardTitle>
              <CardDescription>
                Estos clientes no han visitado la clínica en más de 30 días
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {clientesInactivos.length} {clientesInactivos.length === 1 ? "cliente" : "clientes"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {clientesInactivos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Excelente trabajo</h3>
              <p className="text-muted-foreground">
                Todos tus clientes han visitado la clínica recientemente. No hay campañas de reactivación necesarias.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={seleccionados.size === clientesInactivos.length}
                  onCheckedChange={seleccionarTodos}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm font-medium">
                  {seleccionados.size === clientesInactivos.length
                    ? "Deseleccionar todos"
                    : "Seleccionar todos"}
                </span>
                {seleccionados.size > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {seleccionados.size} seleccionados
                  </Badge>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {clientesInactivos.map((cliente) => (
                  <div
                    key={cliente.clienteId}
                    className="flex items-start gap-3 p-4 rounded-lg border hover-elevate"
                    data-testid={`inactive-client-${cliente.clienteId}`}
                  >
                    <Checkbox
                      checked={seleccionados.has(cliente.clienteId)}
                      onCheckedChange={() => toggleCliente(cliente.clienteId)}
                      data-testid={`checkbox-client-${cliente.clienteId}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{cliente.clienteNombre}</span>
                            <span className="text-muted-foreground">–</span>
                            <span className="text-sm text-muted-foreground">{cliente.mascotaNombre}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {cliente.clienteTelefono} · {cliente.clienteEmail}
                          </div>
                        </div>
                        <Badge variant={getInactividadColor(cliente.diasInactivo)}>
                          {cliente.diasInactivo} días inactivo
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarIcon className="w-3 h-3" />
                        <span>
                          Última cita: {format(cliente.ultimaVisita, "dd/MM/yyyy", { locale: es })}
                        </span>
                        <span>·</span>
                        <span>{formatDistanceToNow(cliente.ultimaVisita, { locale: es, addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {clientesInactivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mensaje de Reactivación</CardTitle>
            <CardDescription>
              Personaliza el mensaje o usa la plantilla sugerida por Fido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plantilla sugerida por Fido:</label>
              <div className="p-3 bg-muted rounded-lg text-sm italic">
                {generarMensajeSugerido()}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje personalizado (opcional):</label>
              <Textarea
                placeholder="Escribe un mensaje personalizado o deja vacío para usar la plantilla sugerida..."
                value={mensajePersonalizado}
                onChange={(e) => setMensajePersonalizado(e.target.value)}
                rows={4}
                data-testid="textarea-custom-message"
              />
              <p className="text-xs text-muted-foreground">
                Puedes usar variables como [nombre] y [mascota] que se reemplazarán automáticamente
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={enviarCampana}
                disabled={seleccionados.size === 0 || enviado}
                className="gap-2"
                data-testid="button-send-campaign"
              >
                {enviado ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Enviado
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Mensajes ({seleccionados.size})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
