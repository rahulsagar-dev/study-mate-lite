import { createContext, useContext, useState, ReactNode } from 'react';
import { PomodoroWidget } from '@/components/pomodoro/PomodoroWidget';
import { PomodoroButton } from '@/components/pomodoro/PomodoroButton';
import { useAuth } from './AuthContext';

interface PomodoroContextType {
  showWidget: boolean;
  openWidget: () => void;
  closeWidget: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within PomodoroProvider');
  }
  return context;
};

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [showWidget, setShowWidget] = useState(false);

  const openWidget = () => setShowWidget(true);
  const closeWidget = () => setShowWidget(false);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <PomodoroContext.Provider value={{ showWidget, openWidget, closeWidget }}>
      {children}
      {showWidget ? <PomodoroWidget /> : <PomodoroButton onClick={openWidget} />}
    </PomodoroContext.Provider>
  );
};
