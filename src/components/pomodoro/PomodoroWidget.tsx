import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, X, Minimize2, Maximize2, SkipForward, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePomodoro } from '@/hooks/usePomodoro';
import { PomodoroSettings } from './PomodoroSettings';
import { cn } from '@/lib/utils';

interface PomodoroWidgetProps {
  onClose: () => void;
  linkedSubject?: string;
}

const POSITION_KEY = 'pomodoro_position';
const MINIMIZED_KEY = 'pomodoro_minimized';

export const PomodoroWidget = ({ onClose, linkedSubject }: PomodoroWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem(MINIMIZED_KEY) === 'true';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(POSITION_KEY);
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 420, y: 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const {
    isRunning,
    timeLeft,
    sessionType,
    cycleCount,
    formatTime,
    progress,
    start,
    pause,
    reset,
    skip,
  } = usePomodoro(linkedSubject);

  useEffect(() => {
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem(MINIMIZED_KEY, isMinimized.toString());
  }, [isMinimized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragStart.x)),
      y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragStart.y)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const getPhaseColor = () => {
    switch (sessionType) {
      case 'work':
        return 'from-primary to-primary/70';
      case 'short_break':
        return 'from-blue-500 to-blue-400';
      case 'long_break':
        return 'from-green-500 to-green-400';
      default:
        return 'from-primary to-primary/70';
    }
  };

  const getPhaseLabel = () => {
    switch (sessionType) {
      case 'work':
        return 'Focus Time';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      default:
        return 'Focus Time';
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
        }}
        onMouseDown={handleMouseDown}
        className="cursor-move"
      >
        <Card className={cn(
          "p-3 shadow-lg bg-gradient-to-br backdrop-blur-sm border-2",
          getPhaseColor()
        )}>
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-white" />
            <div className="text-white font-mono font-bold">
              {formatTime(timeLeft)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
        }}
        onMouseDown={handleMouseDown}
        className={cn("cursor-move", isDragging && "select-none")}
      >
        <Card className="w-[380px] shadow-2xl bg-card/95 backdrop-blur-md border-2">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-lg">{getPhaseLabel()}</h3>
                  <p className="text-xs text-muted-foreground">
                    Session {cycleCount} • {linkedSubject || 'General'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Circular Timer */}
            <div className="relative flex items-center justify-center">
              <svg className="w-64 h-64 -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className={cn("transition-colors", 
                    sessionType === 'work' ? 'text-primary' :
                    sessionType === 'short_break' ? 'text-blue-500' :
                    'text-green-500'
                  )}
                  style={{
                    strokeDasharray: 754,
                    strokeDashoffset: 754 - (754 * progress()) / 100,
                    transition: 'stroke-dashoffset 0.3s linear',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold font-mono"
                >
                  {formatTime(timeLeft)}
                </motion.div>
                <p className="text-sm text-muted-foreground mt-2">
                  {isRunning ? 'In Progress' : 'Paused'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                disabled={!timeLeft}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                size="lg"
                className="w-24 h-12"
                onClick={isRunning ? pause : start}
              >
                {isRunning ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={skip}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i <= cycleCount % 4 || cycleCount % 4 === 0
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <PomodoroSettings onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </>
  );
};
