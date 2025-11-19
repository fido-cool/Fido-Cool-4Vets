import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddEventDialog } from "@/components/AddEventDialog";
import { serviceTypes } from "@shared/schema";
import type { Evento, Mascota, Cliente } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EventoConDetalles extends Evento {
  mascota: {
    id: number;
    nombre: string;
    cliente: {
      id: number;
      nombre: string;
    };
  };
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  tipo: string;
  color: string;
  mascotaId: number;
  mascotaNombre: string;
  clienteNombre: string;
}

export default function Calendario() {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const { toast } = useToast();

  const { data: eventos, isLoading } = useQuery<EventoConDetalles[]>({
    queryKey: ["/api/eventos"],
  });

  const addMutation = useMutation({
    mutationFn: async (event: { mascotaId: number; tipo: string; fecha: string; descripcion: string }) => {
      await apiRequest("POST", "/api/eventos", event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eventos/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Cita agendada",
        description: "La cita ha sido agendada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agendar la cita. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const calendarEvents: CalendarEvent[] =
    eventos?.map((evento) => {
      const start = new Date(evento.fecha);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      
      const tipo = evento.tipo as keyof typeof serviceTypes;
      const color = serviceTypes[tipo]?.color || serviceTypes.otro.color;

      return {
        id: evento.id,
        title: `${evento.mascota.nombre} - ${evento.mascota.cliente.nombre}`,
        start,
        end,
        tipo: serviceTypes[tipo]?.label || evento.tipo,
        color,
        mascotaId: evento.mascota.id,
        mascotaNombre: evento.mascota.nombre,
        clienteNombre: evento.mascota.cliente.nombre,
      };
    }) || [];

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="text-xs p-1">
      <div className="font-medium">{event.mascotaNombre}</div>
      <div className="text-white/90">{event.clienteNombre}</div>
      <div className="text-white/80 italic">{event.tipo}</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Cargando calendario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <CalendarIcon className="h-8 w-8" />
            Calendario de Citas
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualiza y gestiona todas tus citas programadas
          </p>
        </div>
        <Button
          onClick={() => setShowAddEvent(true)}
          className="gap-2"
          data-testid="button-add-event"
        >
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      <Card className="p-6">
        <div style={{ height: "700px" }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={["month", "week", "day"]}
            messages={{
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "No hay citas en este rango de fechas",
              showMore: (total) => `+ Ver más (${total})`,
            }}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
            }}
            culture="es"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="text-sm font-medium">Tipos de servicio:</div>
          {Object.entries(serviceTypes).map(([key, { label, color }]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      <AddEventDialog
        open={showAddEvent}
        onOpenChange={setShowAddEvent}
        onAdd={(event) => addMutation.mutate(event)}
      />
    </div>
  );
}
