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
      className={cn(
        "w-full h-auto p-2 px-3 justify-start",
        isActive && "bg-accent hover:bg-accent shadow-none"
      )}
    >
      <div className="flex flex-col items-start space-y-2">
        <span className="font-medium text-sm">{title || renderDate(date)}</span>
        {title && (
          <span className="text-muted-foreground text-xs">
            {renderDate(date)}
          </span>
        )}
      </div>
    </Button>
  );
};
