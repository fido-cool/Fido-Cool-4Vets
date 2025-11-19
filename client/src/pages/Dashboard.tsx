import { Users, Heart, Calendar, Clock, ChevronDown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddClientDialog } from "@/components/AddClientDialog";
import { AddEventDialog } from "@/components/AddEventDialog";
import emptyCalendarImage from "@assets/generated_images/Empty_calendar_with_paw_3920e332.png";
import type { Evento, Mascota } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { isWithinInterval, startOfDay, addDays } from "date-fns";

interface Stats {
  totalClientes: number;
  totalMascotas: number;
  proximosEventos: number;
}

interface EventoWithMascota extends Evento {
  mascota?: Mascota & { cliente?: { nombre: string } };
}

type TimePeriod = "hoy" | "semana" | "mes" | "año";

const timePeriodLabels: Record<TimePeriod, string> = {
  hoy: "Hoy",
  semana: "Esta Semana",
  mes: "Este Mes",
  año: "Este Año",
};

const timePeriodDays: Record<TimePeriod, number> = {
  hoy: 0,
  semana: 7,
  mes: 30,
  año: 365,
};

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("semana");
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery<EventoWithMascota[]>({
    queryKey: ["/api/eventos/upcoming"],
  });

  const filteredEvents = useMemo(() => {
    const now = startOfDay(new Date());
    const days = timePeriodDays[timePeriod];
    
    if (timePeriod === "hoy") {
      const endOfToday = addDays(now, 1);
      return upcomingEvents.filter(event => {
        const eventDate = new Date(event.fecha);
        return isWithinInterval(eventDate, { start: now, end: endOfToday });
      });
    } else {
      const endDate = addDays(now, days);
      return upcomingEvents.filter(event => {
        const eventDate = new Date(event.fecha);
        return isWithinInterval(eventDate, { start: now, end: endDate });
      });
    }
  }, [upcomingEvents, timePeriod]);

  const addClientMutation = useMutation({
    mutationFn: async (data: {
      cliente: { nombre: string; telefono: string; email: string };
      mascotas?: Array<{ nombre: string; especie: string; raza?: string; fechaNacimiento?: string }>;
      primeraVisita?: {
        mascotaIndices: number[];
        tipos: string[];
        fecha: string;
        hora?: string;
        descripcion?: string;
      };
    }) => {
      return await apiRequest("POST", "/api/clientes/with-mascotas", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mascotas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      // Also invalidate events if they were created
      if (data?.eventos && data.eventos.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/eventos/upcoming"] });
      }
      
      const mascotasCount = data?.mascotas?.length || 0;
      const eventosCount = data?.eventos?.length || 0;
      
      let description = "";
      if (mascotasCount > 0 && eventosCount > 0) {
        description = `Cliente, ${mascotasCount} mascota(s) y ${eventosCount} evento(s) registrados exitosamente.`;
      } else if (mascotasCount > 0) {
        description = `Cliente y ${mascotasCount} mascota(s) registrados exitosamente.`;
      } else {
        description = "El cliente ha sido registrado exitosamente.";
      }
      
      toast({
        title: "Cliente agregado",
        description,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (events: { mascotaIds: number[]; tipos: string[]; fecha: string; descripcion: string }) => {
      return await apiRequest("POST", "/api/eventos", events);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eventos/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      const count = data?.count || 0;
      toast({
        title: "Citas agendadas",
        description: `Se ${count === 1 ? 'ha agendado' : 'han agendado'} ${count} cita${count > 1 ? 's' : ''} exitosamente.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agendar la(s) cita(s). Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
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
          <AddClientDialog 
            open={isClientDialogOpen}
            onOpenChange={setIsClientDialogOpen}
            onAdd={(data) => addClientMutation.mutate(data)}
          />
          <AddEventDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen} 
            onAdd={(event) => addMutation.mutate(event)} 
          />
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Próximos Eventos
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-time-filter">
                {timePeriodLabels[timePeriod]}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setTimePeriod("hoy")}
                data-testid="filter-hoy"
              >
                Hoy
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTimePeriod("semana")}
                data-testid="filter-semana"
              >
                Esta Semana
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTimePeriod("mes")}
                data-testid="filter-mes"
              >
                Este Mes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTimePeriod("año")}
                data-testid="filter-año"
              >
                Este Año
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <img
                src={emptyCalendarImage}
                alt="Sin eventos"
                className="w-32 h-24 object-contain mb-4 opacity-80"
              />
              <p className="text-sm text-muted-foreground">
                No hay eventos programados para {timePeriodLabels[timePeriod].toLowerCase()}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
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
