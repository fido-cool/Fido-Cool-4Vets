import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRoute, useLocation } from "wouter";
import { Calendar, Pencil, Trash2, Save, X as XIcon, User, PawPrint, ArrowLeft, Heart } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function MascotaProfile() {
  const [, params] = useRoute("/mascotas/:id");
  const [, setLocation] = useLocation();
  const mascotaId = params?.id ? parseInt(params.id) : null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

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
    enabled: mascotaId !== null,
  });

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!mascotaId) throw new Error("No mascota ID");
      return await apiRequest("DELETE", `/api/mascotas/${mascotaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mascotas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Mascota eliminada",
        description: "La mascota ha sido eliminada exitosamente.",
      });
      setLocation("/mascotas");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la mascota. Intentalo de nuevo.",
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
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-48 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Mascota no encontrada</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation("/mascotas")}
          >
            Volver a Mascotas
          </Button>
        </div>
      </div>
    );
  }

  const { mascota, cliente, eventos } = details;

  if (isEditing && !form.getValues("nombre")) {
    form.reset({
      nombre: mascota.nombre,
      especie: mascota.especie,
      raza: mascota.raza || "",
      fechaNacimiento: mascota.fechaNacimiento
        ? format(new Date(mascota.fechaNacimiento), "yyyy-MM-dd")
        : "",
      notas: mascota.notas || "",
    });
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/mascotas")}
            data-testid="button-back-to-mascotas"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getSpeciesIcon(mascota.especie)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-mascota-profile-name">
                {mascota.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">
                Perfil de mascota
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                onClick={handleCancelEdit}
                data-testid="button-cancel-edit-profile"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={form.handleSubmit(handleSave)}
                disabled={updateMascotaMutation.isPending}
                data-testid="button-save-edit-profile"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-profile"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                data-testid="button-delete-profile"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="w-5 h-5" />
                Informacion de la Mascota
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-profile-mascota-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="especie"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Especie</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-profile-mascota-species">
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
                              <Input {...field} data-testid="input-profile-mascota-breed" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sexo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sexo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-profile-mascota-sex">
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
                              <Input {...field} data-testid="input-profile-mascota-color" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fechaNacimiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-profile-mascota-birth" />
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
                              <Input {...field} placeholder="ej: 5.2 kg" data-testid="input-profile-mascota-weight" />
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
                              <SelectTrigger data-testid="select-profile-mascota-reproductive">
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
                            <Textarea {...field} rows={3} data-testid="input-profile-mascota-notes" />
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
                            <Textarea {...field} placeholder="Ej: Pollo, penicilina..." data-testid="input-profile-mascota-allergies" />
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
                            <Textarea {...field} placeholder="Ej: Dermatitis, cardiopatia, artrosis, renal..." data-testid="input-profile-mascota-chronic" />
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
                            <Textarea {...field} placeholder="Ej: Esterilizacion (2023)..." data-testid="input-profile-mascota-surgeries" />
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
                            <Textarea {...field} placeholder="Ej: Parvovirus (2022)..." data-testid="input-profile-mascota-diseases" />
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
                            <Textarea {...field} placeholder="Ej: Apoquel 16mg cada 12hrs..." data-testid="input-profile-mascota-medication" />
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
                            <Textarea {...field} placeholder="Ej: Dieta hipoalergenica, sin granos..." data-testid="input-profile-mascota-diet" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-sm" data-testid="badge-profile-species">
                      {mascota.especie}
                    </Badge>
                    {mascota.raza && (
                      <Badge variant="outline" className="text-sm" data-testid="badge-profile-breed">
                        {mascota.raza}
                      </Badge>
                    )}
                  </div>
                  {mascota.fechaNacimiento && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Nacimiento:</span>
                      <span data-testid="text-profile-birth">
                        {format(new Date(mascota.fechaNacimiento), "dd 'de' MMMM 'de' yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                  {mascota.edad && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Edad:</span>
                      <span data-testid="text-profile-age">{mascota.edad}</span>
                    </div>
                  )}
                  {mascota.notas && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Notas:</p>
                      <p className="text-sm" data-testid="text-profile-notes">{mascota.notas}</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Antecedentes Medicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mascota.alergias && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Alergias:</p>
                    <p className="text-sm" data-testid="text-profile-allergies">{mascota.alergias}</p>
                  </div>
                )}
                {mascota.condicionesCronicas && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Condiciones cronicas:</p>
                    <p className="text-sm" data-testid="text-profile-chronic">{mascota.condicionesCronicas}</p>
                  </div>
                )}
                {mascota.cirugiasPrevias && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cirugias previas:</p>
                    <p className="text-sm" data-testid="text-profile-surgeries">{mascota.cirugiasPrevias}</p>
                  </div>
                )}
                {mascota.enfermedadesAnteriores && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enfermedades anteriores:</p>
                    <p className="text-sm" data-testid="text-profile-diseases">{mascota.enfermedadesAnteriores}</p>
                  </div>
                )}
                {mascota.medicacionActual && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medicacion actual:</p>
                    <p className="text-sm" data-testid="text-profile-medication">{mascota.medicacionActual}</p>
                  </div>
                )}
                {mascota.dietaRestricciones && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dieta y restricciones:</p>
                    <p className="text-sm" data-testid="text-profile-diet">{mascota.dietaRestricciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Historial de Citas ({eventos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No hay citas registradas para esta mascota.
                </p>
              ) : (
                <div className="space-y-4">
                  {eventos.map((evento, index) => {
                    const tipo = evento.tipo as keyof typeof serviceTypes;
                    const serviceTipo = serviceTypes[tipo] || serviceTypes.otro;
                    const estadoKey = evento.estado || "programada";

                    return (
                      <div key={evento.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-3 min-w-[70px]">
                            <span className="text-xs font-medium text-primary uppercase">
                              {format(new Date(evento.fecha), "MMM", { locale: es })}
                            </span>
                            <span className="text-2xl font-bold text-primary">
                              {format(new Date(evento.fecha), "dd")}
                            </span>
                            <span className="text-xs text-primary">
                              {format(new Date(evento.fecha), "yyyy")}
                            </span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                style={{
                                  backgroundColor: serviceTipo.color,
                                  color: "white",
                                }}
                                data-testid={`badge-profile-event-type-${evento.id}`}
                              >
                                {serviceTipo.label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`${estadoColors[estadoKey]} text-white border-0`}
                                data-testid={`badge-profile-event-status-${evento.id}`}
                              >
                                {estadoLabels[estadoKey] || estadoKey}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(evento.fecha), "HH:mm", { locale: es })} hrs
                            </div>
                            {evento.descripcion && (
                              <p className="text-sm" data-testid={`text-profile-event-description-${evento.id}`}>
                                {evento.descripcion}
                              </p>
                            )}
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Propietario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="font-semibold text-lg" data-testid="text-profile-owner-name">
                  {cliente.nombre}
                </p>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p data-testid="text-profile-owner-email">{cliente.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefono:</span>
                    <p data-testid="text-profile-owner-phone">{cliente.telefono}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estadisticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-primary">{eventos.length}</p>
                  <p className="text-xs text-muted-foreground">Total Citas</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {eventos.filter(e => e.estado === "asistida").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Asistidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mascota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara permanentemente a {mascota.nombre} y todas sus citas asociadas.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-profile">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-profile"
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
