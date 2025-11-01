import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PomodoroButtonProps {
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export const PomodoroButton = ({ onClick, isActive, className }: PomodoroButtonProps) => {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="icon"
      onClick={onClick}
      className={cn(
        "relative transition-all",
        isActive && "animate-pulse",
        className
      )}
      title="Pomodoro Timer"
    >
      <Timer className="h-5 w-5" />
      {isActive && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
      )}
    </Button>
  );
};
