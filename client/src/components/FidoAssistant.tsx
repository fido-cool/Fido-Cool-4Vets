import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, MessageCircle, Calendar, Bell, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import fidoLogo from "@assets/generated_images/FidoCool_logo_veterinary_platform_b8907b76.png";
import type { Evento } from "@shared/schema";

interface EventoConDetalles extends Evento {
  mascota: {
    id: number;
    nombre: string;
    cliente: {
      id: number;
      nombre: string;
    };
  };
}

interface FidoSuggestion {
  id: string;
  icon: React.ReactNode;
  message: string;
  action?: {
    label: string;
    path: string;
  };
}

export function FidoAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [location, setLocation] = useLocation();

  const { data: eventos } = useQuery<EventoConDetalles[]>({
    queryKey: ["/api/eventos"],
  });

  const { data: stats } = useQuery<{ clientes: number; mascotas: number; proximosEventos: number }>({
    queryKey: ["/api/stats"],
  });

  const generarSugerencias = (): FidoSuggestion[] => {
    const sugerencias: FidoSuggestion[] = [];

    if (!eventos || !stats) return sugerencias;

    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    
    const citasHoy = eventos.filter((e) => {
      const fechaEvento = new Date(e.fecha);
      const fechaSinHora = new Date(fechaEvento.getFullYear(), fechaEvento.getMonth(), fechaEvento.getDate());
      return fechaSinHora.getTime() === hoy.getTime() && fechaEvento > ahora;
    });

    if (citasHoy.length > 0) {
      sugerencias.push({
        id: "citas-hoy",
        icon: <Calendar className="w-4 h-4" />,
        message: `¡Guau! Hoy tienes ${citasHoy.length} ${citasHoy.length === 1 ? "cita programada" : "citas programadas"}.`,
        action: {
          label: "Ver calendario",
          path: "/calendario",
        },
      });
    }

    const eventosSinConfirmar = eventos.filter((e) => {
      const fechaEvento = new Date(e.fecha);
      const diasHasta = Math.floor((fechaEvento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
      return diasHasta <= 2 && diasHasta >= 0;
    });

    if (eventosSinConfirmar.length > 0) {
      sugerencias.push({
        id: "confirmar-asistencia",
        icon: <Bell className="w-4 h-4" />,
        message: `¿Quieres que recuerde a los clientes que no confirmaron su asistencia? (${eventosSinConfirmar.length} próximas)`,
        action: {
          label: "Ver notificaciones",
          path: "/notificaciones",
        },
      });
    }

    const eventosRecientes = eventos.filter((e) => new Date(e.fecha) < ahora);
    const ultimasVisitas = new Map<number, Date>();
    
    eventosRecientes.forEach((evento) => {
      const fechaEvento = new Date(evento.fecha);
      const clienteId = evento.mascota.cliente.id;
      
      if (!ultimasVisitas.has(clienteId) || fechaEvento > ultimasVisitas.get(clienteId)!) {
        ultimasVisitas.set(clienteId, fechaEvento);
      }
    });

    let clientesInactivos = 0;
    ultimasVisitas.forEach((ultimaVisita) => {
      const diasInactivo = Math.floor((ahora.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));
      if (diasInactivo >= 30) clientesInactivos++;
    });

    if (clientesInactivos > 0) {
      sugerencias.push({
        id: "clientes-inactivos",
        icon: <Users className="w-4 h-4" />,
        message: `Detecté ${clientesInactivos} ${clientesInactivos === 1 ? "cliente inactivo" : "clientes inactivos"}. ¿Enviamos recordatorios?`,
        action: {
          label: "Ver campañas",
          path: "/campanas",
        },
      });
    }

    if (stats.clientes === 0) {
      sugerencias.push({
        id: "primeros-pasos",
        icon: <Users className="w-4 h-4" />,
        message: "¡Bienvenido! Empieza agregando tus primeros clientes y mascotas.",
        action: {
          label: "Agregar cliente",
          path: "/clientes",
        },
      });
    }

    return sugerencias.filter((s) => !dismissedSuggestions.has(s.id));
  };

  const sugerencias = generarSugerencias();

  const handleDismiss = (id: string) => {
    setDismissedSuggestions(new Set([...dismissedSuggestions, id]));
  };

  const handleAction = (path: string, id: string) => {
    setLocation(path);
    handleDismiss(id);
    setIsOpen(false);
  };

  useEffect(() => {
    if (sugerencias.length > 0 && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sugerencias.length]);

  return (
    <>
      <AnimatePresence>
        {isOpen && sugerencias.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-80"
            data-testid="fido-assistant-card"
          >
            <Card className="shadow-lg border-2 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 border-2 border-primary">
                      <AvatarImage src={fidoLogo} alt="Fido" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        🐕
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">Fido</p>
                      <p className="text-xs text-muted-foreground">Tu asistente</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsOpen(false)}
                    data-testid="button-close-fido"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {sugerencias.map((sugerencia) => (
                  <div
                    key={sugerencia.id}
                    className="p-3 bg-muted/50 rounded-lg space-y-2"
                    data-testid={`fido-suggestion-${sugerencia.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 text-primary">{sugerencia.icon}</div>
                      <p className="text-sm flex-1">{sugerencia.message}</p>
                    </div>
                    {sugerencia.action && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismiss(sugerencia.id)}
                          className="h-7 text-xs"
                          data-testid={`button-dismiss-${sugerencia.id}`}
                        >
                          Ahora no
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(sugerencia.action!.path, sugerencia.id)}
                          className="h-7 text-xs"
                          data-testid={`button-action-${sugerencia.id}`}
                        >
                          {sugerencia.action.label}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg relative"
          data-testid="button-toggle-fido"
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={fidoLogo} alt="Fido" />
            <AvatarFallback className="bg-primary text-primary-foreground">🐕</AvatarFallback>
          </Avatar>
          {sugerencias.length > 0 && !isOpen && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {sugerencias.length}
            </Badge>
          )}
        </Button>
      </motion.div>
    </>
  );
}
