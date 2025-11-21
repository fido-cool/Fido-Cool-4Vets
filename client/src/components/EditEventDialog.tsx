import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Mascota } from "@shared/schema";

interface MascotaWithCliente extends Mascota {
  cliente: {
    nombre: string;
  };
}

interface EventoDetalle {
  id: number;
  mascotaId: number;
  tipo: string;
  fecha: Date;
  descripcion?: string | null;
  mascotaNombre: string;
  clienteNombre: string;
}

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: EventoDetalle | null;
  onUpdate: (id: number, data: {
    mascotaId?: number;
    tipo?: string;
    fecha?: string;
    descripcion?: string;
  }) => void;
  onDelete: (id: number) => void;
}

const editEventSchema = z.object({
  mascotaId: z.string().min(1, "Debes seleccionar una mascota"),
  tipo: z.string().min(1, "Debes seleccionar un tipo de servicio"),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora: z.string().optional(),
  descripcion: z.string().optional(),
});

type EditEventForm = z.infer<typeof editEventSchema>;

const tiposDeServicio = [
  { value: "bano", label: "Baño" },
  { value: "bano_corte", label: "Baño y Corte" },
  { value: "chequeo", label: "Chequeo Médico" },
  { value: "vacunacion", label: "Vacunación" },
  { value: "cirugia", label: "Cirugía" },
  { value: "otro", label: "Otro" },
];

export function EditEventDialog({
  open,
  onOpenChange,
  evento,
  onUpdate,
  onDelete,
}: EditEventDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: mascotas = [], isLoading: isLoadingMascotas } = useQuery<MascotaWithCliente[]>({
    queryKey: ["/api/mascotas"],
  });

  const form = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      mascotaId: "",
      tipo: "",
      fecha: "",
      hora: "",
      descripcion: "",
    },
  });

  useEffect(() => {
    if (evento && open) {
      const fechaEvento = new Date(evento.fecha);
      const fechaSolo = format(fechaEvento, "yyyy-MM-dd");
      const horaSolo = format(fechaEvento, "HH:mm");
      
      form.reset({
        mascotaId: evento.mascotaId.toString(),
        tipo: evento.tipo,
        fecha: fechaSolo,
        hora: horaSolo,
        descripcion: evento.descripcion || "",
      });
    }
  }, [evento, open, form]);

  const handleSubmit = (data: EditEventForm) => {
    if (!evento) return;

    let fechaCompleta = data.fecha;
    if (data.hora && data.hora.trim() !== "") {
      fechaCompleta = `${data.fecha}T${data.hora}`;
    } else {
      fechaCompleta = `${data.fecha}T09:00`;
    }

    const parsedDate = new Date(fechaCompleta);

    onUpdate(evento.id, {
      mascotaId: parseInt(data.mascotaId),
      tipo: data.tipo,
      fecha: parsedDate.toISOString(),
      descripcion: data.descripcion || "",
    });
    
    // Reset form after successful submission
    form.reset();
  };

  const handleDelete = () => {
    if (evento) {
      onDelete(evento.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  if (!evento) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la cita o elimínala si es necesario
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="mascotaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mascota</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-pet">
                          <SelectValue placeholder="Selecciona una mascota" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingMascotas ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Cargando mascotas...
                          </div>
                        ) : mascotas.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No hay mascotas registradas
                          </div>
                        ) : (
                          mascotas.map((mascota) => (
                            <SelectItem
                              key={mascota.id}
                              value={mascota.id.toString()}
                              data-testid={`select-item-pet-${mascota.id}`}
                            >
                              {mascota.nombre} ({mascota.cliente.nombre})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-service">
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposDeServicio.map((servicio) => (
                          <SelectItem
                            key={servicio.value}
                            value={servicio.value}
                            data-testid={`select-item-service-${servicio.value}`}
                          >
                            {servicio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-edit-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Hora <span className="text-muted-foreground text-xs">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          data-testid="input-edit-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre la cita (opcional)..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-edit-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                  data-testid="button-delete-event"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleOpenChange(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" data-testid="button-save-edit">
                    Guardar Cambios
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Eliminar cita?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita de{" "}
              <span className="font-semibold">{evento.mascotaNombre}</span> con{" "}
              <span className="font-semibold">{evento.clienteNombre}</span> será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
