import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  testId?: string;
}

export function MetricCard({ title, value, icon: Icon, testId }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold text-foreground" data-testid={testId}>
              {value}
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-md">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
