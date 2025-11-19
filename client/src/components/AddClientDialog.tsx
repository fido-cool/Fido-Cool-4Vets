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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Pet {
  nombre: string;
  especie: string;
  raza: string;
  fechaNacimiento: string;
}

interface AddClientDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd?: (data: {
    cliente: { nombre: string; telefono: string; email: string };
    mascotas?: Array<{ nombre: string; especie: string; raza?: string; fechaNacimiento?: string }>;
    primeraVisita?: {
      mascotaIndices: number[];
      tipos: string[];
      fecha: string;
      descripcion: string;
    };
  }) => void;
}

export function AddClientDialog({ open, onOpenChange, onAdd }: AddClientDialogProps) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [agregarMascotas, setAgregarMascotas] = useState(false);
  const [mascotas, setMascotas] = useState<Pet[]>([
    { nombre: "", especie: "", raza: "", fechaNacimiento: "" },
  ]);
  
  // Estados para registrar primera visita
  const [registrarVisita, setRegistrarVisita] = useState(false);
  const [mascotasSeleccionadas, setMascotasSeleccionadas] = useState<number[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);
  const [fechaVisita, setFechaVisita] = useState("");
  const [horaVisita, setHoraVisita] = useState("");
  const [descripcionVisita, setDescripcionVisita] = useState("");
  const [serviciosPopoverOpen, setServiciosPopoverOpen] = useState(false);
  
  const { toast } = useToast();
  
  const tiposDeServicio = [
    { value: "bano", label: "Baño" },
    { value: "bano_corte", label: "Baño y Corte" },
    { value: "chequeo", label: "Chequeo Médico" },
    { value: "vacunacion", label: "Vacunación" },
    { value: "cirugia", label: "Cirugía" },
    { value: "otro", label: "Otro" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !telefono || !email) {
      toast({
        title: "Error de validación",
        description: "Todos los campos del cliente son requeridos.",
        variant: "destructive",
      });
      return;
    }

    if (agregarMascotas) {
      const mascotasValidas = mascotas.filter(
        (m) => m.nombre.trim() !== "" && m.especie.trim() !== ""
      );

      if (mascotasValidas.length === 0) {
        toast({
          title: "Error de validación",
          description: "Si deseas agregar mascotas, completa al menos el nombre y especie de una mascota.",
          variant: "destructive",
        });
        return;
      }

      // Validación de primera visita si está activada
      if (registrarVisita) {
        if (mascotasSeleccionadas.length === 0) {
          toast({
            title: "Error de validación",
            description: "Selecciona al menos una mascota para la visita.",
            variant: "destructive",
          });
          return;
        }

        if (serviciosSeleccionados.length === 0) {
          toast({
            title: "Error de validación",
            description: "Selecciona al menos un servicio para la visita.",
            variant: "destructive",
          });
          return;
        }

        if (!fechaVisita) {
          toast({
            title: "Error de validación",
            description: "La fecha de la visita es requerida.",
            variant: "destructive",
          });
          return;
        }
      }

      const mascotasData = mascotasValidas.map((m) => ({
        nombre: m.nombre,
        especie: m.especie,
        raza: m.raza || undefined,
        fechaNacimiento: m.fechaNacimiento || undefined,
      }));

      // Construir datos para la primera visita
      let primeraVisitaData;
      if (registrarVisita) {
        // Create a mapping from original index to filtered index
        const originalToFilteredIndex = new Map<number, number>();
        let filteredIdx = 0;
        mascotas.forEach((m, originalIdx) => {
          if (m.nombre.trim() !== "" && m.especie.trim() !== "") {
            originalToFilteredIndex.set(originalIdx, filteredIdx);
            filteredIdx++;
          }
        });
        
        // Remap selected indices to filtered array indices
        const remappedIndices = mascotasSeleccionadas
          .map(originalIdx => originalToFilteredIndex.get(originalIdx))
          .filter((idx): idx is number => idx !== undefined);
        
        primeraVisitaData = {
          mascotaIndices: remappedIndices,
          tipos: serviciosSeleccionados,
          fecha: fechaVisita,
          hora: horaVisita || undefined,
          descripcion: descripcionVisita.trim() || undefined,
        };
      }

      if (onAdd) {
        onAdd({
          cliente: { nombre, telefono, email },
          mascotas: mascotasData,
          primeraVisita: primeraVisitaData,
        });
      }
    } else {
      if (onAdd) {
        onAdd({
          cliente: { nombre, telefono, email },
        });
      }
    }

    resetForm();
    onOpenChange?.(false);
  };

  const resetForm = () => {
    setNombre("");
    setTelefono("");
    setEmail("");
    setAgregarMascotas(false);
    setMascotas([{ nombre: "", especie: "", raza: "", fechaNacimiento: "" }]);
    setRegistrarVisita(false);
    setMascotasSeleccionadas([]);
    setServiciosSeleccionados([]);
    setFechaVisita("");
    setHoraVisita("");
    setDescripcionVisita("");
  };
  
  const toggleMascota = (index: number) => {
    setMascotasSeleccionadas(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };
  
  const toggleServicio = (tipo: string) => {
    setServiciosSeleccionados(prev =>
      prev.includes(tipo)
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange?.(newOpen);
  };

  const addMascota = () => {
    setMascotas([...mascotas, { nombre: "", especie: "", raza: "", fechaNacimiento: "" }]);
  };

  const removeMascota = (index: number) => {
    if (mascotas.length > 1) {
      setMascotas(mascotas.filter((_, i) => i !== index));
    }
  };

  const updateMascota = (index: number, field: keyof Pet, value: string) => {
    const updatedMascotas = [...mascotas];
    updatedMascotas[index][field] = value;
    setMascotas(updatedMascotas);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-client" onClick={() => onOpenChange?.(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del dueño de la mascota. Opcionalmente, puedes registrar sus mascotas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Información del Cliente</h3>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  placeholder="Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  data-testid="input-client-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  data-testid="input-client-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-client-email"
                />
              </div>
            </div>

            {/* Add Pet Option */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <input
                type="checkbox"
                id="agregar-mascotas"
                checked={agregarMascotas}
                onChange={(e) => setAgregarMascotas(e.target.checked)}
                className="h-4 w-4 rounded border-input"
                data-testid="checkbox-add-pets"
              />
              <Label htmlFor="agregar-mascotas" className="text-sm font-medium cursor-pointer">
                ¿Deseas registrar mascota(s)?
              </Label>
            </div>

            {/* Pets Section */}
            {agregarMascotas && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Mascotas</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMascota}
                    className="gap-2"
                    data-testid="button-add-another-pet"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar otra
                  </Button>
                </div>

                {mascotas.map((mascota, index) => (
                  <div
                    key={index}
                    className="space-y-3 p-4 border rounded-md bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Mascota {index + 1}
                      </span>
                      {mascotas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMascota(index)}
                          data-testid={`button-remove-pet-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`mascota-nombre-${index}`}>Nombre</Label>
                        <Input
                          id={`mascota-nombre-${index}`}
                          placeholder="Rex"
                          value={mascota.nombre}
                          onChange={(e) => updateMascota(index, "nombre", e.target.value)}
                          data-testid={`input-pet-name-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`mascota-especie-${index}`}>Especie</Label>
                        <Select
                          value={mascota.especie}
                          onValueChange={(value) => updateMascota(index, "especie", value)}
                        >
                          <SelectTrigger
                            id={`mascota-especie-${index}`}
                            data-testid={`select-pet-species-${index}`}
                          >
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="perro">Perro</SelectItem>
                            <SelectItem value="gato">Gato</SelectItem>
                            <SelectItem value="ave">Ave</SelectItem>
                            <SelectItem value="roedor">Roedor</SelectItem>
                            <SelectItem value="reptil">Reptil</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`mascota-raza-${index}`}>
                          Raza <span className="text-muted-foreground text-xs">(opcional)</span>
                        </Label>
                        <Input
                          id={`mascota-raza-${index}`}
                          placeholder="Labrador"
                          value={mascota.raza}
                          onChange={(e) => updateMascota(index, "raza", e.target.value)}
                          data-testid={`input-pet-breed-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`mascota-fecha-${index}`}>
                          Fecha de Nacimiento <span className="text-muted-foreground text-xs">(opcional)</span>
                        </Label>
                        <Input
                          id={`mascota-fecha-${index}`}
                          type="date"
                          value={mascota.fechaNacimiento}
                          onChange={(e) => updateMascota(index, "fechaNacimiento", e.target.value)}
                          data-testid={`input-pet-birthdate-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Registrar Primera Visita Option */}
            {agregarMascotas && mascotas.some(m => m.nombre.trim() && m.especie.trim()) && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="registrar-visita"
                    checked={registrarVisita}
                    onCheckedChange={(checked) => setRegistrarVisita(checked as boolean)}
                    data-testid="checkbox-register-visit"
                  />
                  <Label htmlFor="registrar-visita" className="text-sm font-medium cursor-pointer">
                    Registrar primera visita (opcional)
                  </Label>
                </div>
              </>
            )}
            
            {/* Primera Visita Section */}
            {registrarVisita && agregarMascotas && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">Datos de la Primera Visita</h3>
                
                {/* Selección de Mascotas para la visita */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mascotas a atender</Label>
                  <div className="space-y-2">
                    {mascotas.map((mascota, index) => {
                      if (!mascota.nombre.trim() || !mascota.especie.trim()) return null;
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`visita-mascota-${index}`}
                            checked={mascotasSeleccionadas.includes(index)}
                            onCheckedChange={() => toggleMascota(index)}
                            data-testid={`checkbox-visit-pet-${index}`}
                          />
                          <Label
                            htmlFor={`visita-mascota-${index}`}
                            className="text-sm cursor-pointer"
                            onClick={() => toggleMascota(index)}
                          >
                            {mascota.nombre} ({mascota.especie})
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Selección de Servicios */}
                <div className="space-y-2">
                  <Label>Servicios (selección múltiple)</Label>
                  <Popover open={serviciosPopoverOpen} onOpenChange={setServiciosPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        type="button"
                        data-testid="select-visit-services"
                      >
                        <span className="truncate">
                          {serviciosSeleccionados.length === 0
                            ? "Selecciona servicios"
                            : `${serviciosSeleccionados.length} servicio${serviciosSeleccionados.length > 1 ? 's' : ''} seleccionado${serviciosSeleccionados.length > 1 ? 's' : ''}`}
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
                              data-testid={`checkbox-visit-service-${servicio.value}`}
                            >
                              <Checkbox
                                checked={serviciosSeleccionados.includes(servicio.value)}
                                onCheckedChange={() => toggleServicio(servicio.value)}
                              />
                              <label
                                className="flex-1 cursor-pointer text-sm"
                                onClick={() => toggleServicio(servicio.value)}
                              >
                                {servicio.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {serviciosSeleccionados.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {serviciosSeleccionados.map((tipo) => {
                        const servicio = tiposDeServicio.find(s => s.value === tipo);
                        return servicio ? (
                          <Badge key={tipo} variant="secondary" className="gap-1">
                            {servicio.label}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => toggleServicio(tipo)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                
                {/* Fecha y Hora */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-visita">Fecha</Label>
                    <Input
                      id="fecha-visita"
                      type="date"
                      value={fechaVisita}
                      onChange={(e) => setFechaVisita(e.target.value)}
                      data-testid="input-visit-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora-visita">
                      Hora <span className="text-muted-foreground text-xs">(opcional)</span>
                    </Label>
                    <Input
                      id="hora-visita"
                      type="time"
                      value={horaVisita}
                      onChange={(e) => setHoraVisita(e.target.value)}
                      data-testid="input-visit-time"
                    />
                  </div>
                </div>
                
                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion-visita">
                    Descripción <span className="text-muted-foreground text-xs">(opcional)</span>
                  </Label>
                  <Input
                    id="descripcion-visita"
                    placeholder="Notas sobre la visita..."
                    value={descripcionVisita}
                    onChange={(e) => setDescripcionVisita(e.target.value)}
                    data-testid="input-visit-description"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-client">
              Agregar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
