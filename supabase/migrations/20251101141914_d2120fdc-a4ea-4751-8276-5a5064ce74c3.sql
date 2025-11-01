-- Create session_type enum
CREATE TYPE session_type AS ENUM ('work', 'short_break', 'long_break');

-- Create pomodoro_settings table
CREATE TABLE public.pomodoro_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  work_duration INTEGER NOT NULL DEFAULT 25,
  short_break_duration INTEGER NOT NULL DEFAULT 5,
  long_break_duration INTEGER NOT NULL DEFAULT 15,
  auto_start_breaks BOOLEAN DEFAULT false,
  auto_start_pomodoros BOOLEAN DEFAULT false,
  sound_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pomodoro_sessions table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type session_type NOT NULL,
  subject TEXT,
  work_duration INTEGER NOT NULL,
  break_duration INTEGER,
  completed_sessions INTEGER NOT NULL DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add pomodoro stats columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_pomodoro_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_focus_hours NUMERIC DEFAULT 0;

-- Enable RLS on pomodoro_settings
ALTER TABLE public.pomodoro_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for pomodoro_settings
CREATE POLICY "Users can view their own settings"
ON public.pomodoro_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.pomodoro_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.pomodoro_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Enable RLS on pomodoro_sessions
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for pomodoro_sessions
CREATE POLICY "Users can view their own sessions"
ON public.pomodoro_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.pomodoro_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.pomodoro_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.pomodoro_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_pomodoro_settings_user_id ON public.pomodoro_settings(user_id);
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_date ON public.pomodoro_sessions(date DESC);

-- Create function to update pomodoro stats
CREATE OR REPLACE FUNCTION public.update_pomodoro_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if session is completed (has end_time)
  IF NEW.end_time IS NOT NULL AND NEW.session_type = 'work' THEN
    UPDATE public.profiles
    SET 
      total_pomodoro_sessions = COALESCE(total_pomodoro_sessions, 0) + 1,
      total_focus_hours = COALESCE(total_focus_hours, 0) + (NEW.work_duration::NUMERIC / 60),
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update stats
CREATE TRIGGER update_pomodoro_stats_trigger
AFTER INSERT OR UPDATE ON public.pomodoro_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_pomodoro_stats();

-- Create trigger for updated_at on pomodoro_settings
CREATE TRIGGER update_pomodoro_settings_updated_at
BEFORE UPDATE ON public.pomodoro_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();