import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TodoItem } from './TodoItem';
import { useTodos, type Todo, type PriorityLevel } from '@/hooks/useTodos';
import { isToday, isThisWeek, startOfDay, isSameDay } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TodoListProps {
  todaySubjects?: string[];
  subjects: string[];
}

type FilterType = 'all' | 'active' | 'completed' | 'today' | 'week';
type SortType = 'priority' | 'due_date' | 'created';

const priorityOrder = { high: 0, medium: 1, low: 2 };

export const TodoList = ({ todaySubjects = [], subjects }: TodoListProps) => {
  const { todos, isLoading, addTodo, updateTodo, deleteTodo, toggleComplete, reorderTodos } = useTodos();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('priority');
  const [showTodaySection, setShowTodaySection] = useState(true);

  const filteredAndSortedTodos = useMemo(() => {
    let filtered = [...todos];

    // Apply filters
    switch (filter) {
      case 'active':
        filtered = filtered.filter(t => !t.completed);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
      case 'today':
        filtered = filtered.filter(t => 
          t.due_date && isToday(new Date(t.due_date))
        );
        break;
      case 'week':
        filtered = filtered.filter(t => 
          t.due_date && isThisWeek(new Date(t.due_date))
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'priority':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'due_date':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [todos, filter, sort]);

  const todayTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return todos.filter(t => 
      (t.due_date && isSameDay(new Date(t.due_date), today)) ||
      (t.subject && todaySubjects.includes(t.subject))
    );
  }, [todos, todaySubjects]);

  const autoGenerateTodayTasks = () => {
    const existingSubjects = new Set(todayTasks.map(t => t.subject).filter(Boolean));
    const missingSubjects = todaySubjects.filter(s => !existingSubjects.has(s));

    missingSubjects.forEach(subject => {
      addTodo.mutate({
        title: `Study ${subject}`,
        subject,
        priority: 'medium',
        due_date: new Date().toISOString(),
        position: todos.length,
      });
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    addTodo.mutate({
      title: newTaskTitle,
      priority: 'medium',
      position: todos.length,
    });
    setNewTaskTitle('');
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(filteredAndSortedTodos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderTodos.mutate(items);
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  if (isLoading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold mb-2">My Tasks</h2>
        <p className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} completed
        </p>
      </div>

      {/* Today's Tasks Section */}
      {todaySubjects.length > 0 && (
        <Collapsible open={showTodaySection} onOpenChange={setShowTodaySection} className="border-b">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <span className="text-lg font-semibold">📅 Today's Study Tasks</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${showTodaySection ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 space-y-2">
            {todayTasks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">No tasks for today's subjects yet</p>
                <Button onClick={autoGenerateTodayTasks} size="sm">
                  Auto-generate tasks
                </Button>
              </div>
            ) : (
              todayTasks.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleComplete.mutate(todo.id)}
                  onUpdate={(updates) => updateTodo.mutate({ id: todo.id, updates })}
                  onDelete={() => deleteTodo.mutate(todo.id)}
                  subjects={subjects}
                />
              ))
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Add Task */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <Button onClick={handleAddTask} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="p-4 border-b flex gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="due_date">Due Date</SelectItem>
            <SelectItem value="created">Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4">
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
                          onToggle={() => toggleComplete.mutate(todo.id)}
                          onUpdate={(updates) => updateTodo.mutate({ id: todo.id, updates })}
                          onDelete={() => deleteTodo.mutate(todo.id)}
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

        {filteredAndSortedTodos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No tasks found. Add your first task above!
          </div>
        )}
      </div>
    </div>
  );
};
