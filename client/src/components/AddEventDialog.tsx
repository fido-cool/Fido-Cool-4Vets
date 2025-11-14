import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import type { Mascota, Cliente } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MascotaWithCliente extends Mascota {
  cliente?: Cliente;
}

interface AddEventDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd?: (event: {
    mascotaId: number;
    tipo: string;
    fecha: string;
    descripcion: string;
  }) => void;
}

export function AddEventDialog({ open, onOpenChange, onAdd }: AddEventDialogProps) {
  const [mascotaId, setMascotaId] = useState("");
  const [tipo, setTipo] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const { toast } = useToast();

  const { data: mascotas = [] } = useQuery<MascotaWithCliente[]>({
    queryKey: ["/api/mascotas"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mascotaId || mascotaId.trim() === "") {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar una mascota.",
        variant: "destructive",
      });
      return;
    }
    
    if (!tipo || tipo.trim() === "") {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar el tipo de evento.",
        variant: "destructive",
      });
      return;
    }
    
    if (!fecha || fecha.trim() === "") {
      toast({
        title: "Error de validación",
        description: "Debes ingresar la fecha y hora del evento.",
        variant: "destructive",
      });
      return;
    }
    
    const parsedDate = new Date(fecha);
    if (isNaN(parsedDate.getTime())) {
      toast({
        title: "Error de validación",
        description: "La fecha ingresada no es válida.",
        variant: "destructive",
      });
      return;
    }
    
    if (!descripcion.trim()) {
      toast({
        title: "Error de validación",
        description: "La descripción del evento es obligatoria.",
        variant: "destructive",
      });
      return;
    }
    
    if (onAdd) {
      onAdd({ mascotaId: parseInt(mascotaId), tipo, fecha, descripcion });
      
      setMascotaId("");
      setTipo("");
      setFecha("");
      setDescripcion("");
      onOpenChange?.(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMascotaId("");
      setTipo("");
      setFecha("");
      setDescripcion("");
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-event" onClick={() => onOpenChange?.(true)}>
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
                  {mascotas.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No hay mascotas registradas
                    </div>
                  ) : (
                    mascotas.map((mascota) => (
                      <SelectItem key={mascota.id} value={mascota.id.toString()}>
                        {mascota.nombre} ({mascota.cliente?.nombre || "Sin dueño"})
                      </SelectItem>
                    ))
                  )}
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
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-event" disabled={!mascotaId || mascotas.length === 0}>
              Registrar Evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
