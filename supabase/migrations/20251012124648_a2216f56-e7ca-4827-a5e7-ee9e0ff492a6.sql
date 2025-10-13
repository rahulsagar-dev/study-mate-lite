-- Add new columns to profiles table for tracking user stats and preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_study_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS study_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favorite_subjects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to set joined_date to created_at if null
UPDATE public.profiles
SET joined_date = created_at
WHERE joined_date IS NULL;