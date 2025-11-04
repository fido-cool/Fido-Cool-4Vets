import { Users, Heart, Calendar, Clock } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddClientDialog } from "@/components/AddClientDialog";
import { AddPetDialog } from "@/components/AddPetDialog";
import { AddEventDialog } from "@/components/AddEventDialog";
import emptyCalendarImage from "@assets/generated_images/Empty_calendar_with_paw_3920e332.png";

export default function Dashboard() {
  const upcomingEvents = [
    {
      id: 1,
      petName: "Max",
      ownerName: "Juan Pérez",
      type: "Vacunación",
      date: "2025-11-05",
      time: "10:00",
    },
    {
      id: 2,
      petName: "Luna",
      ownerName: "María García",
      type: "Consulta",
      date: "2025-11-05",
      time: "14:30",
    },
    {
      id: 3,
      petName: "Rocky",
      ownerName: "Carlos López",
      type: "Revisión",
      date: "2025-11-06",
      time: "09:00",
    },
    {
      id: 4,
      petName: "Milo",
      ownerName: "Ana Martínez",
      type: "Cirugía",
      date: "2025-11-07",
      time: "11:00",
    },
  ];

  const totalClients = 24;
  const totalPets = 38;
  const upcomingEventsCount = upcomingEvents.length;

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
          value={totalClients}
          icon={Users}
          testId="metric-total-clients"
        />
        <MetricCard
          title="Total Mascotas"
          value={totalPets}
          icon={Heart}
          testId="metric-total-pets"
        />
        <MetricCard
          title="Próximos Eventos"
          value={upcomingEventsCount}
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
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-wrap items-center gap-4 p-4 rounded-md hover-elevate active-elevate-2 border bg-card"
                  data-testid={`event-${event.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-3 min-w-[60px]">
                      <span className="text-xs font-medium text-primary uppercase">
                        {new Date(event.date).toLocaleDateString("es-ES", { month: "short" })}
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground">{event.petName}</h4>
                      <p className="text-sm text-muted-foreground truncate">{event.ownerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {event.type}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
