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
import { Plus, X } from "lucide-react";
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
  const { toast } = useToast();

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

      const mascotasData = mascotasValidas.map((m) => ({
        nombre: m.nombre,
        especie: m.especie,
        raza: m.raza || undefined,
        fechaNacimiento: m.fechaNacimiento || undefined,
      }));

      if (onAdd) {
        onAdd({
          cliente: { nombre, telefono, email },
          mascotas: mascotasData,
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
