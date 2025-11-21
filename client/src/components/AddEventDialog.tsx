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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, ChevronDown, X } from "lucide-react";
import type { Mascota, Cliente } from "@shared/schema";
import { estadosCita } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MascotaWithCliente extends Mascota {
  cliente?: Cliente;
}

interface AddEventDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd?: (events: {
    mascotaIds: number[];
    tipos: string[];
    fecha: string;
    descripcion: string;
    estado?: string;
  }) => void;
}

export function AddEventDialog({ open, onOpenChange, onAdd }: AddEventDialogProps) {
  const [clienteId, setClienteId] = useState("");
  const [mascotaIds, setMascotaIds] = useState<number[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [fechaSoloFecha, setFechaSoloFecha] = useState("");
  const [hora, setHora] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("programada");
  const [mascotaPopoverOpen, setMascotaPopoverOpen] = useState(false);
  const [tipoPopoverOpen, setTipoPopoverOpen] = useState(false);
  const { toast } = useToast();

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: mascotas = [], isLoading: isLoadingMascotas } = useQuery<MascotaWithCliente[]>({
    queryKey: ["/api/mascotas"],
  });

  const mascotasDelCliente = useMemo(() => {
    if (!clienteId) return [];
    return mascotas.filter(m => m.clienteId === parseInt(clienteId));
  }, [clienteId, mascotas]);

  const tiposDeServicio = [
    { value: "bano", label: "Baño" },
    { value: "bano_corte", label: "Baño y Corte" },
    { value: "chequeo", label: "Chequeo Médico" },
    { value: "vacunacion", label: "Vacunación" },
    { value: "cirugia", label: "Cirugía" },
    { value: "otro", label: "Otro" },
  ];

  const handleClienteChange = (value: string) => {
    setClienteId(value);
    setMascotaIds([]);
  };

  const toggleMascota = (mascotaId: number) => {
    setMascotaIds(prev => 
      prev.includes(mascotaId) 
        ? prev.filter(id => id !== mascotaId)
        : [...prev, mascotaId]
    );
  };

  const toggleTipo = (tipo: string) => {
    setTipos(prev => 
      prev.includes(tipo)
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
  };

  const removeMascota = (mascotaId: number) => {
    setMascotaIds(prev => prev.filter(id => id !== mascotaId));
  };

  const removeTipo = (tipo: string) => {
    setTipos(prev => prev.filter(t => t !== tipo));
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
    
    if (mascotaIds.length === 0) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar al menos una mascota.",
        variant: "destructive",
      });
      return;
    }
    
    if (tipos.length === 0) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar al menos un tipo de servicio.",
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
        mascotaIds,
        tipos,
        fecha: parsedDate.toISOString(), 
        descripcion: descripcion.trim() || "Cita programada",
        estado 
      });
      
      setClienteId("");
      setMascotaIds([]);
      setTipos([]);
      setFechaSoloFecha("");
      setHora("");
      setDescripcion("");
      setEstado("programada");
      onOpenChange?.(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setClienteId("");
      setMascotaIds([]);
      setTipos([]);
      setFechaSoloFecha("");
      setHora("");
      setDescripcion("");
      setEstado("programada");
      setMascotaPopoverOpen(false);
      setTipoPopoverOpen(false);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-event" onClick={() => onOpenChange?.(true)}>
          <Calendar className="w-4 h-4 mr-2" />
          Registrar Cita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar visita o Agendar una nueva cita</DialogTitle>
          <DialogDescription>
            Registra una visita pasada o agenda una cita futura con un cliente
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
                  {isLoadingClientes ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Cargando clientes...
                    </div>
                  ) : clientes.length === 0 ? (
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
              <Label htmlFor="mascota">Mascotas (selección múltiple)</Label>
              <Popover open={mascotaPopoverOpen} onOpenChange={setMascotaPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={!clienteId}
                    className="w-full justify-between"
                    data-testid="select-event-pets"
                  >
                    <span className="truncate">
                      {mascotaIds.length === 0
                        ? "Selecciona mascotas"
                        : `${mascotaIds.length} mascota${mascotaIds.length > 1 ? 's' : ''} seleccionada${mascotaIds.length > 1 ? 's' : ''}`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-64 overflow-y-auto p-2">
                    {isLoadingMascotas && clienteId ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Cargando mascotas...
                      </div>
                    ) : mascotasDelCliente.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {clienteId ? "Este cliente no tiene mascotas registradas" : "Selecciona primero un dueño"}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {mascotasDelCliente.map((mascota) => (
                          <div
                            key={mascota.id}
                            className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover-elevate"
                            data-testid={`checkbox-pet-${mascota.id}`}
                          >
                            <Checkbox
                              checked={mascotaIds.includes(mascota.id)}
                              onCheckedChange={() => toggleMascota(mascota.id)}
                            />
                            <label
                              className="flex-1 cursor-pointer text-sm"
                              onClick={() => toggleMascota(mascota.id)}
                            >
                              {mascota.nombre}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {mascotaIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2" data-testid="selected-pets-badges">
                  {mascotaIds.map((id) => {
                    const mascota = mascotasDelCliente.find(m => m.id === id);
                    return mascota ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {mascota.nombre}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeMascota(id)}
                          data-testid={`remove-pet-${id}`}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
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
              <Label htmlFor="tipo">Servicios (selección múltiple)</Label>
              <Popover open={tipoPopoverOpen} onOpenChange={setTipoPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    data-testid="select-event-types"
                  >
                    <span className="truncate">
                      {tipos.length === 0
                        ? "Selecciona servicios"
                        : `${tipos.length} servicio${tipos.length > 1 ? 's' : ''} seleccionado${tipos.length > 1 ? 's' : ''}`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-64 overflow-y-auto p-2">
                    <div className="space-y-1">
                      {tiposDeServicio.map((servicio) => (
                        <div
                          key={servicio.value}
                          className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover-elevate"
                          data-testid={`checkbox-service-${servicio.value}`}
                        >
                          <Checkbox
                            checked={tipos.includes(servicio.value)}
                            onCheckedChange={() => toggleTipo(servicio.value)}
                          />
                          <label
                            className="flex-1 cursor-pointer text-sm"
                            onClick={() => toggleTipo(servicio.value)}
                          >
                            {servicio.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {tipos.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2" data-testid="selected-services-badges">
                  {tipos.map((tipo) => {
                    const servicio = tiposDeServicio.find(s => s.value === tipo);
                    return servicio ? (
                      <Badge key={tipo} variant="secondary" className="gap-1">
                        {servicio.label}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTipo(tipo)}
                          data-testid={`remove-service-${tipo}`}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado de la Cita</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger id="estado" data-testid="select-event-estado">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(estadosCita).map(([key, value]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      data-testid={`select-item-estado-${key}`}
                    >
                      {value.label}
                    </SelectItem>
                  ))}
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
              Registrar Cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
