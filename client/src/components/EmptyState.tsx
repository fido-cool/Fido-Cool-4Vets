import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  imageSrc?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTestId?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  imageSrc,
  actionLabel,
  onAction,
  actionTestId,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {imageSrc ? (
        <img src={imageSrc} alt={title} className="w-48 h-36 object-contain mb-6 opacity-80" />
      ) : Icon ? (
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Icon className="w-12 h-12 text-muted-foreground" />
        </div>
      ) : null}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} data-testid={actionTestId}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
