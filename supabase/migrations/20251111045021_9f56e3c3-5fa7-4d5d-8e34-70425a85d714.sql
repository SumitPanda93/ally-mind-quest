-- Create user profiles table for storing tech preferences
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  email TEXT,
  technology TEXT,
  experience_level TEXT,
  preferred_difficulty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Create exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  technology TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_limit_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams
CREATE POLICY "Users can view their own exams"
  ON public.exams FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own exams"
  ON public.exams FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own exams"
  ON public.exams FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Admins can view all exams
CREATE POLICY "Admins can view all exams"
  ON public.exams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id::text = auth.uid()::text
      AND profiles.experience_level = 'admin'
    )
  );

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions
CREATE POLICY "Users can view questions for their exams"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = questions.exam_id
      AND exams.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert questions for their exams"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = questions.exam_id
      AND exams.user_id::text = auth.uid()::text
    )
  );

-- Create user answers table
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_answers
CREATE POLICY "Users can view their own answers"
  ON public.user_answers FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own answers"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own answers"
  ON public.user_answers FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Create exam results table
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  unanswered INTEGER DEFAULT 0,
  topic_wise_scores JSONB,
  ai_feedback TEXT,
  improvement_areas JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_results
CREATE POLICY "Users can view their own results"
  ON public.exam_results FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own results"
  ON public.exam_results FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Admins can view all results
CREATE POLICY "Admins can view all results"
  ON public.exam_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id::text = auth.uid()::text
      AND profiles.experience_level = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_exams_user_id ON public.exams(user_id);
CREATE INDEX idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX idx_user_answers_exam_id ON public.user_answers(exam_id);
CREATE INDEX idx_user_answers_user_id ON public.user_answers(user_id);
CREATE INDEX idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX idx_exam_results_user_id ON public.exam_results(user_id);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();