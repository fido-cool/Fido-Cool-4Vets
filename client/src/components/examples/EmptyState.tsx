import { EmptyState } from "../EmptyState";
import { Users } from "lucide-react";
import emptyClinicImage from "@assets/generated_images/Empty_clinic_waiting_room_118f76ed.png";

export default function EmptyStateExample() {
  return (
    <div className="p-8 space-y-12 bg-background">
      <EmptyState
        title="No hay clientes registrados"
        description="Comienza agregando tu primer cliente para gestionar sus mascotas y visitas."
        imageSrc={emptyClinicImage}
        actionLabel="Agregar Cliente"
        onAction={() => console.log("Add client clicked")}
      />
      <EmptyState
        title="Sin eventos programados"
        description="No tienes eventos próximos. Agenda una nueva visita o vacunación."
        icon={Users}
        actionLabel="Crear Evento"
        onAction={() => console.log("Create event clicked")}
      />
    </div>
  );
}
