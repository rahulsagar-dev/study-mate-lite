-- Create ai_error_logs table for tracking API errors
CREATE TABLE public.ai_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  input_text TEXT,
  error_message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_error_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own error logs
CREATE POLICY "Users can view their own error logs"
ON public.ai_error_logs
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert error logs (will be done via service role in edge functions)
CREATE POLICY "Service role can insert error logs"
ON public.ai_error_logs
FOR INSERT
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_ai_error_logs_user_id ON public.ai_error_logs(user_id);
CREATE INDEX idx_ai_error_logs_timestamp ON public.ai_error_logs(timestamp DESC);