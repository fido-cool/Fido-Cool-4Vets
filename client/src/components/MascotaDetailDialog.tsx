import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";
import { Calendar, Pencil, Trash2, Save, X as XIcon, User, PawPrint, Maximize2, Heart } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serviceTypes } from "@shared/schema";
import type { Mascota, Cliente, Evento } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const editMascotaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  especie: z.string().min(1, "La especie es requerida"),
  raza: z.string().optional(),
  sexo: z.string().optional(),
  color: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  peso: z.string().optional(),
  estadoReproductivo: z.string().optional(),
  notas: z.string().optional(),
  alergias: z.string().optional(),
  condicionesCronicas: z.string().optional(),
  cirugiasPrevias: z.string().optional(),
  enfermedadesAnteriores: z.string().optional(),
  medicacionActual: z.string().optional(),
  dietaRestricciones: z.string().optional(),
});

type EditMascotaForm = z.infer<typeof editMascotaSchema>;

interface MascotaDetailDialogProps {
  mascotaId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (mascotaId: number) => void;
}

interface MascotaDetails {
  mascota: Mascota;
  cliente: Cliente;
  eventos: Evento[];
}

const estadoLabels: Record<string, string> = {
  programada: "Programada",
  automatica: "Automatica",
  confirmada: "Confirmada",
  pendiente: "Pendiente",
  reprogramada: "Reprogramada",
  cancelada: "Cancelada",
  no_asistio: "No Asistio",
  asistida: "Asistida",
  sin_respuesta: "Sin Respuesta",
};

const estadoColors: Record<string, string> = {
  programada: "bg-blue-500",
  automatica: "bg-purple-500",
  confirmada: "bg-green-500",
  pendiente: "bg-yellow-500",
  reprogramada: "bg-orange-500",
  cancelada: "bg-red-500",
  no_asistio: "bg-gray-500",
  asistida: "bg-emerald-600",
  sin_respuesta: "bg-slate-400",
};

export function MascotaDetailDialog({ mascotaId, open, onOpenChange, onDelete }: MascotaDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleExpand = () => {
    if (mascotaId) {
      onOpenChange(false);
      setLocation(`/mascotas/${mascotaId}`);
    }
  };

  const form = useForm<EditMascotaForm>({
    resolver: zodResolver(editMascotaSchema),
    defaultValues: {
      nombre: "",
      especie: "",
      raza: "",
      sexo: "",
      color: "",
      fechaNacimiento: "",
      peso: "",
      estadoReproductivo: "",
      notas: "",
      alergias: "",
      condicionesCronicas: "",
      cirugiasPrevias: "",
      enfermedadesAnteriores: "",
      medicacionActual: "",
      dietaRestricciones: "",
    },
  });

  const { data: details, isLoading } = useQuery<MascotaDetails>({
    queryKey: ["/api/mascotas", mascotaId, "details"],
    queryFn: async () => {
      if (!mascotaId) throw new Error("No mascota ID");
      const response = await fetch(`/api/mascotas/${mascotaId}/details`);
      if (!response.ok) throw new Error("Failed to fetch mascota details");
      return response.json();
    },
    enabled: open && mascotaId !== null,
  });

  useEffect(() => {
    if (details) {
      form.reset({
        nombre: details.mascota.nombre,
        especie: details.mascota.especie,
        raza: details.mascota.raza || "",
        sexo: details.mascota.sexo || "",
        color: details.mascota.color || "",
        fechaNacimiento: details.mascota.fechaNacimiento
          ? format(new Date(details.mascota.fechaNacimiento), "yyyy-MM-dd")
          : "",
        peso: details.mascota.peso || "",
        estadoReproductivo: details.mascota.estadoReproductivo || "",
        notas: details.mascota.notas || "",
        alergias: details.mascota.alergias || "",
        condicionesCronicas: details.mascota.condicionesCronicas || "",
        cirugiasPrevias: details.mascota.cirugiasPrevias || "",
        enfermedadesAnteriores: details.mascota.enfermedadesAnteriores || "",
        medicacionActual: details.mascota.medicacionActual || "",
        dietaRestricciones: details.mascota.dietaRestricciones || "",
      });
    }
  }, [details, form]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  const updateMascotaMutation = useMutation({
    mutationFn: async (data: EditMascotaForm) => {
      if (!mascotaId) throw new Error("No mascota ID");
      return await apiRequest("PATCH", `/api/mascotas/${mascotaId}`, {
        ...data,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mascotas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mascotas", mascotaId, "details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Mascota actualizada",
        description: "Los datos de la mascota se han actualizado exitosamente.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la mascota. Intentalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (formData: EditMascotaForm) => {
    updateMascotaMutation.mutate(formData);
  };

  const handleCancelEdit = () => {
    if (details) {
      form.reset({
        nombre: details.mascota.nombre,
        especie: details.mascota.especie,
        raza: details.mascota.raza || "",
        sexo: details.mascota.sexo || "",
        color: details.mascota.color || "",
        fechaNacimiento: details.mascota.fechaNacimiento
          ? format(new Date(details.mascota.fechaNacimiento), "yyyy-MM-dd")
          : "",
        peso: details.mascota.peso || "",
        estadoReproductivo: details.mascota.estadoReproductivo || "",
        notas: details.mascota.notas || "",
        alergias: details.mascota.alergias || "",
        condicionesCronicas: details.mascota.condicionesCronicas || "",
        cirugiasPrevias: details.mascota.cirugiasPrevias || "",
        enfermedadesAnteriores: details.mascota.enfermedadesAnteriores || "",
        medicacionActual: details.mascota.medicacionActual || "",
        dietaRestricciones: details.mascota.dietaRestricciones || "",
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (mascotaId && onDelete) {
      onDelete(mascotaId);
      onOpenChange(false);
    }
  };

  const getSpeciesIcon = (especie: string) => {
    switch (especie.toLowerCase()) {
      case "perro":
        return "D";
      case "gato":
        return "G";
      case "ave":
        return "A";
      case "roedor":
        return "R";
      case "reptil":
        return "P";
      default:
        return "M";
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" data-testid="dialog-mascota-details">
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

  const { mascota, cliente, eventos } = details;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]" data-testid="dialog-mascota-details">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getSpeciesIcon(mascota.especie)}
                </AvatarFallback>
              </Avatar>
              <DialogTitle className="text-2xl" data-testid="text-mascota-detail-name">
                {mascota.nombre}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel-edit-mascota"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    onClick={form.handleSubmit(handleSave)}
                    disabled={updateMascotaMutation.isPending}
                    data-testid="button-save-edit-mascota"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleExpand}
                    title="Expandir a pantalla completa"
                    data-testid="button-expand-mascota"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-mascota"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleDelete}
                      className="text-destructive hover:text-destructive"
                      data-testid="button-delete-mascota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="space-y-6 pr-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PawPrint className="w-4 h-4" />
                  Informacion de la Mascota
                </CardTitle>
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
                              <Input {...field} data-testid="input-edit-mascota-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="especie"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Especie</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-edit-mascota-species">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="perro">Perro</SelectItem>
                                  <SelectItem value="gato">Gato</SelectItem>
                                  <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="raza"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Raza</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-mascota-breed" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="sexo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sexo</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-edit-mascota-sex">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="macho">Macho</SelectItem>
                                  <SelectItem value="hembra">Hembra</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-edit-mascota-color" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="fechaNacimiento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Nacimiento</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-edit-mascota-birth" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="peso"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Peso actual</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ej: 5.2 kg" data-testid="input-edit-mascota-weight" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="estadoReproductivo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado reproductivo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-edit-mascota-reproductive">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="entero">Entero</SelectItem>
                                <SelectItem value="esterilizado">Esterilizado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="notas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="input-edit-mascota-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="my-4" />
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-medium">Antecedentes Medicos</span>
                      </div>

                      <FormField
                        control={form.control}
                        name="alergias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alergias</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Ej: Pollo, penicilina..." data-testid="input-edit-mascota-allergies" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="condicionesCronicas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condiciones cronicas</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Ej: Dermatitis, cardiopatia, artrosis, renal..." data-testid="input-edit-mascota-chronic" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cirugiasPrevias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cirugias previas</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Ej: Esterilizacion (2023)..." data-testid="input-edit-mascota-surgeries" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="enfermedadesAnteriores"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enfermedades importantes anteriores</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Ej: Parvovirus (2022)..." data-testid="input-edit-mascota-diseases" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="medicacionActual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medicacion actual</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Ej: Apoquel 16mg cada 12hrs..." data-testid="input-edit-mascota-medication" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dietaRestricciones"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dieta y restricciones alimentarias</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Ej: Dieta hipoalergenica, sin granos..." data-testid="input-edit-mascota-diet" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" data-testid="badge-mascota-species">
                        {mascota.especie}
                      </Badge>
                      {mascota.raza && (
                        <Badge variant="outline" data-testid="badge-mascota-breed">
                          {mascota.raza}
                        </Badge>
                      )}
                    </div>
                    {mascota.fechaNacimiento && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Nacimiento:</span>
                        <span data-testid="text-mascota-birth">
                          {format(new Date(mascota.fechaNacimiento), "dd 'de' MMMM 'de' yyyy", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    )}
                    {mascota.edad && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Edad:</span>
                        <span data-testid="text-mascota-age">{mascota.edad}</span>
                      </div>
                    )}
                    {mascota.notas && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Notas:</p>
                        <p className="text-sm" data-testid="text-mascota-notes">{mascota.notas}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {(mascota.alergias || mascota.condicionesCronicas || mascota.cirugiasPrevias || 
              mascota.enfermedadesAnteriores || mascota.medicacionActual || mascota.dietaRestricciones) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Antecedentes Medicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mascota.alergias && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Alergias:</p>
                      <p className="text-sm" data-testid="text-mascota-allergies">{mascota.alergias}</p>
                    </div>
                  )}
                  {mascota.condicionesCronicas && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Condiciones cronicas:</p>
                      <p className="text-sm" data-testid="text-mascota-chronic">{mascota.condicionesCronicas}</p>
                    </div>
                  )}
                  {mascota.cirugiasPrevias && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cirugias previas:</p>
                      <p className="text-sm" data-testid="text-mascota-surgeries">{mascota.cirugiasPrevias}</p>
                    </div>
                  )}
                  {mascota.enfermedadesAnteriores && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Enfermedades anteriores:</p>
                      <p className="text-sm" data-testid="text-mascota-diseases">{mascota.enfermedadesAnteriores}</p>
                    </div>
                  )}
                  {mascota.medicacionActual && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Medicacion actual:</p>
                      <p className="text-sm" data-testid="text-mascota-medication">{mascota.medicacionActual}</p>
                    </div>
                  )}
                  {mascota.dietaRestricciones && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dieta y restricciones:</p>
                      <p className="text-sm" data-testid="text-mascota-diet">{mascota.dietaRestricciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Propietario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold" data-testid="text-mascota-owner-name">
                    {cliente.nombre}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-mascota-owner-email">
                    {cliente.email}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-mascota-owner-phone">
                    {cliente.telefono}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Historial de Citas ({eventos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay citas registradas para esta mascota.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {eventos.map((evento, index) => {
                      const tipo = evento.tipo as keyof typeof serviceTypes;
                      const serviceTipo = serviceTypes[tipo] || serviceTypes.otro;
                      const estadoKey = evento.estado || "programada";

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
                                  <Badge
                                    variant="outline"
                                    className={`${estadoColors[estadoKey]} text-white border-0`}
                                    data-testid={`badge-event-status-${evento.id}`}
                                  >
                                    {estadoLabels[estadoKey] || estadoKey}
                                  </Badge>
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
    </Dialog>
  );
}
