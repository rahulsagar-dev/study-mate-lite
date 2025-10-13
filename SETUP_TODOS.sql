-- ========================================
-- To-Do List Setup Instructions
-- ========================================
-- 
-- IMPORTANT: Run this SQL in your Lovable Cloud dashboard:
-- 1. Go to your project
-- 2. Click on "Cloud" tab
-- 3. Click on "Database" 
-- 4. Click on "SQL Editor"
-- 5. Copy and paste this entire file
-- 6. Click "Run"
-- ========================================

-- Create priority enum
CREATE TYPE IF NOT EXISTS public.priority_level AS ENUM ('high', 'medium', 'low');

-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can insert their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;

-- RLS Policies
CREATE POLICY "Users can view their own todos"
  ON public.todos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own todos"
  ON public.todos
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own todos"
  ON public.todos
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own todos"
  ON public.todos
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_todos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS todos_updated_at ON public.todos;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_todos_updated_at();

-- ========================================
-- Setup Complete! 
-- ========================================
-- You can now use the To-Do List feature.
-- Refresh your app to see the changes.
-- ========================================
