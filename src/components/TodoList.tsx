import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { isToday, isThisWeek, isSameDay, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTodos } from '@/hooks/useTodos';
import TodoItem from '@/components/TodoItem';
import { Card } from '@/components/ui/card';

interface TodoListProps {
  todaySubjects: string[];
  subjects: string[];
}

const TodoList = ({ todaySubjects, subjects }: TodoListProps) => {
  const { todos, isLoading, addTodo, updateTodo, deleteTodo, toggleComplete, reorderTodos } = useTodos();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'today' | 'week'>('all');
  const [sort, setSort] = useState<'priority' | 'dueDate' | 'created'>('created');
  const [showTodaySection, setShowTodaySection] = useState(true);

  const filteredAndSortedTodos = useMemo(() => {
    let filtered = [...todos];

    // Apply filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(t => !t.completed);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
      case 'today':
        filtered = filtered.filter(t => 
          (t.due_date && isToday(new Date(t.due_date))) ||
          (t.subject && todaySubjects.includes(t.subject))
        );
        break;
      case 'week':
        filtered = filtered.filter(t => 
          t.due_date && isThisWeek(new Date(t.due_date))
        );
        break;
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sort) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'dueDate':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created':
        default:
          return a.position - b.position;
      }
    });

    return filtered;
  }, [todos, filter, sort, todaySubjects]);

  const todayTasks = useMemo(() => {
    return todos.filter(t => 
      (t.due_date && isToday(new Date(t.due_date))) ||
      (t.subject && todaySubjects.includes(t.subject))
    );
  }, [todos, todaySubjects]);

  const autoGenerateTodayTasks = () => {
    const existingSubjects = todayTasks.map(t => t.subject);
    const today = startOfDay(new Date());

    todaySubjects.forEach(subject => {
      if (!existingSubjects.includes(subject)) {
        addTodo.mutate({
          title: `Study ${subject}`,
          subject,
          due_date: today.toISOString(),
          priority: 'medium',
        });
      }
    });
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTodo.mutate({
        title: newTaskTitle,
        priority: 'medium',
      });
      setNewTaskTitle('');
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredAndSortedTodos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderTodos.mutate(items);
  };

  if (isLoading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  const completedCount = todayTasks.filter(t => t.completed).length;
  const totalCount = todayTasks.length;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-4">Tasks</h3>

        {todaySubjects.length > 0 && (
          <Collapsible open={showTodaySection} onOpenChange={setShowTodaySection} className="mb-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
              <span className="font-medium">📅 Today's Study Tasks</span>
              {showTodaySection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <span>{completedCount} of {totalCount} completed</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={autoGenerateTodayTasks}
                  disabled={todaySubjects.every(s => todayTasks.some(t => t.subject === s))}
                >
                  Auto-generate
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Add new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-1"
          />
          <Button onClick={handleAddTask} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 mt-3">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value: any) => setSort(value)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredAndSortedTodos.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No tasks found. Add one above!
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="todos">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {filteredAndSortedTodos.map((todo, index) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <TodoItem
                            todo={todo}
                            onToggle={toggleComplete.mutate}
                            onUpdate={(id, updates) => updateTodo.mutate({ id, updates })}
                            onDelete={deleteTodo.mutate}
                            subjects={subjects}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </Card>
  );
};

export default TodoList;
