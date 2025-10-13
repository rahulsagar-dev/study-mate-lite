import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Summary {
  id: string;
  title: string;
  original_text: string;
  summary_text: string;
  summary_type: 'assignment' | 'detailed' | 'bullet';
  word_count?: number;
  compression_ratio?: number;
  created_at: string;
}

export const useSummaries = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load summaries
  const loadSummaries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSummaries(data?.map(item => ({
        ...item,
        summary_type: item.summary_type as 'assignment' | 'detailed' | 'bullet'
      })) || []);
    } catch (error) {
      console.error('Error loading summaries:', error);
      toast({
        title: "Error",
        description: "Failed to load summaries.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create summary
  const createSummary = async (summaryData: Omit<Summary, 'id' | 'created_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('summaries')
        .insert({
          user_id: user.id,
          ...summaryData
        })
        .select()
        .single();

      if (error) throw error;

      setSummaries(prev => [{
        ...data,
        summary_type: data.summary_type as 'assignment' | 'detailed' | 'bullet'
      }, ...prev]);
      
      toast({
        title: "Success",
        description: "Summary saved successfully."
      });

      return data;
    } catch (error) {
      console.error('Error creating summary:', error);
      toast({
        title: "Error",
        description: "Failed to save summary.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Delete summary
  const deleteSummary = async (summaryId: string) => {
    try {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', summaryId);

      if (error) throw error;

      setSummaries(prev => prev.filter(summary => summary.id !== summaryId));
      
      toast({
        title: "Success",
        description: "Summary deleted."
      });
    } catch (error) {
      console.error('Error deleting summary:', error);
      toast({
        title: "Error",
        description: "Failed to delete summary.",
        variant: "destructive"
      });
    }
  };

  // Update summary
  const updateSummary = async (summaryId: string, updates: Partial<Omit<Summary, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('summaries')
        .update(updates)
        .eq('id', summaryId)
        .select()
        .single();

      if (error) throw error;

      setSummaries(prev => prev.map(summary => 
        summary.id === summaryId ? {
          ...data,
          summary_type: data.summary_type as 'assignment' | 'detailed' | 'bullet'
        } : summary
      ));
      
      toast({
        title: "Success",
        description: "Summary updated."
      });

      return data;
    } catch (error) {
      console.error('Error updating summary:', error);
      toast({
        title: "Error",
        description: "Failed to update summary.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Load data on user change
  useEffect(() => {
    if (user) {
      loadSummaries();
    } else {
      setSummaries([]);
    }
  }, [user]);

  return {
    summaries,
    loading,
    createSummary,
    deleteSummary,
    updateSummary,
    loadSummaries
  };
};