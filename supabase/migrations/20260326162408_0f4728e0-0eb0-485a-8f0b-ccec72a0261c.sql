
-- Create priority enum
CREATE TYPE public.priority_level AS ENUM ('high', 'medium', 'low');

-- 1. Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  email text,
  avatar_url text,
  study_hours numeric DEFAULT 0,
  streak integer DEFAULT 0,
  favorite_subjects text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Flashcard Sets
CREATE TABLE public.flashcard_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Flashcards
CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
  front_text text NOT NULL,
  back_text text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Generation History
CREATE TABLE public.generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_text text,
  source_type text NOT NULL DEFAULT 'text',
  source_filename text,
  output_data jsonb,
  card_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 5. Summaries
CREATE TABLE public.summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  original_text text NOT NULL,
  summary_text text NOT NULL,
  summary_type text NOT NULL DEFAULT 'detailed',
  word_count integer,
  compression_ratio numeric,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 6. Documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  extracted_text text,
  text_length integer,
  word_count integer,
  status text DEFAULT 'uploaded',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 7. AI Error Logs
CREATE TABLE public.ai_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_text text,
  error_message text NOT NULL,
  function_name text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 8. Pomodoro Settings
CREATE TABLE public.pomodoro_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  work_duration integer NOT NULL DEFAULT 25,
  short_break_duration integer NOT NULL DEFAULT 5,
  long_break_duration integer NOT NULL DEFAULT 15,
  auto_start_breaks boolean NOT NULL DEFAULT false,
  auto_start_pomodoro boolean NOT NULL DEFAULT false,
  sound_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 9. Pomodoro Sessions
CREATE TABLE public.pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_type text NOT NULL,
  duration integer NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 10. Todos
CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  priority priority_level NOT NULL DEFAULT 'medium',
  due_date timestamptz,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  subject text,
  linked_session_id uuid,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============ RLS ============

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Flashcard sets policies
CREATE POLICY "Users can view own flashcard_sets" ON public.flashcard_sets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own flashcard_sets" ON public.flashcard_sets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own flashcard_sets" ON public.flashcard_sets FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Flashcards policies (via set ownership)
CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT TO authenticated USING (set_id IN (SELECT id FROM public.flashcard_sets WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT TO authenticated WITH CHECK (set_id IN (SELECT id FROM public.flashcard_sets WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE TO authenticated USING (set_id IN (SELECT id FROM public.flashcard_sets WHERE user_id = auth.uid()));

-- Generation history policies
CREATE POLICY "Users can view own generation_history" ON public.generation_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own generation_history" ON public.generation_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own generation_history" ON public.generation_history FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Summaries policies
CREATE POLICY "Users can view own summaries" ON public.summaries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own summaries" ON public.summaries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own summaries" ON public.summaries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own summaries" ON public.summaries FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE TO authenticated USING (user_id = auth.uid());

-- AI error logs policies
CREATE POLICY "Users can insert own ai_error_logs" ON public.ai_error_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Pomodoro settings policies
CREATE POLICY "Users can view own pomodoro_settings" ON public.pomodoro_settings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own pomodoro_settings" ON public.pomodoro_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own pomodoro_settings" ON public.pomodoro_settings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Pomodoro sessions policies
CREATE POLICY "Users can view own pomodoro_sessions" ON public.pomodoro_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own pomodoro_sessions" ON public.pomodoro_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Todos policies
CREATE POLICY "Users can view own todos" ON public.todos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own todos" ON public.todos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ INDEXES ============

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX idx_generation_history_user_id ON public.generation_history(user_id);
CREATE INDEX idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_pomodoro_settings_user_id ON public.pomodoro_settings(user_id);
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_due_date ON public.todos(due_date);
CREATE INDEX idx_todos_completed ON public.todos(completed);

-- ============ TRIGGERS ============

-- Auto-update updated_at for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER pomodoro_settings_updated_at BEFORE UPDATE ON public.pomodoro_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ REALTIME ============

ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_settings;

-- ============ STORAGE ============

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for avatars (public read, authenticated upload)
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- Storage policies for documents (authenticated only)
CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');
