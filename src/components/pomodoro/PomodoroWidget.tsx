import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Settings, Minimize2, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePomodoro, SessionType } from '@/hooks/usePomodoro';
import { PomodoroSettings } from './PomodoroSettings';
import { cn } from '@/lib/utils';
import { usePomodoro as usePomodoroContext } from '@/contexts/PomodoroContext';

const WIDGET_POSITION_KEY = 'pomodoro-widget-position';
const WIDGET_STATE_KEY = 'pomodoro-widget-minimized';

const getInitialPosition = () => {
  const saved = localStorage.getItem(WIDGET_POSITION_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure position is within viewport bounds
      const maxX = Math.max(0, window.innerWidth - 400);
      const maxY = Math.max(0, window.innerHeight - 300);
      return {
        x: Math.min(Math.max(0, parsed.x), maxX),
        y: Math.min(Math.max(0, parsed.y), maxY)
      };
    } catch (e) {
      console.error('Failed to parse saved position', e);
    }
  }
  // Default to centered on screen
  return { 
    x: Math.max(0, (window.innerWidth - 320) / 2), 
    y: Math.max(0, (window.innerHeight - 400) / 2) 
  };
};

export const PomodoroWidget = () => {
  const pomodoro = usePomodoro();
  const { closeWidget } = usePomodoroContext();
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem(WIDGET_STATE_KEY) === 'true';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem(WIDGET_STATE_KEY, String(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    localStorage.setItem(WIDGET_POSITION_KEY, JSON.stringify(position));
  }, [position]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionInfo = (type: SessionType) => {
    switch (type) {
      case 'work':
        return { label: '🎯 Focus Time', color: 'text-primary' };
      case 'short_break':
        return { label: '☕ Short Break', color: 'text-green-500' };
      case 'long_break':
        return { label: '🌟 Long Break', color: 'text-blue-500' };
    }
  };

  const progress = pomodoro.sessionType === 'work'
    ? (pomodoro.timeRemaining / (pomodoro.settings.workDuration * 60)) * 100
    : pomodoro.sessionType === 'short_break'
    ? (pomodoro.timeRemaining / (pomodoro.settings.shortBreakDuration * 60)) * 100
    : (pomodoro.timeRemaining / (pomodoro.settings.longBreakDuration * 60)) * 100;

  const sessionInfo = getSessionInfo(pomodoro.sessionType);

  if (isMinimized) {
    return (
      <>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, info) => {
            setIsDragging(false);
            setPosition({ x: position.x + info.offset.x, y: position.y + info.offset.y });
          }}
          style={{ x: position.x, y: position.y }}
          className="fixed z-[9999] cursor-move"
        >
          <Card className="bg-card/95 backdrop-blur-sm border-2 shadow-lg p-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <span className="font-mono text-lg font-bold">{formatTime(pomodoro.timeRemaining)}</span>
            </div>
            <div className="flex gap-1">
              {!pomodoro.isRunning || pomodoro.isPaused ? (
                <Button size="sm" variant="ghost" onClick={pomodoro.isRunning ? pomodoro.resume : pomodoro.start}>
                  <Play className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={pomodoro.pause}>
                  <Pause className="w-4 h-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setIsMinimized(false)}>
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={closeWidget}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
        <PomodoroSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={pomodoro.settings}
          onSave={pomodoro.updateSettings}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          setPosition({ x: position.x + info.offset.x, y: position.y + info.offset.y });
        }}
        style={{ x: position.x, y: position.y }}
        className="fixed z-[9999] cursor-move"
      >
        <Card className="w-80 bg-card/95 backdrop-blur-sm border-2 shadow-2xl">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Pomodoro Timer</h3>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsMinimized(true)}>
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={closeWidget}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Session Info */}
            <div className="text-center space-y-2">
              <p className={cn("text-sm font-medium", sessionInfo.color)}>
                {sessionInfo.label}
              </p>
              <p className="text-xs text-muted-foreground">
                Session {pomodoro.currentCycle} of {pomodoro.totalCycles}
              </p>
            </div>

            {/* Circular Progress */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    className="text-primary"
                    initial={{ strokeDasharray: '552.92', strokeDashoffset: '552.92' }}
                    animate={{
                      strokeDashoffset: `${552.92 - (552.92 * (100 - progress)) / 100}`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold font-mono">
                      {formatTime(pomodoro.timeRemaining)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2">
              {!pomodoro.isRunning || pomodoro.isPaused ? (
                <Button 
                  size="lg" 
                  onClick={pomodoro.isRunning ? pomodoro.resume : pomodoro.start}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  {pomodoro.isRunning ? 'Resume' : 'Start'}
                </Button>
              ) : (
                <Button size="lg" onClick={pomodoro.pause} variant="secondary" className="gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              )}
              <Button size="lg" onClick={pomodoro.reset} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <PomodoroSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={pomodoro.settings}
        onSave={pomodoro.updateSettings}
      />
    </>
  );
};
