-- Create flashcard_sets table
CREATE TABLE public.flashcard_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create generation_history table
CREATE TABLE public.generation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT,
  source_type TEXT CHECK (source_type IN ('text', 'file')),
  source_filename TEXT,
  output_data JSONB NOT NULL,
  card_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create summaries table
CREATE TABLE public.summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_text TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('assignment', 'detailed', 'bullet')),
  word_count INTEGER,
  compression_ratio DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flashcard_sets
CREATE POLICY "Users can view their own flashcard sets" 
ON public.flashcard_sets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcard sets" 
ON public.flashcard_sets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard sets" 
ON public.flashcard_sets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcard sets" 
ON public.flashcard_sets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for flashcards
CREATE POLICY "Users can view flashcards from their sets" 
ON public.flashcards 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.flashcard_sets 
  WHERE flashcard_sets.id = flashcards.set_id 
  AND flashcard_sets.user_id = auth.uid()
));

CREATE POLICY "Users can create flashcards in their sets" 
ON public.flashcards 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.flashcard_sets 
  WHERE flashcard_sets.id = flashcards.set_id 
  AND flashcard_sets.user_id = auth.uid()
));

CREATE POLICY "Users can update flashcards in their sets" 
ON public.flashcards 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.flashcard_sets 
  WHERE flashcard_sets.id = flashcards.set_id 
  AND flashcard_sets.user_id = auth.uid()
));

CREATE POLICY "Users can delete flashcards from their sets" 
ON public.flashcards 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.flashcard_sets 
  WHERE flashcard_sets.id = flashcards.set_id 
  AND flashcard_sets.user_id = auth.uid()
));

-- Create RLS policies for generation_history
CREATE POLICY "Users can view their own generation history" 
ON public.generation_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation history" 
ON public.generation_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generation history" 
ON public.generation_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for summaries
CREATE POLICY "Users can view their own summaries" 
ON public.summaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries" 
ON public.summaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" 
ON public.summaries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" 
ON public.summaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX idx_generation_history_user_id ON public.generation_history(user_id);
CREATE INDEX idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);

-- Add triggers for timestamp updates
CREATE TRIGGER update_flashcard_sets_updated_at
BEFORE UPDATE ON public.flashcard_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at
BEFORE UPDATE ON public.summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();