import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PomodoroSettingsProps {
  onClose: () => void;
}

export const PomodoroSettings = ({ onClose }: PomodoroSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pomodoro_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setWorkDuration(data.work_duration);
        setShortBreak(data.short_break_duration);
        setLongBreak(data.long_break_duration);
        setAutoStartBreaks(data.auto_start_breaks);
        setAutoStartPomodoros(data.auto_start_pomodoros);
        setSoundEnabled(data.sound_enabled);
      }
    } catch (error) {
      console.error('Failed to load settings', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const settings = {
        user_id: user.id,
        work_duration: workDuration,
        short_break_duration: shortBreak,
        long_break_duration: longBreak,
        auto_start_breaks: autoStartBreaks,
        auto_start_pomodoros: autoStartPomodoros,
        sound_enabled: soundEnabled,
      };

      const { error } = await supabase
        .from('pomodoro_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['pomodoro-settings'] });
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to save settings', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md my-auto"
      >
        <Card className="w-full p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Pomodoro Settings</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="work-duration">Work Duration (minutes)</Label>
              <Input
                id="work-duration"
                type="number"
                min="1"
                max="60"
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-break">Short Break (minutes)</Label>
              <Input
                id="short-break"
                type="number"
                min="1"
                max="30"
                value={shortBreak}
                onChange={(e) => setShortBreak(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="long-break">Long Break (minutes)</Label>
              <Input
                id="long-break"
                type="number"
                min="1"
                max="60"
                value={longBreak}
                onChange={(e) => setLongBreak(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-breaks">Auto-start Breaks</Label>
              <Switch
                id="auto-breaks"
                checked={autoStartBreaks}
                onCheckedChange={setAutoStartBreaks}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-pomodoros">Auto-start Pomodoros</Label>
              <Switch
                id="auto-pomodoros"
                checked={autoStartPomodoros}
                onCheckedChange={setAutoStartPomodoros}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound">Sound Notifications</Label>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
