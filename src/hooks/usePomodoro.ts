import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

export type SessionType = 'work' | 'short_break' | 'long_break';

export interface PomodoroSettings {
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
  sound_enabled: boolean;
}

export interface PomodoroSession {
  id?: string;
  user_id: string;
  session_type: SessionType;
  subject?: string;
  work_duration: number;
  break_duration?: number;
  completed_sessions: number;
  start_time: string;
  end_time?: string;
  date: string;
}

const STORAGE_KEY = 'pomodoro_state';

export const usePomodoro = (linkedSubject?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [cycleCount, setCycleCount] = useState(1);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch user settings
  const { data: settings } = useQuery({
    queryKey: ['pomodoro-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('pomodoro_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Create default settings if none exist
      if (!data) {
        const defaultSettings = {
          user_id: user.id,
          work_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          auto_start_breaks: false,
          auto_start_pomodoros: false,
          sound_enabled: true,
        };
        
        const { data: newSettings, error: insertError } = await supabase
          .from('pomodoro_settings')
          .insert(defaultSettings)
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings;
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Save session mutation
  const saveSessionMutation = useMutation({
    mutationFn: async (session: PomodoroSession) => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert(session)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, end_time }: { id: string; end_time: string }) => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update({ end_time })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Load state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setTimeLeft(state.timeLeft);
        setSessionType(state.sessionType);
        setCycleCount(state.cycleCount);
      } catch (e) {
        console.error('Failed to load pomodoro state', e);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ timeLeft, sessionType, cycleCount })
    );
  }, [timeLeft, sessionType, cycleCount]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDaJ0fPTgjMGHm7A7+OYSA8HMnzH8+elUhcOVKno8pxMEQZKo+Tt');
  }, []);

  const playSound = useCallback(() => {
    if (settings?.sound_enabled && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Failed to play sound', e));
    }
  }, [settings]);

  const startSession = useCallback(async () => {
    if (!user) return;

    const duration = sessionType === 'work' 
      ? (settings?.work_duration || 25)
      : sessionType === 'short_break'
      ? (settings?.short_break_duration || 5)
      : (settings?.long_break_duration || 15);

    const session: PomodoroSession = {
      user_id: user.id,
      session_type: sessionType,
      subject: linkedSubject,
      work_duration: settings?.work_duration || 25,
      break_duration: sessionType !== 'work' ? duration : undefined,
      completed_sessions: cycleCount,
      start_time: new Date().toISOString(),
      date: new Date().toISOString(),
    };

    try {
      const result = await saveSessionMutation.mutateAsync(session);
      setCurrentSessionId(result.id);
    } catch (error) {
      console.error('Failed to save session', error);
    }
  }, [user, sessionType, settings, linkedSubject, cycleCount, saveSessionMutation]);

  const completeSession = useCallback(async () => {
    if (currentSessionId) {
      try {
        await updateSessionMutation.mutateAsync({
          id: currentSessionId,
          end_time: new Date().toISOString(),
        });
        
        if (sessionType === 'work') {
          toast({
            title: 'Work session completed!',
            description: 'Great job! Time for a break.',
          });
        }
      } catch (error) {
        console.error('Failed to complete session', error);
      }
      setCurrentSessionId(null);
    }
  }, [currentSessionId, sessionType, updateSessionMutation, toast]);

  const switchPhase = useCallback(() => {
    playSound();
    completeSession();

    if (sessionType === 'work') {
      const isLongBreak = cycleCount % 4 === 0;
      const nextPhase = isLongBreak ? 'long_break' : 'short_break';
      const duration = isLongBreak 
        ? (settings?.long_break_duration || 15)
        : (settings?.short_break_duration || 5);
      
      setSessionType(nextPhase);
      setTimeLeft(duration * 60);
      
      if (settings?.auto_start_breaks) {
        setIsRunning(true);
        startSession();
      } else {
        setIsRunning(false);
      }
    } else {
      setSessionType('work');
      setTimeLeft((settings?.work_duration || 25) * 60);
      setCycleCount(prev => prev + 1);
      
      if (settings?.auto_start_pomodoros) {
        setIsRunning(true);
        startSession();
      } else {
        setIsRunning(false);
      }
    }
  }, [sessionType, cycleCount, settings, playSound, completeSession, startSession]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            switchPhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, switchPhase]);

  const start = useCallback(() => {
    setIsRunning(true);
    if (!currentSessionId) {
      startSession();
    }
  }, [currentSessionId, startSession]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    if (currentSessionId) {
      completeSession();
    }
    const duration = sessionType === 'work'
      ? (settings?.work_duration || 25)
      : sessionType === 'short_break'
      ? (settings?.short_break_duration || 5)
      : (settings?.long_break_duration || 15);
    setTimeLeft(duration * 60);
  }, [sessionType, settings, currentSessionId, completeSession]);

  const skip = useCallback(() => {
    completeSession();
    switchPhase();
  }, [completeSession, switchPhase]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progress = useCallback(() => {
    const totalDuration = sessionType === 'work'
      ? (settings?.work_duration || 25) * 60
      : sessionType === 'short_break'
      ? (settings?.short_break_duration || 5) * 60
      : (settings?.long_break_duration || 15) * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  }, [timeLeft, sessionType, settings]);

  return {
    isRunning,
    timeLeft,
    sessionType,
    cycleCount,
    settings,
    formatTime,
    progress,
    start,
    pause,
    reset,
    skip,
  };
};
