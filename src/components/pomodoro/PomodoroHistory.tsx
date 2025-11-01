import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Clock, Coffee, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SessionType } from '@/hooks/usePomodoro';
import { cn } from '@/lib/utils';

interface PomodoroHistoryProps {
  onClose: () => void;
}

export const PomodoroHistory = ({ onClose }: PomodoroHistoryProps) => {
  const { user } = useAuth();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['pomodoro-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getSessionIcon = (type: SessionType) => {
    switch (type) {
      case 'work':
        return <Zap className="h-4 w-4" />;
      case 'short_break':
        return <Coffee className="h-4 w-4" />;
      case 'long_break':
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSessionLabel = (type: SessionType) => {
    switch (type) {
      case 'work':
        return 'Work';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
    }
  };

  const getSessionColor = (type: SessionType) => {
    switch (type) {
      case 'work':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'short_break':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'long_break':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
      >
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Session History</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn(
                            "p-2 rounded-lg",
                            getSessionColor(session.session_type as SessionType)
                          )}>
                            {getSessionIcon(session.session_type as SessionType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">
                                {getSessionLabel(session.session_type as SessionType)}
                              </p>
                              {session.subject && (
                                <Badge variant="outline" className="text-xs">
                                  {session.subject}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {session.work_duration} minutes
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(session.date), 'MMM dd, yyyy • hh:mm a')}
                            </p>
                          </div>
                        </div>
                        {session.end_time && (
                          <Badge variant="secondary" className="text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sessions recorded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start your first Pomodoro session to track your focus time!
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};
