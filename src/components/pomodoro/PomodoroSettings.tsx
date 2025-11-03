import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PomodoroSettings as PomodoroSettingsType } from '@/hooks/usePomodoro';

interface PomodoroSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PomodoroSettingsType;
  onSave: (settings: Partial<PomodoroSettingsType>) => void;
}

export const PomodoroSettings = ({ isOpen, onClose, settings, onSave }: PomodoroSettingsProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle>Pomodoro Settings</CardTitle>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Customize your focus sessions and break durations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="work">Work Duration (minutes)</Label>
                  <Input
                    id="work"
                    type="number"
                    min="1"
                    max="60"
                    value={localSettings.workDuration}
                    onChange={(e) => setLocalSettings({ ...localSettings, workDuration: parseInt(e.target.value) || 25 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortBreak">Short Break (minutes)</Label>
                  <Input
                    id="shortBreak"
                    type="number"
                    min="1"
                    max="30"
                    value={localSettings.shortBreakDuration}
                    onChange={(e) => setLocalSettings({ ...localSettings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longBreak">Long Break (minutes)</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    min="1"
                    max="60"
                    value={localSettings.longBreakDuration}
                    onChange={(e) => setLocalSettings({ ...localSettings, longBreakDuration: parseInt(e.target.value) || 15 })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="autoBreak" className="flex-1">Auto-start Breaks</Label>
                  <Switch
                    id="autoBreak"
                    checked={localSettings.autoStartBreaks}
                    onCheckedChange={(checked) => setLocalSettings({ ...localSettings, autoStartBreaks: checked })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="autoPomodoro" className="flex-1">Auto-start Pomodoros</Label>
                  <Switch
                    id="autoPomodoro"
                    checked={localSettings.autoStartPomodoros}
                    onCheckedChange={(checked) => setLocalSettings({ ...localSettings, autoStartPomodoros: checked })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="sound" className="flex-1">Sound Notifications</Label>
                  <Switch
                    id="sound"
                    checked={localSettings.soundEnabled}
                    onCheckedChange={(checked) => setLocalSettings({ ...localSettings, soundEnabled: checked })}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
