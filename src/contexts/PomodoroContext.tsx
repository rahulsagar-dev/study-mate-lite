import { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
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

  const openWidget = () => {
    console.log('Opening Pomodoro widget');
    setShowWidget(true);
  };
  
  const closeWidget = () => {
    console.log('Closing Pomodoro widget');
    setShowWidget(false);
  };

  if (!user) {
    return <>{children}</>;
  }

  console.log('PomodoroProvider render - showWidget:', showWidget);

  return (
    <PomodoroContext.Provider value={{ showWidget, openWidget, closeWidget }}>
      {children}
      {!showWidget && <PomodoroButton onClick={openWidget} />}
      {showWidget && <PomodoroWidget />}
    </PomodoroContext.Provider>
  );
};
