import { useState } from "react";
import { Search, MoreVertical, Mail, Phone } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { AddClientDialog } from "@/components/AddClientDialog";
import { ClientDetailDialog } from "@/components/ClientDetailDialog";
import { EmptyState } from "@/components/EmptyState";
import emptyClinicImage from "@assets/generated_images/Empty_clinic_waiting_room_118f76ed.png";
import type { Cliente } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: {
      cliente: { nombre: string; telefono: string; email: string };
      mascotas?: Array<{ nombre: string; especie: string; raza?: string; fechaNacimiento?: string }>;
    }) => {
      await apiRequest("POST", "/api/clientes/with-mascotas", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mascotas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      const mascotasCount = data?.mascotas?.length || 0;
      toast({
        title: "Cliente agregado",
        description: mascotasCount > 0 
          ? `Cliente y ${mascotasCount} mascota(s) registrados exitosamente.`
          : "El cliente ha sido registrado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clientes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente.",
      });
      setDeleteClientId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients.filter((client) =>
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los dueños de mascotas registrados
          </p>
        </div>
        <AddClientDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          onAdd={(client) => addMutation.mutate(client)} 
        />
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No hay clientes registrados"
              description="Comienza agregando tu primer cliente para gestionar sus mascotas y visitas."
              imageSrc={emptyClinicImage}
              actionLabel="Agregar Cliente"
              onAction={() => setIsDialogOpen(true)}
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
                      <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover-elevate cursor-pointer"
                        onClick={() => setSelectedClientId(client.id)}
                        data-testid={`client-row-${client.id}`}
                      >
                        <td className="p-4">
                          <p className="font-semibold text-foreground" data-testid={`client-name-${client.id}`}>
                            {client.nombre}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span data-testid={`client-email-${client.id}`}>{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span data-testid={`client-phone-${client.id}`}>{client.telefono}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`button-client-actions-${client.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteClientId(client.id);
                                }}
                                className="text-destructive"
                                data-testid={`menu-delete-client-${client.id}`}
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

      <ClientDetailDialog
        clienteId={selectedClientId}
        open={selectedClientId !== null}
        onOpenChange={(open) => !open && setSelectedClientId(null)}
        onDelete={(id) => setDeleteClientId(id)}
      />

      <AlertDialog open={deleteClientId !== null} onOpenChange={(open) => !open && setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al cliente y todas sus mascotas y eventos asociados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-client">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteClientId && deleteMutation.mutate(deleteClientId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-client"
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
