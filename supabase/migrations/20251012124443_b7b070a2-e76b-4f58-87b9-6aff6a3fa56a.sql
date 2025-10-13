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

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatar uploads
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);