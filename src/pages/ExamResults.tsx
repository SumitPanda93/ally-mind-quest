import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ResultsChart from '@/components/ResultsChart';
import QuestionCard from '@/components/QuestionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [examId]);

  const loadResults = async () => {
    try {
      // Load exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Load result
      const { data: resultData, error: resultError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', examId)
        .single();

      if (resultError) throw resultError;
      setResult(resultData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number');

      if (questionsError) throw questionsError;
      setQuestions(questionsData);

      // Load user answers
      const { data: answersData, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('exam_id', examId);

      if (answersError) throw answersError;
      setUserAnswers(answersData);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load results');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const };
    return { label: 'Needs Improvement', variant: 'destructive' as const };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading results...</p>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(result.total_score);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">Exam Results</CardTitle>
                <CardDescription>
                  {exam.technology} • {exam.experience_level} • {exam.difficulty}
                </CardDescription>
              </div>
              <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <p className={`text-4xl font-bold ${getScoreColor(result.total_score)}`}>
                  {result.total_score}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">{result.correct_answers}</p>
                <p className="text-sm text-muted-foreground mt-1">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-red-600">{result.incorrect_answers}</p>
                <p className="text-sm text-muted-foreground mt-1">Incorrect</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-600">{result.unanswered}</p>
                <p className="text-sm text-muted-foreground mt-1">Unanswered</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
              <Button onClick={() => navigate('/exam-setup')} className="flex-1">
                Take Another Exam
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <ResultsChart
          correctAnswers={result.correct_answers}
          incorrectAnswers={result.incorrect_answers}
          unanswered={result.unanswered}
          topicWiseScores={result.topic_wise_scores}
        />

        {/* AI Feedback */}
        <Card className="my-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Feedback & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{result.ai_feedback}</p>
            </div>

            {result.improvement_areas && result.improvement_areas.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Focus Areas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.improvement_areas.map((area: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{area.topic}</p>
                      <p className="text-sm text-muted-foreground">
                        Accuracy: {area.accuracy}% ({area.questionsCount} questions)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Review */}
        <Tabs defaultValue="incorrect" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="incorrect">Incorrect ({result.incorrect_answers})</TabsTrigger>
            <TabsTrigger value="correct">Correct ({result.correct_answers})</TabsTrigger>
            <TabsTrigger value="all">All Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="incorrect" className="space-y-4 mt-4">
            {questions.map((q) => {
              const answer = userAnswers.find((a) => a.question_id === q.id);
              if (answer?.is_correct) return null;
              return (
                <QuestionCard
                  key={q.id}
                  questionNumber={q.question_number}
                  questionText={q.question_text}
                  options={{
                    A: q.option_a,
                    B: q.option_b,
                    C: q.option_c,
                    D: q.option_d
                  }}
                  selectedAnswer={answer?.selected_answer}
                  correctAnswer={q.correct_answer}
                  explanation={q.explanation}
                  showResult
                  onAnswerSelect={() => {}}
                />
              );
            })}
          </TabsContent>

          <TabsContent value="correct" className="space-y-4 mt-4">
            {questions.map((q) => {
              const answer = userAnswers.find((a) => a.question_id === q.id);
              if (!answer?.is_correct) return null;
              return (
                <QuestionCard
                  key={q.id}
                  questionNumber={q.question_number}
                  questionText={q.question_text}
                  options={{
                    A: q.option_a,
                    B: q.option_b,
                    C: q.option_c,
                    D: q.option_d
                  }}
                  selectedAnswer={answer?.selected_answer}
                  correctAnswer={q.correct_answer}
                  explanation={q.explanation}
                  showResult
                  onAnswerSelect={() => {}}
                />
              );
            })}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {questions.map((q) => {
              const answer = userAnswers.find((a) => a.question_id === q.id);
              return (
                <QuestionCard
                  key={q.id}
                  questionNumber={q.question_number}
                  questionText={q.question_text}
                  options={{
                    A: q.option_a,
                    B: q.option_b,
                    C: q.option_c,
                    D: q.option_d
                  }}
                  selectedAnswer={answer?.selected_answer}
                  correctAnswer={q.correct_answer}
                  explanation={q.explanation}
                  showResult
                  onAnswerSelect={() => {}}
                />
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExamResults;
