import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, FileText, LogOut, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import InteractiveStat from '@/components/InteractiveStat';
import PerformanceCard from '@/components/PerformanceCard';

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
            <h1 className="text-4xl font-bold text-primary mb-2">Welcome to MENTOR</h1>
            <p className="text-muted-foreground">Your personalized AI mentorship platform</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Interactive Stats Cards */}
        {stats.totalExams > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <InteractiveStat
              title="Total Exams"
              value={stats.totalExams}
              description="Total completed exams"
              drillDownData={recentExams}
              type="total"
            />
            <InteractiveStat
              title="Average Score"
              value={`${stats.avgScore}%`}
              description="Your average performance"
              drillDownData={recentExams}
              type="average"
            />
            <InteractiveStat
              title="Best Score"
              value={`${stats.bestScore}%`}
              description="Your highest achievement"
              drillDownData={recentExams}
              type="best"
            />
          </div>
        )}

        {/* Mentor Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Your Mentors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all hover:-translate-y-1 bg-gradient-to-br from-primary/5 to-primary/10"
              onClick={() => navigate('/mentor/tech')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-primary shadow-glow-primary">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Tech Mentor</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Mock interviews, coding exams, resume analysis, and tech career guidance
                </CardDescription>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all hover:-translate-y-1 bg-gradient-to-br from-secondary/5 to-secondary/10 opacity-60"
              onClick={() => navigate('/mentor/finance')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-secondary shadow-glow-secondary">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Finance Mentor</CardTitle>
                    <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Budget planning, investment tips, financial goal tracking, and money management
                </CardDescription>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all hover:-translate-y-1 bg-gradient-to-br from-accent/5 to-accent/10 opacity-60"
              onClick={() => navigate('/mentor/health')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-accent shadow-glow-accent">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Health Mentor</CardTitle>
                    <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Wellness planning, habit tracking, lifestyle guidance, and health recommendations
                </CardDescription>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all hover:-translate-y-1 bg-gradient-to-br from-muted/5 to-muted/10 opacity-60"
              onClick={() => navigate('/mentor/education')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-subtle shadow-elegant">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Education Mentor</CardTitle>
                    <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Study planning, concept explanations, exam prep, and personalized learning paths
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Card */}
        <div className="mb-12">
          <PerformanceCard stats={stats} recentExams={recentExams} />
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
