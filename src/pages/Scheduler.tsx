import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Download, Save, Trash2, GraduationCap, History, FileDown, Copy, Eye, X, Settings, BarChart3, AlertCircle, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { TodoList } from '@/components/TodoList';

interface Subject {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Moderate' | 'Difficult';
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  difficulty: string;
  duration: number; // in hours
  breakTime: number; // in minutes
}

interface FreeTimeSlot {
  start: number; // hour in 24h format
  end: number;
  duration: number; // in hours
}

interface SchedulePlan {
  id: string;
  subjects: Subject[];
  dailyHours: number;
  planType: 'week' | 'month';
  freeSlots: string;
  schedule: TimeSlot[];
  createdAt: Date;
  totalStudyHours: number;
  weeklyHours: number;
}

interface StudyStats {
  plannedHours: number;
  availableHours: number;
  utilizationRate: number;
  subjectDistribution: { [key: string]: number };
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const difficultyColors = {
  'Easy': 'bg-success',
  'Moderate': 'bg-warning', 
  'Difficult': 'bg-destructive'
};

const difficultyTextColors = {
  'Easy': 'text-success-foreground',
  'Moderate': 'text-warning-foreground',
  'Difficult': 'text-destructive-foreground'
};

// Session duration mapping based on difficulty
const sessionDurations = {
  'Easy': { study: 55, break: 5, total: 1.0 }, // 1 hour total
  'Moderate': { study: 70, break: 5, total: 1.25 }, // 1.25 hours total
  'Difficult': { study: 85, break: 5, total: 1.5 } // 1.5 hours total
};

export default function Scheduler() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Difficult'>('Moderate');
  const [dailyHours, setDailyHours] = useState<number>(4);
  const [planType, setPlanType] = useState<'week' | 'month'>('week');
  const [freeSlots, setFreeSlots] = useState('3-5 pm, 7-9 pm');
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedulePlans, setSchedulePlans] = useState<SchedulePlan[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [error, setError] = useState<string>('');
  const [showTodos, setShowTodos] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  // Get today's subjects from schedule
  const getTodaySubjects = (): string[] => {
    const today = weekDays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const todaySchedule = schedule.filter(slot => slot.day === today);
    return [...new Set(todaySchedule.map(slot => slot.subject))];
  };

  const allSubjects = subjects.map(s => s.name);

  // Load saved plans from localStorage
  useEffect(() => {
    const savedPlans = localStorage.getItem('scheduler-plans');
    if (savedPlans) {
      try {
        const plans = JSON.parse(savedPlans).map((plan: any) => ({
          ...plan,
          createdAt: new Date(plan.createdAt)
        }));
        setSchedulePlans(plans);
      } catch (error) {
        console.error('Error loading saved plans:', error);
      }
    }
  }, []);

  // Save plans to localStorage
  const savePlansToStorage = (plans: SchedulePlan[]) => {
    localStorage.setItem('scheduler-plans', JSON.stringify(plans));
    setSchedulePlans(plans);
  };

  // Parse free time slots from string format
  const parseFreeTimeSlots = (slotsString: string): FreeTimeSlot[] => {
    const slots: FreeTimeSlot[] = [];
    const ranges = slotsString.split(',').map(s => s.trim());
    
    for (const range of ranges) {
      const match = range.match(/(\d{1,2}(?::\d{2})?)\s*-\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/i);
      if (match) {
        let [, start, end, period] = match;
        
        // Convert to 24h format
        let startHour = parseFloat(start.replace(':', '.'));
        let endHour = parseFloat(end.replace(':', '.'));
        
        if (period?.toLowerCase() === 'pm' && startHour < 12) startHour += 12;
        if (period?.toLowerCase() === 'pm' && endHour < 12) endHour += 12;
        if (period?.toLowerCase() === 'am' && startHour === 12) startHour = 0;
        if (period?.toLowerCase() === 'am' && endHour === 12) endHour = 0;
        
        // Handle implicit PM for afternoon times
        if (!period && startHour >= 3 && startHour < 12) {
          startHour += 12;
          endHour += 12;
        }
        
        if (endHour > startHour) {
          slots.push({
            start: startHour,
            end: endHour,
            duration: endHour - startHour
          });
        }
      }
    }
    
    return slots;
  };

  // Calculate total available study time
  const calculateAvailableTime = (freeSlots: FreeTimeSlot[]): number => {
    return freeSlots.reduce((total, slot) => total + slot.duration, 0);
  };

  // Add subject with validation
  const addSubject = () => {
    if (!newSubject.trim()) {
      setError('Please enter a subject name.');
      return;
    }

    if (subjects.some(s => s.name.toLowerCase() === newSubject.toLowerCase())) {
      setError('Subject already exists.');
      return;
    }

    const subject: Subject = {
      id: Date.now().toString(),
      name: newSubject.trim(),
      difficulty
    };

    setSubjects(prev => [...prev, subject]);
    setNewSubject('');
    setError('');
    
    toast({
      title: "Subject Added",
      description: `${subject.name} (${difficulty}) added successfully.`,
    });
  };

  // Remove subject
  const removeSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  // Generate optimized schedule using AI logic
  const generateSchedule = async () => {
    // Validation
    if (subjects.length < 2) {
      setError('Please enter at least 2 subjects.');
      return;
    }

    const freeTimeSlots = parseFreeTimeSlots(freeSlots);
    const availableTime = calculateAvailableTime(freeTimeSlots);
    
    if (availableTime < 1) {
      setError('Not enough time to create a schedule. Please add more free time slots.');
      return;
    }

    if (availableTime < dailyHours) {
      setError(`Available time (${availableTime}h) is less than desired daily hours (${dailyHours}h). Adjusting automatically.`);
    }

    setIsGenerating(true);
    setError('');
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedSchedule = await generateOptimizedSchedule(
        subjects, 
        Math.min(dailyHours, availableTime), 
        freeTimeSlots
      );
      
      setSchedule(generatedSchedule);
      
      // Calculate stats
      const studyStats = calculateStudyStats(generatedSchedule, availableTime);
      setStats(studyStats);
      
      toast({
        title: "Schedule Generated",
        description: `Created optimized timetable with ${generatedSchedule.length} study sessions.`,
      });
      
    } catch (error) {
      setError('Failed to generate schedule. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI-powered schedule generation algorithm
  const generateOptimizedSchedule = async (
    subjects: Subject[], 
    targetDailyHours: number, 
    freeSlots: FreeTimeSlot[]
  ): Promise<TimeSlot[]> => {
    const schedule: TimeSlot[] = [];
    
    // Sort subjects by difficulty (difficult first for better distribution)
    const sortedSubjects = [...subjects].sort((a, b) => {
      const difficultyOrder = { 'Difficult': 3, 'Moderate': 2, 'Easy': 1 };
      return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
    });
    
    // Calculate sessions needed per subject based on difficulty
    const subjectSessions: { [key: string]: number } = {};
    const totalWeightedDifficulty = subjects.reduce((sum, s) => {
      const weight = s.difficulty === 'Difficult' ? 3 : s.difficulty === 'Moderate' ? 2 : 1;
      return sum + weight;
    }, 0);
    
    subjects.forEach(subject => {
      const weight = subject.difficulty === 'Difficult' ? 3 : subject.difficulty === 'Moderate' ? 2 : 1;
      const proportion = weight / totalWeightedDifficulty;
      subjectSessions[subject.id] = Math.max(1, Math.round(proportion * 7)); // At least 1 session per week
    });
    
    // Generate schedule for each day
    let subjectIndex = 0;
    const subjectUsageCount: { [key: string]: number } = {};
    
    for (const day of weekDays) {
      const daySlots = [...freeSlots]; // Copy available slots
      let remainingDailyHours = targetDailyHours;
      let lastSubjectId = '';
      
      while (remainingDailyHours > 0 && daySlots.length > 0) {
        // Find best fitting slot
        const currentSubject = sortedSubjects[subjectIndex % sortedSubjects.length];
        const sessionInfo = sessionDurations[currentSubject.difficulty];
        
        // Skip if same subject was used consecutively (unless no other options)
        if (currentSubject.id === lastSubjectId && sortedSubjects.length > 1) {
          subjectIndex++;
          continue;
        }
        
        // Find a slot that can fit this session
        const suitableSlotIndex = daySlots.findIndex(slot => slot.duration >= sessionInfo.total);
        
        if (suitableSlotIndex === -1) {
          break; // No suitable slots left
        }
        
        const slot = daySlots[suitableSlotIndex];
        const startTime = slot.start;
        const endTime = startTime + sessionInfo.total;
        
        // Create time slot
        const timeSlot: TimeSlot = {
          day,
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
          subject: currentSubject.name,
          difficulty: currentSubject.difficulty,
          duration: sessionInfo.total,
          breakTime: sessionInfo.break
        };
        
        schedule.push(timeSlot);
        
        // Update tracking
        subjectUsageCount[currentSubject.id] = (subjectUsageCount[currentSubject.id] || 0) + 1;
        remainingDailyHours -= sessionInfo.total;
        lastSubjectId = currentSubject.id;
        
        // Update slot or remove if fully used
        if (slot.duration > sessionInfo.total) {
          daySlots[suitableSlotIndex] = {
            ...slot,
            start: endTime,
            duration: slot.duration - sessionInfo.total
          };
        } else {
          daySlots.splice(suitableSlotIndex, 1);
        }
        
        subjectIndex++;
      }
    }
    
    return schedule;
  };

  // Format time from decimal to HH:MM
  const formatTime = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Calculate study statistics
  const calculateStudyStats = (schedule: TimeSlot[], availableHours: number): StudyStats => {
    const plannedHours = schedule.reduce((total, slot) => total + slot.duration, 0);
    const utilizationRate = (plannedHours / (availableHours * 7)) * 100;
    
    const subjectDistribution: { [key: string]: number } = {};
    schedule.forEach(slot => {
      subjectDistribution[slot.subject] = (subjectDistribution[slot.subject] || 0) + slot.duration;
    });
    
    return {
      plannedHours,
      availableHours: availableHours * 7,
      utilizationRate,
      subjectDistribution
    };
  };

  // Save current schedule to history
  const saveSchedule = () => {
    if (schedule.length === 0) {
      toast({
        title: "Nothing to Save",
        description: "Generate a schedule first.",
        variant: "destructive"
      });
      return;
    }

    const newPlan: SchedulePlan = {
      id: Date.now().toString(),
      subjects: [...subjects],
      dailyHours,
      planType,
      freeSlots,
      schedule: [...schedule],
      createdAt: new Date(),
      totalStudyHours: schedule.reduce((sum, slot) => sum + slot.duration, 0),
      weeklyHours: dailyHours * 7
    };

    const updatedPlans = [newPlan, ...schedulePlans].slice(0, 10); // Keep last 10 plans
    savePlansToStorage(updatedPlans);
    
    toast({
      title: "Schedule Saved",
      description: "Schedule saved to your history.",
    });
  };

  // Export schedule as CSV
  const exportSchedule = (format: 'csv' | 'pdf') => {
    if (schedule.length === 0) {
      toast({
        title: "Nothing to Export",
        description: "Generate a schedule first.",
        variant: "destructive"
      });
      return;
    }

    if (format === 'csv') {
      const csvContent = [
        ['Day', 'Start Time', 'End Time', 'Subject', 'Difficulty', 'Duration (hrs)', 'Break (min)'],
        ...schedule.map(slot => [
          slot.day,
          slot.startTime,
          slot.endTime,
          slot.subject,
          slot.difficulty,
          slot.duration.toString(),
          slot.breakTime.toString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-schedule-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Schedule exported as CSV file.",
      });
    } else {
      // Mock PDF export
      toast({
        title: "PDF Export",
        description: "PDF export feature coming soon!",
      });
    }
  };

  // Delete plan from history
  const deletePlan = (planId: string) => {
    const updatedPlans = schedulePlans.filter(plan => plan.id !== planId);
    savePlansToStorage(updatedPlans);
    toast({
      title: "Plan Deleted",
      description: "Schedule removed from history.",
    });
  };

  // Load plan from history
  const loadPlan = (plan: SchedulePlan) => {
    setSubjects(plan.subjects);
    setDailyHours(plan.dailyHours);
    setPlanType(plan.planType);
    setFreeSlots(plan.freeSlots);
    setSchedule(plan.schedule);
    
    const studyStats = calculateStudyStats(plan.schedule, calculateAvailableTime(parseFreeTimeSlots(plan.freeSlots)));
    setStats(studyStats);
    
    toast({
      title: "Plan Loaded",
      description: "Schedule loaded from history.",
    });
  };

  // Copy schedule to clipboard
  const copySchedule = (plan: SchedulePlan) => {
    const scheduleText = plan.schedule.map(slot => 
      `${slot.day}: ${slot.startTime}-${slot.endTime} → ${slot.subject} (${slot.difficulty})`
    ).join('\n');
    
    navigator.clipboard.writeText(scheduleText);
    toast({
      title: "Copied",
      description: "Schedule copied to clipboard.",
    });
  };

  const getDaySchedule = (day: string) => {
    return schedule.filter(slot => slot.day === day);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AI Study Scheduler
              </span>
            </h1>
            <p className="text-muted-foreground">
              Generate optimized study timetables based on subject difficulty and available time
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowHistory(true)} variant="outline" className="gap-2">
              <History className="h-5 w-5" />
              Schedule History ({schedulePlans.length})
            </Button>
            <Button onClick={() => setShowTodos(!showTodos)} variant="outline" className="gap-2">
              <ListTodo className="h-5 w-5" />
              {showTodos ? 'Hide' : 'Show'} Tasks
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Todo List Sidebar */}
          {showTodos && (
            <div className="lg:col-span-1 lg:row-span-2">
              <Card className="h-[800px]">
                <TodoList todaySubjects={getTodaySubjects()} subjects={allSubjects} />
              </Card>
            </div>
          )}
          {/* Input Form */}
          <div className={showTodos ? "lg:col-span-1 space-y-6" : "lg:col-span-1 space-y-6"}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Subjects & Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Subject name"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                      className="flex-1"
                    />
                    <Button onClick={addSubject} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy (1hr sessions)</SelectItem>
                      <SelectItem value="Moderate">Moderate (1.25hr sessions)</SelectItem>
                      <SelectItem value="Difficult">Difficult (1.5hr sessions)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${difficultyColors[subject.difficulty]}`} />
                        <span className="font-medium text-sm">{subject.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {subject.difficulty}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSubject(subject.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Study Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dailyHours">Daily Study Hours</Label>
                  <Input
                    id="dailyHours"
                    type="number"
                    min="1"
                    max="12"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="planType">Schedule Type</Label>
                  <Select value={planType} onValueChange={(value: any) => setPlanType(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Weekly (Mon-Sun)</SelectItem>
                      <SelectItem value="month">Monthly (4 weeks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="freeSlots">Free Time Slots</Label>
                  <Input
                    id="freeSlots"
                    placeholder="e.g., 3-5 pm, 7-9 pm"
                    value={freeSlots}
                    onChange={(e) => setFreeSlots(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available study times (comma-separated)
                  </p>
                </div>

                <Button 
                  onClick={generateSchedule} 
                  disabled={isGenerating || subjects.length < 2}
                  className="w-full"
                >
                  {isGenerating ? 'Generating AI Schedule...' : 'Generate Timetable'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Output */}
          <div className={showTodos ? "lg:col-span-2" : "lg:col-span-2"}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Timetable
                  </CardTitle>
                  {schedule.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => exportSchedule('csv')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportSchedule('pdf')}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={saveSchedule}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-pulse-glow rounded-xl bg-gradient-primary p-4">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : schedule.length > 0 ? (
                  <div className="space-y-4">
                    {weekDays.map((day) => {
                      const daySchedule = getDaySchedule(day);
                      return (
                        <div key={day}>
                          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            {day}
                            <Badge variant="outline" className="text-xs">
                              {daySchedule.reduce((sum, slot) => sum + slot.duration, 0).toFixed(1)}h
                            </Badge>
                          </h3>
                          {daySchedule.length > 0 ? (
                            <div className="grid gap-2">
                              {daySchedule.map((slot, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`w-3 h-3 rounded-full ${difficultyColors[slot.difficulty as keyof typeof difficultyColors]}`} />
                                    <span className="font-medium text-sm">{slot.startTime} - {slot.endTime}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="font-semibold">{slot.subject}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {slot.duration}h
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {slot.difficulty}
                                    </Badge>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">No sessions scheduled</p>
                          )}
                          {day !== weekDays[weekDays.length - 1] && <Separator className="mt-4" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Your optimized timetable will appear here</p>
                    <p className="text-sm mt-2">Add subjects and generate your AI-powered schedule</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats & History Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Study Statistics */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Study Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Weekly Hours</span>
                      <span>{stats.plannedHours.toFixed(1)}h</span>
                    </div>
                    <Progress value={stats.utilizationRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.utilizationRate.toFixed(1)}% utilization
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Subject Distribution</p>
                    {Object.entries(stats.subjectDistribution).map(([subject, hours]) => (
                      <div key={subject} className="flex justify-between text-xs">
                        <span className="truncate">{subject}</span>
                        <span>{hours.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History Drawer */}
            <Sheet open={showHistory} onOpenChange={setShowHistory}>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Schedule History</SheetTitle>
                  <SheetDescription>
                    View, load, or delete your saved schedules
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {schedulePlans.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No saved schedules yet</p>
                    </div>
                  ) : (
                    schedulePlans.map((plan) => (
                      <Card key={plan.id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {plan.subjects.length} subjects • {plan.totalStudyHours.toFixed(1)}h
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {plan.planType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {plan.createdAt.toLocaleDateString()} at {plan.createdAt.toLocaleTimeString()}
                          </p>
                          <div className="flex items-center gap-1">
                            {plan.subjects.slice(0, 3).map(subject => (
                              <Badge key={subject.id} variant="secondary" className="text-xs">
                                {subject.name}
                              </Badge>
                            ))}
                            {plan.subjects.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{plan.subjects.length - 3} more
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => loadPlan(plan)}
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Load
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => copySchedule(plan)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => deletePlan(plan.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.div>
    </div>
  );
}