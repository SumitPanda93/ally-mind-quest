import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, FileText, BarChart3, LogOut, BookOpen, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalExams: 0, avgScore: 0, bestScore: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load recent exams
      const { data: examsData } = await supabase
        .from('exams')
        .select(`
          *,
          exam_results (
            total_score,
            correct_answers,
            incorrect_answers
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      if (examsData) {
        setRecentExams(examsData);

        // Calculate stats
        const results = examsData
          .map(e => e.exam_results?.[0])
          .filter(r => r);
        
        if (results.length > 0) {
          const avgScore = results.reduce((sum, r) => sum + r.total_score, 0) / results.length;
          const bestScore = Math.max(...results.map(r => r.total_score));
          setStats({
            totalExams: results.length,
            avgScore: Math.round(avgScore),
            bestScore: Math.round(bestScore)
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Welcome to TechMock Mentor</h1>
            <p className="text-muted-foreground">Your AI-powered interview coach</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        {stats.totalExams > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Exams</CardDescription>
                <CardTitle className="text-3xl">{stats.totalExams}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl">{stats.avgScore}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Best Score</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  {stats.bestScore}%
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/exam-setup')}>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>MCQ Mock Exam</CardTitle>
              <CardDescription>
                AI-generated multiple choice questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Exam</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/interview')}>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Mock Interview</CardTitle>
              <CardDescription>
                Practice with AI interview simulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">Start Interview</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/resume')}>
            <CardHeader>
              <FileText className="h-10 w-10 text-secondary mb-2" />
              <CardTitle>Resume Analyzer</CardTitle>
              <CardDescription>
                Get AI feedback on your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">Analyze Resume</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-accent mb-2" />
              <CardTitle>Performance</CardTitle>
              <CardDescription>
                Track your progress over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View stats above</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Exams */}
        {recentExams.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Exams</CardTitle>
              <CardDescription>Your latest exam attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                    onClick={() => navigate(`/exam-results/${exam.id}`)}
                  >
                    <div>
                      <p className="font-medium">{exam.technology}</p>
                      <p className="text-sm text-muted-foreground">
                        {exam.experience_level} • {exam.difficulty} • {new Date(exam.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    {exam.exam_results?.[0] && (
                      <Badge variant={exam.exam_results[0].total_score >= 80 ? 'default' : exam.exam_results[0].total_score >= 60 ? 'secondary' : 'destructive'}>
                        {exam.exam_results[0].total_score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
