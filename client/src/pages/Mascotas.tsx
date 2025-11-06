import { useState } from "react";
import { Search, MoreVertical } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddPetDialog } from "@/components/AddPetDialog";
import { EmptyState } from "@/components/EmptyState";
import addPetImage from "@assets/generated_images/Add_new_pet_illustration_87160775.png";
import type { Mascota, Cliente } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MascotaWithCliente extends Mascota {
  cliente?: Cliente;
}

export default function Mascotas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletePetId, setDeletePetId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: mascotas = [], isLoading } = useQuery<MascotaWithCliente[]>({
    queryKey: ["/api/mascotas"],
  });

  const addMutation = useMutation({
    mutationFn: async (pet: { nombre: string; especie: string; raza: string; edad: string; notas: string; clienteId: number }) => {
      console.log("🔍 Frontend - Sending pet data:", JSON.stringify(pet, null, 2));
      await apiRequest("POST", "/api/mascotas", pet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mascotas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Mascota agregada",
        description: "La mascota ha sido registrada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar la mascota. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/mascotas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mascotas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Mascota eliminada",
        description: "La mascota ha sido eliminada exitosamente.",
      });
      setDeletePetId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la mascota. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const filteredPets = mascotas.filter((pet) =>
    pet.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSpeciesEmoji = (especie: string) => {
    switch (especie.toLowerCase()) {
      case "perro":
        return "🐕";
      case "gato":
        return "🐱";
      case "ave":
        return "🦜";
      case "roedor":
        return "🐹";
      case "reptil":
        return "🦎";
      default:
        return "🐾";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mascotas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona todas las mascotas registradas
          </p>
        </div>
        <AddPetDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          onAdd={(pet) => addMutation.mutate(pet)} 
        />
      </div>

      {mascotas.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No hay mascotas registradas"
              description="Agrega la primera mascota para comenzar a gestionar su historial médico."
              imageSrc={addPetImage}
              actionLabel="Agregar Mascota"
              onAction={() => setIsDialogOpen(true)}
              actionTestId="button-empty-add-pet"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar mascotas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-pets"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet) => (
              <Card key={pet.id} className="hover-elevate" data-testid={`pet-card-${pet.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                          {getSpeciesEmoji(pet.especie)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground" data-testid={`pet-name-${pet.id}`}>
                          {pet.nombre}
                        </h3>
                        <p className="text-sm text-muted-foreground">{pet.raza || "Sin raza especificada"}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-pet-actions-${pet.id}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setDeletePetId(pet.id)}
                          className="text-destructive"
                          data-testid={`menu-delete-pet-${pet.id}`}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Especie:</span>
                      <Badge variant="secondary" data-testid={`pet-species-${pet.id}`}>{pet.especie}</Badge>
                    </div>
                    {pet.edad && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Edad:</span>
                        <span className="text-foreground">{pet.edad}</span>
                      </div>
                    )}
                    {pet.cliente && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Propietario:</span>
                        <span className="text-foreground font-medium truncate ml-2" data-testid={`pet-owner-${pet.id}`}>
                          {pet.cliente.nombre}
                        </span>
                      </div>
                    )}
                    {pet.notas && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Notas: <span className="text-foreground">{pet.notas}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <AlertDialog open={deletePetId !== null} onOpenChange={(open) => !open && setDeletePetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mascota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a la mascota y todos sus eventos médicos asociados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-pet">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePetId && deleteMutation.mutate(deletePetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-pet"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
