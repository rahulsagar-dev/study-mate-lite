-- Enable real-time updates for pomodoro_settings table
ALTER TABLE public.pomodoro_settings REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_settings;