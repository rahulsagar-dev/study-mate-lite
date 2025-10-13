import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Flashcard {
  id: string;
  front_text: string;
  back_text: string;
  position: number;
}

export interface FlashcardSet {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  flashcards: Flashcard[];
}

export interface GenerationHistory {
  id: string;
  input_text?: string | null;
  source_type: 'text' | 'file';
  source_filename?: string | null;
  output_data: any;
  card_count: number;
  created_at: string;
}

export const useFlashcards = () => {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load flashcard sets
  const loadFlashcardSets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: sets, error } = await supabase
        .from('flashcard_sets')
        .select(`
          *,
          flashcards(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlashcardSets(sets || []);
    } catch (error) {
      console.error('Error loading flashcard sets:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcard sets.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create flashcard set
  const createFlashcardSet = async (title: string, flashcards: Omit<Flashcard, 'id' | 'position'>[], description?: string) => {
    if (!user) return null;

    try {
      // Create the set
      const { data: newSet, error: setError } = await supabase
        .from('flashcard_sets')
        .insert({
          user_id: user.id,
          title,
          description
        })
        .select()
        .single();

      if (setError) throw setError;

      // Create flashcards
      const flashcardData = flashcards.map((card, index) => ({
        set_id: newSet.id,
        front_text: card.front_text,
        back_text: card.back_text,
        position: index
      }));

      const { data: newFlashcards, error: cardsError } = await supabase
        .from('flashcards')
        .insert(flashcardData)
        .select();

      if (cardsError) throw cardsError;

      const completeSet: FlashcardSet = {
        ...newSet,
        flashcards: newFlashcards || []
      };

      setFlashcardSets(prev => [completeSet, ...prev]);
      
      toast({
        title: "Success",
        description: `Created "${title}" with ${flashcards.length} cards.`
      });

      return completeSet;
    } catch (error) {
      console.error('Error creating flashcard set:', error);
      toast({
        title: "Error",
        description: "Failed to create flashcard set.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Delete flashcard set
  const deleteFlashcardSet = async (setId: string) => {
    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .delete()
        .eq('id', setId);

      if (error) throw error;

      setFlashcardSets(prev => prev.filter(set => set.id !== setId));
      
      toast({
        title: "Success",
        description: "Flashcard set deleted."
      });
    } catch (error) {
      console.error('Error deleting flashcard set:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard set.",
        variant: "destructive"
      });
    }
  };

  // Save generation history
  const saveGenerationHistory = async (history: Omit<GenerationHistory, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('generation_history')
        .insert({
          user_id: user.id,
          ...history
        })
        .select()
        .single();

      if (error) throw error;

      setGenerationHistory(prev => [{
        ...data,
        source_type: data.source_type as 'text' | 'file'
      }, ...prev]);
    } catch (error) {
      console.error('Error saving generation history:', error);
    }
  };

  // Load generation history
  const loadGenerationHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('generation_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGenerationHistory(data?.map(item => ({
        ...item,
        source_type: item.source_type as 'text' | 'file'
      })) || []);
    } catch (error) {
      console.error('Error loading generation history:', error);
    }
  };

  // Delete generation history
  const deleteGenerationHistory = async (historyId: string) => {
    try {
      const { error } = await supabase
        .from('generation_history')
        .delete()
        .eq('id', historyId);

      if (error) throw error;

      setGenerationHistory(prev => prev.filter(h => h.id !== historyId));
      
      toast({
        title: "Success",
        description: "History entry deleted."
      });
    } catch (error) {
      console.error('Error deleting generation history:', error);
      toast({
        title: "Error",
        description: "Failed to delete history entry.",
        variant: "destructive"
      });
    }
  };

  // Load data on user change
  useEffect(() => {
    if (user) {
      loadFlashcardSets();
      loadGenerationHistory();
    } else {
      setFlashcardSets([]);
      setGenerationHistory([]);
    }
  }, [user]);

  return {
    flashcardSets,
    loading,
    generationHistory,
    createFlashcardSet,
    deleteFlashcardSet,
    saveGenerationHistory,
    deleteGenerationHistory,
    loadFlashcardSets,
    loadGenerationHistory
  };
};