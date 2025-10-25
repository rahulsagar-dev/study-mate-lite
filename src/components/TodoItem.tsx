import { useState } from 'react';
import { Pencil, Trash2, GripVertical, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Todo, PriorityLevel } from '@/hooks/useTodos';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  subjects: string[];
  dragHandleProps?: any;
}

const priorityColors: Record<PriorityLevel, string> = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-warning bg-warning/5',
  low: 'border-l-primary bg-primary/5',
};

const TodoItem = ({ todo, onToggle, onUpdate, onDelete, subjects, dragHandleProps }: TodoItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [editPriority, setEditPriority] = useState<PriorityLevel>(todo.priority);
  const [editSubject, setEditSubject] = useState(todo.subject || '');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    todo.due_date ? new Date(todo.due_date) : undefined
  );

  const handleSave = () => {
    onUpdate(todo.id, {
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      subject: editSubject,
      due_date: editDueDate?.toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditPriority(todo.priority);
    setEditSubject(todo.subject || '');
    setEditDueDate(todo.due_date ? new Date(todo.due_date) : undefined);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn('p-4 border-l-4 rounded-lg bg-card', priorityColors[editPriority])}>
        <div className="space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            className="font-medium"
          />
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={editPriority} onValueChange={(value) => setEditPriority(value as PriorityLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editSubject || undefined} onValueChange={setEditSubject}>
              <SelectTrigger>
                <SelectValue placeholder="No subject" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editDueDate ? format(editDueDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
              <Calendar
                mode="single"
                selected={editDueDate}
                onSelect={setEditDueDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="flex-1">
              Save
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 border-l-4 rounded-lg transition-all hover:shadow-md bg-card',
        priorityColors[todo.priority],
        todo.completed && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo.id)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <h4 className={cn('font-medium', todo.completed && 'line-through')}>
            {todo.title}
          </h4>
          {todo.description && (
            <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {todo.subject && (
              <Badge variant="secondary" className="text-xs">
                {todo.subject}
              </Badge>
            )}
            {todo.due_date && (
              <Badge variant="outline" className="text-xs">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {format(new Date(todo.due_date), 'MMM d')}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {todo.priority}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(todo.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
