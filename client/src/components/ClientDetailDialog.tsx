import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Phone, Calendar, Pencil, Trash2, Save, X as XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serviceTypes } from "@shared/schema";
import type { Cliente, Mascota, Evento } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MascotaDetailDialog } from "./MascotaDetailDialog";

// Validation schema for editing cliente
const editClienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido"),
});

type EditClienteForm = z.infer<typeof editClienteSchema>;

interface ClientDetailDialogProps {
  clienteId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (clienteId: number) => void;
}

interface ClienteDetails {
  cliente: Cliente;
  mascotas: Mascota[];
  eventos: Array<Evento & { mascota: { id: number; nombre: string } }>;
}

export function ClientDetailDialog({ clienteId, open, onOpenChange, onDelete }: ClientDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMascotaId, setSelectedMascotaId] = useState<number | null>(null);
  const [isMascotaDialogOpen, setIsMascotaDialogOpen] = useState(false);
  const { toast } = useToast();

  // Editable state for mascotas
  const [editedMascotas, setEditedMascotas] = useState<Mascota[]>([]);

  // Form for cliente data
  const form = useForm<EditClienteForm>({
    resolver: zodResolver(editClienteSchema),
    defaultValues: {
      nombre: "",
      telefono: "",
      email: "",
    },
  });

  const { data: details, isLoading } = useQuery<ClienteDetails>({
    queryKey: ["/api/clientes", clienteId, "details"],
    queryFn: async () => {
      if (!clienteId) throw new Error("No client ID");
      const response = await fetch(`/api/clientes/${clienteId}/details`);
      if (!response.ok) throw new Error("Failed to fetch client details");
      return response.json();
    },
    enabled: open && clienteId !== null,
  });

  // Initialize form and mascotas when details load
  useEffect(() => {
    if (details) {
      form.reset({
        nombre: details.cliente.nombre,
        telefono: details.cliente.telefono,
        email: details.cliente.email,
      });
      setEditedMascotas([...details.mascotas]);
    }
  }, [details, form]);

  // Reset edit mode when dialog closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  const updateClienteMutation = useMutation({
    mutationFn: async (data: EditClienteForm) => {
      if (!clienteId) throw new Error("No client ID");
      return await apiRequest("PATCH", `/api/clientes/${clienteId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clientes", clienteId, "details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateMascotaMutation = useMutation({
    mutationFn: async (mascota: Mascota) => {
      return await apiRequest("PATCH", `/api/mascotas/${mascota.id}`, {
        nombre: mascota.nombre,
        especie: mascota.especie,
        raza: mascota.raza,
        fechaNacimiento: mascota.fechaNacimiento,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mascotas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clientes", clienteId, "details"] });
    },
  });

  const handleSave = async (formData: EditClienteForm) => {
    if (!details) return;

    try {
      // Update cliente
      await updateClienteMutation.mutateAsync(formData);

      // Update each mascota that changed
      for (const editedMascota of editedMascotas) {
        const original = details.mascotas.find(m => m.id === editedMascota.id);
        if (original && (
          original.nombre !== editedMascota.nombre ||
          original.especie !== editedMascota.especie ||
          original.raza !== editedMascota.raza ||
          original.fechaNacimiento !== editedMascota.fechaNacimiento
        )) {
          await updateMascotaMutation.mutateAsync(editedMascota);
        }
      }

      setIsEditing(false);
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const handleCancelEdit = () => {
    if (details) {
      form.reset({
        nombre: details.cliente.nombre,
        telefono: details.cliente.telefono,
        email: details.cliente.email,
      });
      setEditedMascotas([...details.mascotas]);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (clienteId && onDelete) {
      onDelete(clienteId);
      onOpenChange(false);
    }
  };

  const updateMascotaField = (index: number, field: keyof Mascota, value: any) => {
    const updated = [...editedMascotas];
    updated[index] = { ...updated[index], [field]: value };
    setEditedMascotas(updated);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" data-testid="dialog-client-details">
          <div className="animate-pulse space-y-4 p-4">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) {
    return null;
  }

  const { cliente, eventos } = details;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]" data-testid="dialog-client-details">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-2xl flex-1" data-testid="text-client-detail-name">
              {cliente.nombre}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel-edit"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    onClick={form.handleSubmit(handleSave)}
                    disabled={updateClienteMutation.isPending || updateMascotaMutation.isPending}
                    data-testid="button-save-edit"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-client"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                    data-testid="button-delete-client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Form {...form}>
                    <form className="space-y-3">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-edit-client-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-edit-client-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-edit-client-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-client-detail-email">
                        {cliente.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-client-detail-phone">
                        {cliente.telefono}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Mascotas Asociadas ({editedMascotas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editedMascotas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay mascotas registradas para este cliente.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {editedMascotas.map((mascota, index) => (
                      <div key={mascota.id}>
                        {index > 0 && <Separator className="my-4" />}
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label htmlFor={`pet-name-${mascota.id}`} className="text-sm font-medium">
                                Nombre
                              </label>
                              <Input
                                id={`pet-name-${mascota.id}`}
                                value={mascota.nombre}
                                onChange={(e) => updateMascotaField(index, "nombre", e.target.value)}
                                data-testid={`input-edit-pet-name-${mascota.id}`}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label htmlFor={`pet-species-${mascota.id}`} className="text-sm font-medium">
                                  Especie
                                </label>
                                <Select
                                  value={mascota.especie}
                                  onValueChange={(value) => updateMascotaField(index, "especie", value)}
                                >
                                  <SelectTrigger id={`pet-species-${mascota.id}`} data-testid={`select-edit-pet-species-${mascota.id}`}>
                                    <SelectValue />
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
                              <div>
                                <label htmlFor={`pet-breed-${mascota.id}`} className="text-sm font-medium">
                                  Raza (opcional)
                                </label>
                                <Input
                                  id={`pet-breed-${mascota.id}`}
                                  value={mascota.raza || ""}
                                  onChange={(e) => updateMascotaField(index, "raza", e.target.value || null)}
                                  data-testid={`input-edit-pet-breed-${mascota.id}`}
                                />
                              </div>
                            </div>
                            <div>
                              <label htmlFor={`pet-birth-${mascota.id}`} className="text-sm font-medium">
                                Fecha de Nacimiento (opcional)
                              </label>
                              <Input
                                id={`pet-birth-${mascota.id}`}
                                type="date"
                                value={
                                  mascota.fechaNacimiento
                                    ? format(new Date(mascota.fechaNacimiento), "yyyy-MM-dd")
                                    : ""
                                }
                                onChange={(e) =>
                                  updateMascotaField(
                                    index,
                                    "fechaNacimiento",
                                    e.target.value ? new Date(e.target.value) : null
                                  )
                                }
                                data-testid={`input-edit-pet-birth-${mascota.id}`}
                              />
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="flex items-start justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                            onClick={() => {
                              setSelectedMascotaId(mascota.id);
                              setIsMascotaDialogOpen(true);
                            }}
                            data-testid={`button-view-pet-${mascota.id}`}
                          >
                            <div className="space-y-1">
                              <p className="font-semibold" data-testid={`text-pet-name-${mascota.id}`}>
                                {mascota.nombre}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" data-testid={`badge-pet-species-${mascota.id}`}>
                                  {mascota.especie}
                                </Badge>
                                {mascota.raza && (
                                  <Badge variant="outline" data-testid={`badge-pet-breed-${mascota.id}`}>
                                    {mascota.raza}
                                  </Badge>
                                )}
                              </div>
                              {mascota.fechaNacimiento && (
                                <p className="text-xs text-muted-foreground">
                                  Nacimiento:{" "}
                                  {format(new Date(mascota.fechaNacimiento), "dd 'de' MMMM 'de' yyyy", {
                                    locale: es,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visit History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Historial de Visitas ({eventos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay visitas registradas para este cliente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {eventos.map((evento, index) => {
                      const tipo = evento.tipo as keyof typeof serviceTypes;
                      const serviceTipo = serviceTypes[tipo] || serviceTypes.otro;

                      return (
                        <div key={evento.id}>
                          {index > 0 && <Separator className="my-3" />}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    style={{
                                      backgroundColor: serviceTipo.color,
                                      color: "white",
                                    }}
                                    data-testid={`badge-event-type-${evento.id}`}
                                  >
                                    {serviceTipo.label}
                                  </Badge>
                                  <span className="text-sm font-medium" data-testid={`text-event-pet-${evento.id}`}>
                                    {evento.mascota.nombre}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  <span data-testid={`text-event-date-${evento.id}`}>
                                    {format(new Date(evento.fecha), "dd 'de' MMMM 'de' yyyy, HH:mm", {
                                      locale: es,
                                    })}
                                  </span>
                                </div>
                                {evento.descripcion && (
                                  <p className="text-sm text-muted-foreground" data-testid={`text-event-description-${evento.id}`}>
                                    {evento.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>

      <MascotaDetailDialog
        mascotaId={selectedMascotaId}
        open={isMascotaDialogOpen}
        onOpenChange={setIsMascotaDialogOpen}
      />
    </Dialog>
  );
}
