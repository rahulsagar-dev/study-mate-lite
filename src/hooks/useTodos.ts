import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  subject?: string;
  linked_session_id?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export const useTodos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data as unknown as Todo[]) || [];
    },
    enabled: !!user?.id,
  });

  const addTodo = useMutation({
    mutationFn: async (todo: Partial<Todo>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const insertData: Record<string, unknown> = {
        ...todo,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('todos')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast({ title: 'Task added successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error adding task', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Todo> }) => {
      const { data, error } = await supabase
        .from('todos')
        .update(updates )
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating task', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast({ title: 'Task deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error deleting task', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async (id: string) => {
      const todo = todos.find(t => t.id === id);
      if (!todo) throw new Error('Todo not found');

      const { data, error } = await supabase
        .from('todos')
        .update({
          completed: !todo.completed,
          completed_at: !todo.completed ? new Date().toISOString() : null,
        } )
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const reorderTodos = useMutation({
    mutationFn: async (reorderedTodos: Todo[]) => {
      const updates = reorderedTodos.map((todo, index) => ({
        id: todo.id,
        position: index,
      }));

      const { error } = await supabase
        .from('todos')
        .upsert(updates as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    todos,
    isLoading,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    reorderTodos,
  };
};
