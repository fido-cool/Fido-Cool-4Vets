import { MetricCard } from "../MetricCard";
import { Users, Heart, Calendar } from "lucide-react";

export default function MetricCardExample() {
  return (
    <div className="p-8 space-y-6 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Clientes" value={24} icon={Users} />
        <MetricCard title="Total Mascotas" value={38} icon={Heart} />
        <MetricCard title="Próximos Eventos" value={12} icon={Calendar} />
      </div>
    </div>
  );
}
