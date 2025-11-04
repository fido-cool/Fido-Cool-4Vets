import { useState } from "react";
import { Search, MoreVertical } from "lucide-react";
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
import { AddPetDialog } from "@/components/AddPetDialog";
import { EmptyState } from "@/components/EmptyState";
import addPetImage from "@assets/generated_images/Add_new_pet_illustration_87160775.png";

interface Pet {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  edad: string;
  propietario: string;
  ultimaVisita: string;
}

export default function Mascotas() {
  const [searchTerm, setSearchTerm] = useState("");

  const pets: Pet[] = [
    {
      id: 1,
      nombre: "Max",
      especie: "Perro",
      raza: "Labrador",
      edad: "3 años",
      propietario: "Juan Pérez",
      ultimaVisita: "2025-11-01",
    },
    {
      id: 2,
      nombre: "Luna",
      especie: "Gato",
      raza: "Siamés",
      edad: "2 años",
      propietario: "María García",
      ultimaVisita: "2025-10-28",
    },
    {
      id: 3,
      nombre: "Rocky",
      especie: "Perro",
      raza: "Bulldog",
      edad: "5 años",
      propietario: "Carlos López",
      ultimaVisita: "2025-10-15",
    },
    {
      id: 4,
      nombre: "Milo",
      especie: "Perro",
      raza: "Golden Retriever",
      edad: "1 año",
      propietario: "Ana Martínez",
      ultimaVisita: "2025-10-10",
    },
    {
      id: 5,
      nombre: "Coco",
      especie: "Ave",
      raza: "Loro",
      edad: "4 años",
      propietario: "Carlos López",
      ultimaVisita: "2025-09-20",
    },
  ];

  const filteredPets = pets.filter((pet) =>
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
      default:
        return "🐾";
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mascotas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona todas las mascotas registradas
          </p>
        </div>
        <AddPetDialog />
      </div>

      {pets.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No hay mascotas registradas"
              description="Agrega la primera mascota para comenzar a gestionar su historial médico."
              imageSrc={addPetImage}
              actionLabel="Agregar Mascota"
              onAction={() => console.log("Add pet")}
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
                        <h3 className="font-semibold text-lg text-foreground">{pet.nombre}</h3>
                        <p className="text-sm text-muted-foreground">{pet.raza}</p>
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
                        <DropdownMenuItem onClick={() => console.log("Ver historial", pet.id)}>
                          Ver Historial
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("Editar", pet.id)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => console.log("Eliminar", pet.id)}
                          className="text-destructive"
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Especie:</span>
                      <Badge variant="secondary">{pet.especie}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Edad:</span>
                      <span className="text-foreground">{pet.edad}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Propietario:</span>
                      <span className="text-foreground font-medium truncate ml-2">
                        {pet.propietario}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Última visita:{" "}
                        <span className="text-foreground">
                          {new Date(pet.ultimaVisita).toLocaleDateString("es-ES")}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
