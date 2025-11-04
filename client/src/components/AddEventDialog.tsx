import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";

interface AddEventDialogProps {
  onAdd?: (event: {
    mascotaId: string;
    tipo: string;
    fecha: string;
    descripcion: string;
  }) => void;
}

export function AddEventDialog({ onAdd }: AddEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [mascotaId, setMascotaId] = useState("");
  const [tipo, setTipo] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAdd) {
      onAdd({ mascotaId, tipo, fecha, descripcion });
      console.log("Evento agregado:", { mascotaId, tipo, fecha, descripcion });
    }
    setMascotaId("");
    setTipo("");
    setFecha("");
    setDescripcion("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-event">
          <Calendar className="w-4 h-4 mr-2" />
          Nuevo Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Evento</DialogTitle>
          <DialogDescription>
            Registra una visita realizada o programa un evento futuro para una mascota.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="mascota">Mascota</Label>
              <Select value={mascotaId} onValueChange={setMascotaId} required>
                <SelectTrigger id="mascota" data-testid="select-event-pet">
                  <SelectValue placeholder="Selecciona una mascota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Max (Juan Pérez)</SelectItem>
                  <SelectItem value="2">Luna (María García)</SelectItem>
                  <SelectItem value="3">Rocky (Carlos López)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Evento</Label>
              <Select value={tipo} onValueChange={setTipo} required>
                <SelectTrigger id="tipo" data-testid="select-event-type">
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta General</SelectItem>
                  <SelectItem value="vacunacion">Vacunación</SelectItem>
                  <SelectItem value="cirugia">Cirugía</SelectItem>
                  <SelectItem value="revision">Revisión</SelectItem>
                  <SelectItem value="urgencia">Urgencia</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha y Hora</Label>
              <Input
                id="fecha"
                type="datetime-local"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                data-testid="input-event-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Detalles del evento, diagnóstico, tratamiento..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="resize-none"
                rows={4}
                data-testid="input-event-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-event">
              Registrar Evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
