import { Users, Heart, Calendar, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddClientDialog } from "@/components/AddClientDialog";
import { AddPetDialog } from "@/components/AddPetDialog";
import { AddEventDialog } from "@/components/AddEventDialog";
import emptyCalendarImage from "@assets/generated_images/Empty_calendar_with_paw_3920e332.png";
import type { Evento, Mascota } from "@shared/schema";

interface Stats {
  totalClientes: number;
  totalMascotas: number;
  proximosEventos: number;
}

interface EventoWithMascota extends Evento {
  mascota?: Mascota & { cliente?: { nombre: string } };
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery<EventoWithMascota[]>({
    queryKey: ["/api/eventos/upcoming"],
  });

  const isLoading = statsLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen de tu práctica veterinaria
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <AddClientDialog />
          <AddPetDialog />
          <AddEventDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Clientes"
          value={stats?.totalClientes || 0}
          icon={Users}
          testId="metric-total-clients"
        />
        <MetricCard
          title="Total Mascotas"
          value={stats?.totalMascotas || 0}
          icon={Heart}
          testId="metric-total-pets"
        />
        <MetricCard
          title="Próximos Eventos"
          value={stats?.proximosEventos || 0}
          icon={Calendar}
          testId="metric-upcoming-events"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <img
                src={emptyCalendarImage}
                alt="Sin eventos"
                className="w-32 h-24 object-contain mb-4 opacity-80"
              />
              <p className="text-sm text-muted-foreground">No hay eventos programados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.fecha);
                return (
                  <div
                    key={event.id}
                    className="flex flex-wrap items-center gap-4 p-4 rounded-md hover-elevate active-elevate-2 border bg-card"
                    data-testid={`event-${event.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-3 min-w-[60px]">
                        <span className="text-xs font-medium text-primary uppercase">
                          {eventDate.toLocaleDateString("es-ES", { month: "short" })}
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {eventDate.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground">{event.mascota?.nombre || "Mascota"}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {event.mascota?.cliente?.nombre || "Propietario desconocido"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getEventTypeColor(event.tipo)} className="whitespace-nowrap">
                        {event.tipo}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                        <Clock className="w-4 h-4" />
                        <span>
                          {eventDate.toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
