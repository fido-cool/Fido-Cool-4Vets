import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Phone, Calendar, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { serviceTypes } from "@shared/schema";
import type { Cliente, Mascota, Evento } from "@shared/schema";

interface ClientDetailDialogProps {
  clienteId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClienteDetails {
  cliente: Cliente;
  mascotas: Mascota[];
  eventos: Array<Evento & { mascota: { id: number; nombre: string } }>;
}

export function ClientDetailDialog({ clienteId, open, onOpenChange }: ClientDetailDialogProps) {
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

  const { cliente, mascotas, eventos } = details;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]" data-testid="dialog-client-details">
        <DialogHeader>
          <DialogTitle className="text-2xl" data-testid="text-client-detail-name">
            {cliente.nombre}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>

            {/* Pets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Mascotas Asociadas ({mascotas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mascotas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay mascotas registradas para este cliente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mascotas.map((mascota, index) => (
                      <div key={mascota.id}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="flex items-start justify-between">
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
    </Dialog>
  );
}
