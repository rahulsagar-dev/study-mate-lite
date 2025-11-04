import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PomodoroButtonProps {
  onClick: () => void;
}

export const PomodoroButton = ({ onClick }: PomodoroButtonProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 right-6 z-[9998]"
    >
      <Button
        size="lg"
        onClick={onClick}
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
      >
        <Timer className="w-6 h-6" />
      </Button>
    </motion.div>
  );
};
