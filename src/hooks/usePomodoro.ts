import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type SessionType = 'work' | 'short_break' | 'long_break';

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
}

export interface PomodoroState {
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number;
  sessionType: SessionType;
  currentCycle: number;
  totalCycles: number;
  settings: PomodoroSettings;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
};

const STORAGE_KEY = 'pomodoro-state';

export const usePomodoro = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PomodoroState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return {
      isRunning: false,
      isPaused: false,
      timeRemaining: DEFAULT_SETTINGS.workDuration * 60,
      sessionType: 'work' as SessionType,
      currentCycle: 1,
      totalCycles: 4,
      settings: DEFAULT_SETTINGS,
    };
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const sessionStartRef = useRef<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  // Load settings from database and subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('pomodoro_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        const settings: PomodoroSettings = {
          workDuration: (data as any).work_duration,
          shortBreakDuration: (data as any).short_break_duration,
          longBreakDuration: (data as any).long_break_duration,
          autoStartBreaks: (data as any).auto_start_breaks || false,
          autoStartPomodoros: (data as any).auto_start_pomodoros || false,
          soundEnabled: (data as any).sound_enabled || false,
        };
        setState(prev => {
          const newTimeRemaining = prev.isRunning 
            ? prev.timeRemaining 
            : prev.sessionType === 'work'
            ? settings.workDuration * 60
            : prev.sessionType === 'short_break'
            ? settings.shortBreakDuration * 60
            : settings.longBreakDuration * 60;
          
          return { 
            ...prev, 
            settings,
            timeRemaining: newTimeRemaining
          };
        });
      } else {
        // Create default settings
        await supabase.from('pomodoro_settings' as any).insert({
          user_id: user.id,
          work_duration: DEFAULT_SETTINGS.workDuration,
          short_break_duration: DEFAULT_SETTINGS.shortBreakDuration,
          long_break_duration: DEFAULT_SETTINGS.longBreakDuration,
          auto_start_breaks: DEFAULT_SETTINGS.autoStartBreaks,
          auto_start_pomodoros: DEFAULT_SETTINGS.autoStartPomodoros,
          sound_enabled: DEFAULT_SETTINGS.soundEnabled,
        });
      }
    };

    loadSettings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('pomodoro-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pomodoro_settings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Settings updated in real-time:', payload);
          const data = payload.new as any;
          const settings: PomodoroSettings = {
            workDuration: data.work_duration,
            shortBreakDuration: data.short_break_duration,
            longBreakDuration: data.long_break_duration,
            autoStartBreaks: data.auto_start_breaks || false,
            autoStartPomodoros: data.auto_start_pomodoros || false,
            soundEnabled: data.sound_enabled || false,
          };
          setState(prev => {
            // Only update time remaining if timer is not running
            const newTimeRemaining = prev.isRunning 
              ? prev.timeRemaining 
              : prev.sessionType === 'work'
              ? settings.workDuration * 60
              : prev.sessionType === 'short_break'
              ? settings.shortBreakDuration * 60
              : settings.longBreakDuration * 60;
            
            return { 
              ...prev, 
              settings,
              timeRemaining: newTimeRemaining
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const playSound = useCallback(() => {
    if (state.settings.soundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.error('Error playing sound:', e));
    }
  }, [state.settings.soundEnabled]);

  const saveSessionToDatabase = useCallback(async (sessionType: SessionType, duration: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions' as any)
        .insert({
          user_id: user.id,
          session_type: sessionType,
          work_duration: duration,
          start_time: sessionStartRef.current || new Date().toISOString(),
          end_time: new Date().toISOString(),
          completed_sessions: sessionType === 'work' ? 1 : 0,
        })
        .select()
        .single();

      if (error) throw error;
      currentSessionIdRef.current = (data as any).id;
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [user]);

  const handleSessionComplete = useCallback(async () => {
    playSound();
    
    const currentType = state.sessionType;
    const duration = currentType === 'work' 
      ? state.settings.workDuration 
      : currentType === 'short_break' 
      ? state.settings.shortBreakDuration 
      : state.settings.longBreakDuration;

    await saveSessionToDatabase(currentType, duration);

    let nextType: SessionType;
    let nextCycle = state.currentCycle;
    let shouldAutoStart = false;

    if (currentType === 'work') {
      if (nextCycle >= state.totalCycles) {
        nextType = 'long_break';
        nextCycle = 1;
        toast.success('🎉 Cycle complete! Time for a long break.');
      } else {
        nextType = 'short_break';
        nextCycle += 1;
        toast.success('✅ Work session complete! Time for a short break.');
      }
      shouldAutoStart = state.settings.autoStartBreaks;
    } else {
      nextType = 'work';
      toast.success('💪 Break complete! Ready to focus?');
      shouldAutoStart = state.settings.autoStartPomodoros;
    }

    const nextDuration = nextType === 'work' 
      ? state.settings.workDuration 
      : nextType === 'short_break' 
      ? state.settings.shortBreakDuration 
      : state.settings.longBreakDuration;

    setState(prev => ({
      ...prev,
      sessionType: nextType,
      currentCycle: nextCycle,
      timeRemaining: nextDuration * 60,
      isRunning: shouldAutoStart,
      isPaused: false,
    }));

    if (shouldAutoStart) {
      sessionStartRef.current = new Date().toISOString();
    } else {
      sessionStartRef.current = null;
    }
  }, [state, playSound, saveSessionToDatabase]);

  // Timer countdown
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining <= 1) {
            // Stop the timer and trigger session complete
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            handleSessionComplete();
            return { ...prev, timeRemaining: 0, isRunning: false };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, handleSessionComplete]);


  const start = useCallback(() => {
    sessionStartRef.current = new Date().toISOString();
    setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const reset = useCallback(() => {
    sessionStartRef.current = null;
    currentSessionIdRef.current = null;
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      timeRemaining: prev.settings.workDuration * 60,
      sessionType: 'work',
      currentCycle: 1,
    }));
  }, []);

  const skip = useCallback(() => {
    console.log('Skipping session');
    
    const currentType = state.sessionType;
    let nextType: SessionType;
    let nextCycle = state.currentCycle;
    let shouldAutoStart = false;

    if (currentType === 'work') {
      nextCycle += 1;
      if (nextCycle % 4 === 0) {
        nextType = 'long_break';
        shouldAutoStart = state.settings.autoStartBreaks;
      } else {
        nextType = 'short_break';
        shouldAutoStart = state.settings.autoStartBreaks;
      }
    } else {
      nextType = 'work';
      shouldAutoStart = state.settings.autoStartPomodoros;
    }

    const nextDuration = nextType === 'work' 
      ? state.settings.workDuration 
      : nextType === 'short_break'
      ? state.settings.shortBreakDuration
      : state.settings.longBreakDuration;

    sessionStartRef.current = null;
    currentSessionIdRef.current = null;

    setState(prev => ({
      ...prev,
      sessionType: nextType,
      currentCycle: nextCycle,
      timeRemaining: nextDuration * 60,
      isRunning: shouldAutoStart,
      isPaused: false,
    }));

    if (shouldAutoStart) {
      sessionStartRef.current = new Date().toISOString();
    }

    toast.info('⏭️ Session skipped');
  }, [state]);

  const updateSettings = useCallback(async (newSettings: Partial<PomodoroSettings>) => {
    if (!user) return;

    const updated = { ...state.settings, ...newSettings };
    
    try {
      const { error } = await supabase
        .from('pomodoro_settings' as any)
        .upsert({
          user_id: user.id,
          work_duration: updated.workDuration,
          short_break_duration: updated.shortBreakDuration,
          long_break_duration: updated.longBreakDuration,
          auto_start_breaks: updated.autoStartBreaks,
          auto_start_pomodoros: updated.autoStartPomodoros,
          sound_enabled: updated.soundEnabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Real-time subscription will handle the state update
      toast.success('Settings saved!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to save settings');
    }
  }, [user, state.settings]);

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    skip,
    updateSettings,
  };
};
