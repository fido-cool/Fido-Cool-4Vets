import { useState } from "react";
import { Calendar, Filter, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddEventDialog } from "@/components/AddEventDialog";
import { EmptyState } from "@/components/EmptyState";
import emptyCalendarImage from "@assets/generated_images/Empty_calendar_with_paw_3920e332.png";
import type { Evento, Mascota } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EventoWithMascota extends Evento {
  mascota?: Mascota & { cliente?: { nombre: string } };
}

export default function Eventos() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: eventos = [], isLoading } = useQuery<EventoWithMascota[]>({
    queryKey: ["/api/eventos"],
  });

  const addMutation = useMutation({
    mutationFn: async (event: { mascotaId: number; tipo: string; fecha: string; descripcion: string }) => {
      await apiRequest("POST", "/api/eventos", event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Evento registrado",
        description: "El evento ha sido registrado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar el evento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/eventos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado exitosamente.",
      });
      setDeleteEventId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const now = new Date();
  const filteredEvents = eventos.filter((event) => {
    const eventDate = new Date(event.fecha);
    const isPast = eventDate < now;

    if (filter === "upcoming") return !isPast;
    if (filter === "past") return isPast;
    return true;
  });

  const getEventTypeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "vacunación":
        return "default";
      case "consulta":
        return "secondary";
      case "cirugía":
        return "destructive";
      case "revisión":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historial y próximas visitas programadas
          </p>
        </div>
        <AddEventDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          onAdd={(event) => addMutation.mutate(event)} 
        />
      </div>

      {eventos.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No hay eventos registrados"
              description="Programa el primer evento para gestionar las visitas de tus pacientes."
              imageSrc={emptyCalendarImage}
              actionLabel="Agregar Evento"
              onAction={() => {}}
              actionTestId="button-empty-add-event"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[200px]" data-testid="select-event-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Eventos</SelectItem>
                <SelectItem value="upcoming">Próximos</SelectItem>
                <SelectItem value="past">Pasados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const eventDate = new Date(event.fecha);
              const isPast = eventDate < now;

              return (
                <Card key={event.id} className="hover-elevate" data-testid={`event-card-${event.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="flex items-center justify-center w-16 h-16 rounded-md bg-primary/10">
                          <Calendar className="w-8 h-8 text-primary" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-foreground" data-testid={`event-pet-${event.id}`}>
                              {event.mascota?.nombre || "Mascota desconocida"}
                            </h3>
                            <Badge variant={getEventTypeColor(event.tipo)} data-testid={`event-type-${event.id}`}>
                              {event.tipo}
                            </Badge>
                            {isPast && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Pasado
                              </Badge>
                            )}
                          </div>

                          {event.mascota?.cliente && (
                            <p className="text-sm text-muted-foreground">
                              Propietario: <span className="text-foreground">{event.mascota.cliente.nombre}</span>
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span data-testid={`event-date-${event.id}`}>
                              {eventDate.toLocaleDateString("es-ES", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            <span data-testid={`event-time-${event.id}`}>
                              {eventDate.toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {event.descripcion && (
                            <p className="text-sm text-muted-foreground pt-2" data-testid={`event-description-${event.id}`}>
                              {event.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteEventId(event.id)}
                        data-testid={`button-delete-event-${event.id}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredEvents.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No hay eventos {filter === "upcoming" ? "próximos" : filter === "past" ? "pasados" : ""} para mostrar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      <AlertDialog open={deleteEventId !== null} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente este evento médico.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-event">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEventId && deleteMutation.mutate(deleteEventId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-event"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
