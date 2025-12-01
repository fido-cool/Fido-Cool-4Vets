import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  testId?: string;
  href?: string;
}

export function MetricCard({ title, value, icon: Icon, testId, href }: MetricCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (href) {
      setLocation(href);
    }
  };

  return (
    <Card 
      className={href ? "cursor-pointer hover-elevate active-elevate-2 transition-all" : ""}
      onClick={handleClick}
      data-testid={testId}
    >
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold text-foreground">
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
