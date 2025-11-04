import { useState } from "react";
import { Calendar, Filter } from "lucide-react";
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
import { AddEventDialog } from "@/components/AddEventDialog";
import { EmptyState } from "@/components/EmptyState";
import emptyCalendarImage from "@assets/generated_images/Empty_calendar_with_paw_3920e332.png";

interface Event {
  id: number;
  mascota: string;
  propietario: string;
  tipo: string;
  fecha: string;
  hora: string;
  descripcion: string;
  pasado: boolean;
}

export default function Eventos() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const events: Event[] = [
    {
      id: 1,
      mascota: "Max",
      propietario: "Juan Pérez",
      tipo: "Vacunación",
      fecha: "2025-11-05",
      hora: "10:00",
      descripcion: "Vacuna antirrábica anual",
      pasado: false,
    },
    {
      id: 2,
      mascota: "Luna",
      propietario: "María García",
      tipo: "Consulta",
      fecha: "2025-11-05",
      hora: "14:30",
      descripcion: "Revisión general de salud",
      pasado: false,
    },
    {
      id: 3,
      mascota: "Rocky",
      propietario: "Carlos López",
      tipo: "Revisión",
      fecha: "2025-11-06",
      hora: "09:00",
      descripcion: "Control post-operatorio",
      pasado: false,
    },
    {
      id: 4,
      mascota: "Max",
      propietario: "Juan Pérez",
      tipo: "Consulta",
      fecha: "2025-11-01",
      hora: "11:00",
      descripcion: "Problema digestivo",
      pasado: true,
    },
    {
      id: 5,
      mascota: "Luna",
      propietario: "María García",
      tipo: "Vacunación",
      fecha: "2025-10-28",
      hora: "15:00",
      descripcion: "Triple felina",
      pasado: true,
    },
    {
      id: 6,
      mascota: "Milo",
      propietario: "Ana Martínez",
      tipo: "Cirugía",
      fecha: "2025-10-20",
      hora: "09:30",
      descripcion: "Esterilización",
      pasado: true,
    },
  ];

  const filteredEvents = events.filter((event) => {
    if (filter === "upcoming") return !event.pasado;
    if (filter === "past") return event.pasado;
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historial y próximas visitas programadas
          </p>
        </div>
        <AddEventDialog />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[200px]" data-testid="select-event-filter">
              <SelectValue placeholder="Filtrar eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Eventos</SelectItem>
              <SelectItem value="upcoming">Próximos</SelectItem>
              <SelectItem value="past">Pasados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredEvents.length} eventos encontrados</span>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No hay eventos para mostrar"
              description="No se encontraron eventos con los filtros seleccionados."
              imageSrc={emptyCalendarImage}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Lista de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-wrap gap-4 p-4 rounded-md border bg-card hover-elevate active-elevate-2"
                  data-testid={`event-item-${event.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-3 min-w-[70px]">
                      <span className="text-xs font-medium text-primary uppercase">
                        {new Date(event.fecha).toLocaleDateString("es-ES", { month: "short" })}
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {new Date(event.fecha).getDate()}
                      </span>
                      <span className="text-xs text-muted-foreground">{event.hora}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{event.mascota}</h4>
                        <Badge variant={getEventTypeColor(event.tipo)} className="text-xs">
                          {event.tipo}
                        </Badge>
                        {event.pasado && (
                          <Badge variant="outline" className="text-xs">
                            Pasado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {event.propietario}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{event.descripcion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log("Ver detalles", event.id)}
                      data-testid={`button-view-event-${event.id}`}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
