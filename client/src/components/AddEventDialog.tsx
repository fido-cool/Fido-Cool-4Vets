import { useState, useMemo } from "react";
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
  const [clienteId, setClienteId] = useState("");
  const [mascotaId, setMascotaId] = useState("");
  const [tipo, setTipo] = useState("");
  const [fechaSoloFecha, setFechaSoloFecha] = useState("");
  const [hora, setHora] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const { toast } = useToast();

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: mascotas = [] } = useQuery<MascotaWithCliente[]>({
    queryKey: ["/api/mascotas"],
  });

  const mascotasDelCliente = useMemo(() => {
    if (!clienteId) return [];
    return mascotas.filter(m => m.clienteId === parseInt(clienteId));
  }, [clienteId, mascotas]);

  const handleClienteChange = (value: string) => {
    setClienteId(value);
    setMascotaId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId || clienteId.trim() === "") {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar un dueño.",
        variant: "destructive",
      });
      return;
    }
    
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
        description: "Debes seleccionar el tipo de servicio.",
        variant: "destructive",
      });
      return;
    }
    
    if (!fechaSoloFecha || fechaSoloFecha.trim() === "") {
      toast({
        title: "Error de validación",
        description: "Debes ingresar la fecha de la cita.",
        variant: "destructive",
      });
      return;
    }
    
    let fechaCompleta = fechaSoloFecha;
    if (hora && hora.trim() !== "") {
      fechaCompleta = `${fechaSoloFecha}T${hora}`;
    } else {
      fechaCompleta = `${fechaSoloFecha}T09:00`;
    }
    
    const parsedDate = new Date(fechaCompleta);
    if (isNaN(parsedDate.getTime())) {
      toast({
        title: "Error de validación",
        description: "La fecha ingresada no es válida.",
        variant: "destructive",
      });
      return;
    }
    
    if (onAdd) {
      onAdd({ 
        mascotaId: parseInt(mascotaId), 
        tipo, 
        fecha: parsedDate.toISOString(), 
        descripcion: descripcion.trim() || "Cita programada" 
      });
      
      setClienteId("");
      setMascotaId("");
      setTipo("");
      setFechaSoloFecha("");
      setHora("");
      setDescripcion("");
      onOpenChange?.(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setClienteId("");
      setMascotaId("");
      setTipo("");
      setFechaSoloFecha("");
      setHora("");
      setDescripcion("");
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-event" onClick={() => onOpenChange?.(true)}>
          <Calendar className="w-4 h-4 mr-2" />
          Agendar Cita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agendar una cita</DialogTitle>
          <DialogDescription>
            Agenda una próxima cita con un cliente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Dueño</Label>
              <Select value={clienteId} onValueChange={handleClienteChange} required>
                <SelectTrigger id="cliente" data-testid="select-event-client">
                  <SelectValue placeholder="Selecciona un dueño" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No hay clientes registrados
                    </div>
                  ) : (
                    clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mascota">Mascota</Label>
              <Select value={mascotaId} onValueChange={setMascotaId} required disabled={!clienteId}>
                <SelectTrigger id="mascota" data-testid="select-event-pet">
                  <SelectValue placeholder="Selecciona una mascota" />
                </SelectTrigger>
                <SelectContent>
                  {mascotasDelCliente.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {clienteId ? "Este cliente no tiene mascotas registradas" : "Selecciona primero un dueño"}
                    </div>
                  ) : (
                    mascotasDelCliente.map((mascota) => (
                      <SelectItem key={mascota.id} value={mascota.id.toString()}>
                        {mascota.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fechaSoloFecha}
                  onChange={(e) => setFechaSoloFecha(e.target.value)}
                  required
                  data-testid="input-event-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">
                  Hora <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  data-testid="input-event-time"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Servicio</Label>
              <Select value={tipo} onValueChange={setTipo} required>
                <SelectTrigger id="tipo" data-testid="select-event-type">
                  <SelectValue placeholder="Tipo de servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bano">Baño</SelectItem>
                  <SelectItem value="bano_corte">Baño y Corte</SelectItem>
                  <SelectItem value="chequeo">Chequeo Médico</SelectItem>
                  <SelectItem value="vacunacion">Vacunación</SelectItem>
                  <SelectItem value="cirugia">Cirugía</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Notas adicionales sobre la cita (opcional)..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="resize-none"
                rows={3}
                data-testid="input-event-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} data-testid="button-cancel-event">
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-event">
              Agendar Cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
