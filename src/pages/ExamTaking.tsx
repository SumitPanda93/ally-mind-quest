import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ExamTimer from '@/components/ExamTimer';
import QuestionCard from '@/components/QuestionCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  topic: string;
}

const ExamTaking = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) {
        toast.error('Exam not found or you do not have access');
        navigate('/dashboard');
        return;
      }
      
      setExam(examData);

      // Use questions_without_answers view
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions_without_answers' as any)
        .select('*')
        .eq('exam_id', examId)
        .order('question_number');

      if (questionsError) {
        toast.error('Failed to load questions');
        navigate('/dashboard');
        return;
      }

      if (!questionsData || questionsData.length === 0) {
        toast.error('No questions found for this exam');
        navigate('/dashboard');
        return;
      }

      setQuestions((questionsData as any) as Question[]);
    } catch (error: any) {
      console.error('Error loading exam:', error);
      toast.error(error.message || 'Failed to load exam');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestionIndex].id]: answer
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowSubmitDialog(false);

    try {
      // Show progress toast
      toast.loading('Saving your answers...', { id: 'exam-submit' });

      // Save all answers WITHOUT calculating is_correct on client side
      const answersToSave = Object.entries(answers).map(([questionId, answer]) => {
        return {
          exam_id: examId,
          question_id: questionId,
          user_id: exam.user_id,
          selected_answer: answer,
          is_correct: null,
          time_spent_seconds: 0
        };
      });

      const { error: answersError } = await supabase
        .from('user_answers')
        .insert(answersToSave);

      if (answersError) throw answersError;

      toast.loading('Evaluating your exam...', { id: 'exam-submit' });

      // Evaluate exam - this will process in background
      const { error: evaluateError } = await supabase.functions.invoke('evaluate-exam', {
        body: { examId }
      });

      if (evaluateError) {
        toast.error('Evaluation started but may take longer than expected. Check your results page.', { id: 'exam-submit' });
        navigate(`/exam-results/${examId}`);
        return;
      }

      toast.success('Exam submitted! Generating detailed feedback...', { id: 'exam-submit' });
      navigate(`/exam-results/${examId}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to submit exam', { id: 'exam-submit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    toast.warning('Time is up! Submitting your exam...');
    handleSubmit();
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading exam...</p>
    </div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((Object.keys(answers).length / questions.length) * 100);
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{exam.technology} Exam</h1>
                <p className="text-sm text-muted-foreground">
                  {exam.experience_level} • {exam.difficulty}
                </p>
              </div>
            </div>
            <ExamTimer timeLimitMinutes={exam.time_limit_minutes} onTimeUp={handleTimeUp} />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <QuestionCard
          questionNumber={currentQuestion.question_number}
          questionText={currentQuestion.question_text}
          options={{
            A: currentQuestion.option_a,
            B: currentQuestion.option_b,
            C: currentQuestion.option_c,
            D: currentQuestion.option_d
          }}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswerSelect={handleAnswerSelect}
        />

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={() => setShowSubmitDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Exam
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-3">Quick Navigation</p>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[q.id]
                    ? 'bg-green-500 text-white'
                    : 'bg-background border-2'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-destructive">
                  {questions.length - answeredCount} questions are unanswered.
                </span>
              )}
              Are you sure you want to submit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExamTaking;
