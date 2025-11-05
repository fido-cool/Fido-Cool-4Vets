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
import { Plus } from "lucide-react";
import type { Cliente } from "@shared/schema";

interface AddPetDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd?: (pet: {
    nombre: string;
    especie: string;
    raza: string;
    edad: string;
    notas: string;
    clienteId: number;
  }) => void;
}

export function AddPetDialog({ open, onOpenChange, onAdd }: AddPetDialogProps) {
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");
  const [edad, setEdad] = useState("");
  const [notas, setNotas] = useState("");
  const [clienteId, setClienteId] = useState("");

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAdd && clienteId) {
      onAdd({ nombre, especie, raza, edad, notas, clienteId: parseInt(clienteId) });
      console.log("Mascota agregada:", { nombre, especie, raza, edad, notas, clienteId: parseInt(clienteId) });
    }
    setNombre("");
    setEspecie("");
    setRaza("");
    setEdad("");
    setNotas("");
    setClienteId("");
    onOpenChange?.(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNombre("");
      setEspecie("");
      setRaza("");
      setEdad("");
      setNotas("");
      setClienteId("");
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-pet" onClick={() => onOpenChange?.(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Mascota
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Mascota</DialogTitle>
          <DialogDescription>
            Registra una nueva mascota asociada a un cliente existente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente (Dueño)</Label>
              <Select value={clienteId} onValueChange={setClienteId} required>
                <SelectTrigger id="cliente" data-testid="select-pet-owner">
                  <SelectValue placeholder="Selecciona un cliente" />
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
              <Label htmlFor="nombre-pet">Nombre de la Mascota</Label>
              <Input
                id="nombre-pet"
                placeholder="Max"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                data-testid="input-pet-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="especie">Especie</Label>
                <Select value={especie} onValueChange={setEspecie} required>
                  <SelectTrigger id="especie" data-testid="select-pet-species">
                    <SelectValue placeholder="Especie" />
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
              <div className="space-y-2">
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  placeholder="2 años"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  required
                  data-testid="input-pet-age"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raza">Raza</Label>
              <Input
                id="raza"
                placeholder="Labrador"
                value={raza}
                onChange={(e) => setRaza(e.target.value)}
                data-testid="input-pet-breed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                placeholder="Información adicional sobre la mascota..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="resize-none"
                rows={3}
                data-testid="input-pet-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-submit-pet" disabled={!clienteId || clientes.length === 0}>
              Agregar Mascota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
