import { useState } from "react";
import { Search, MoreVertical, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddClientDialog } from "@/components/AddClientDialog";
import { EmptyState } from "@/components/EmptyState";
import emptyClinicImage from "@assets/generated_images/Empty_clinic_waiting_room_118f76ed.png";

interface Client {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  numMascotas: number;
  ultimaVisita: string;
}

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");

  const clients: Client[] = [
    {
      id: 1,
      nombre: "Juan Pérez",
      telefono: "+34 600 111 222",
      email: "juan@ejemplo.com",
      numMascotas: 2,
      ultimaVisita: "2025-11-01",
    },
    {
      id: 2,
      nombre: "María García",
      telefono: "+34 600 333 444",
      email: "maria@ejemplo.com",
      numMascotas: 1,
      ultimaVisita: "2025-10-28",
    },
    {
      id: 3,
      nombre: "Carlos López",
      telefono: "+34 600 555 666",
      email: "carlos@ejemplo.com",
      numMascotas: 3,
      ultimaVisita: "2025-10-15",
    },
    {
      id: 4,
      nombre: "Ana Martínez",
      telefono: "+34 600 777 888",
      email: "ana@ejemplo.com",
      numMascotas: 1,
      ultimaVisita: "2025-10-10",
    },
  ];

  const filteredClients = clients.filter((client) =>
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los dueños de mascotas registrados
          </p>
        </div>
        <AddClientDialog />
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No hay clientes registrados"
              description="Comienza agregando tu primer cliente para gestionar sus mascotas y visitas."
              imageSrc={emptyClinicImage}
              actionLabel="Agregar Cliente"
              onAction={() => console.log("Add client")}
              actionTestId="button-empty-add-client"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-clients"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Nombre
                      </th>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Contacto
                      </th>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Mascotas
                      </th>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Última Visita
                      </th>
                      <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover-elevate"
                        data-testid={`client-row-${client.id}`}
                      >
                        <td className="p-4">
                          <p className="font-semibold text-foreground">{client.nombre}</p>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span>{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{client.telefono}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-foreground">{client.numMascotas}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(client.ultimaVisita).toLocaleDateString("es-ES")}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-client-actions-${client.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => console.log("Ver detalles", client.id)}>
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => console.log("Editar", client.id)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => console.log("Eliminar", client.id)}
                                className="text-destructive"
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
