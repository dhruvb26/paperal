import { renderDate } from "@/utils/render-date";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VersionItemProps {
  title: string;
  date: string | number | Date;
  isActive: boolean;
  onClick: () => void;
}

export const VersionItem = ({
  title,
  date,
  isActive,
  onClick,
}: VersionItemProps) => {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className={cn("w-full justify-start gap-2", isActive && "bg-accent")}
    >
      <span className="font-medium">{title || renderDate(date)}</span>
      {title && (
        <span className="text-muted-foreground text-sm">
          {renderDate(date)}
        </span>
      )}
    </Button>
  );
};
