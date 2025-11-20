-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create visitor_sessions table for real-time tracking
CREATE TABLE public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page TEXT NOT NULL,
  mentor_category TEXT,
  last_ping TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_visitor_sessions_last_ping ON public.visitor_sessions(last_ping);
CREATE INDEX idx_visitor_sessions_session_id ON public.visitor_sessions(session_id);

-- RLS: Only admins can view sessions
CREATE POLICY "Admins can view all sessions"
ON public.visitor_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create daily_footfall table
CREATE TABLE public.daily_footfall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  unique_visitors_count INTEGER NOT NULL DEFAULT 0,
  total_page_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_footfall ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can view footfall
CREATE POLICY "Admins can view daily footfall"
ON public.daily_footfall
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create mentor_footfall table
CREATE TABLE public.mentor_footfall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  mentor_category TEXT NOT NULL,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (date, mentor_category)
);

-- Enable RLS
ALTER TABLE public.mentor_footfall ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can view mentor footfall
CREATE POLICY "Admins can view mentor footfall"
ON public.mentor_footfall
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create page_visits table
CREATE TABLE public.page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_page_visits_visited_at ON public.page_visits(visited_at);
CREATE INDEX idx_page_visits_page ON public.page_visits(page);

-- RLS: Only admins can view page visits
CREATE POLICY "Admins can view page visits"
ON public.page_visits
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create lifetime_visitors table
CREATE TABLE public.lifetime_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_unique_visitors INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lifetime_visitors ENABLE ROW LEVEL SECURITY;

-- Insert initial row
INSERT INTO public.lifetime_visitors (total_unique_visitors) VALUES (0);

-- RLS: Only admins can view lifetime visitors
CREATE POLICY "Admins can view lifetime visitors"
ON public.lifetime_visitors
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on daily_footfall
CREATE TRIGGER update_daily_footfall_updated_at
BEFORE UPDATE ON public.daily_footfall
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to cleanup old sessions (older than 5 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.visitor_sessions
  WHERE last_ping < now() - interval '5 minutes';
END;
$$;