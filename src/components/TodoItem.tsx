import { useState } from 'react';
import { Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { Todo, PriorityLevel } from '@/hooks/useTodos';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onUpdate: (updates: Partial<Todo>) => void;
  onDelete: () => void;
  subjects: string[];
  dragHandleProps?: any;
}

const priorityColors = {
  high: 'border-l-4 border-l-destructive bg-destructive/5',
  medium: 'border-l-4 border-l-warning bg-warning/5',
  low: 'border-l-4 border-l-primary bg-primary/5',
};

export const TodoItem = ({ todo, onToggle, onUpdate, onDelete, subjects, dragHandleProps }: TodoItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [priority, setPriority] = useState<PriorityLevel>(todo.priority);
  const [subject, setSubject] = useState(todo.subject || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    todo.due_date ? new Date(todo.due_date) : undefined
  );

  const handleSave = () => {
    onUpdate({
      title,
      description,
      priority,
      subject: subject || undefined,
      due_date: dueDate?.toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(todo.title);
    setDescription(todo.description || '');
    setPriority(todo.priority);
    setSubject(todo.subject || '');
    setDueDate(todo.due_date ? new Date(todo.due_date) : undefined);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn('p-4 rounded-lg border bg-card', priorityColors[priority])}>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="font-medium"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          <div className="flex flex-wrap gap-2">
            <Select value={priority} onValueChange={(v) => setPriority(v as PriorityLevel)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="flex-1">
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" className="flex-1">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border bg-card transition-all duration-200 hover:shadow-md',
      priorityColors[todo.priority],
      todo.completed && 'opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing pt-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <Checkbox
          checked={todo.completed}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-medium',
            todo.completed && 'line-through text-muted-foreground'
          )}>
            {todo.title}
          </h4>
          
          {todo.description && (
            <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {todo.subject && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                {todo.subject}
              </span>
            )}
            {todo.due_date && (
              <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                📅 {format(new Date(todo.due_date), 'MMM dd')}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
