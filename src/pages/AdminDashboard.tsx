import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Users, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [allExams, setAllExams] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalExams: 0, 
    avgScore: 0, 
    topPerformers: [] as any[] 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    loadAdminData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('experience_level')
        .eq('user_id', user.id)
        .single();

      if (profile?.experience_level !== 'admin') {
        toast.error('Access denied. Admin only.');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error:', error);
      navigate('/dashboard');
    }
  };

  const loadAdminData = async () => {
    try {
      // This is a placeholder - in production, you'd need proper admin RLS policies
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          *,
          exam_results (
            total_score,
            correct_answers,
            incorrect_answers
          )
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);

      if (examsError) throw examsError;

      if (examsData) {
        setAllExams(examsData);

        // Calculate stats
        const uniqueUsers = new Set(examsData.map(e => e.user_id));
        const results = examsData
          .map(e => e.exam_results?.[0])
          .filter(r => r);
        
        if (results.length > 0) {
          const avgScore = results.reduce((sum, r) => sum + r.total_score, 0) / results.length;
          
          // Get top performers (simplified - would need proper grouping in production)
          const userScores: { [key: string]: number[] } = {};
          examsData.forEach(exam => {
            if (exam.exam_results?.[0]) {
              if (!userScores[exam.user_id]) {
                userScores[exam.user_id] = [];
              }
              userScores[exam.user_id].push(exam.exam_results[0].total_score);
            }
          });

          const topPerformers = Object.entries(userScores)
            .map(([userId, scores]) => ({
              userId,
              avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
              examsCount: scores.length
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 5);

          setStats({
            totalUsers: uniqueUsers.size,
            totalExams: results.length,
            avgScore: Math.round(avgScore),
            topPerformers
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage platform performance</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Total Users</CardDescription>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Total Exams</CardDescription>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">{stats.totalExams}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Platform Average</CardDescription>
                <Trophy className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">{stats.avgScore}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Top Performers */}
        {stats.topPerformers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Users with highest average scores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Exams Taken</TableHead>
                    <TableHead>Average Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topPerformers.map((performer, idx) => (
                    <TableRow key={performer.userId}>
                      <TableCell className="font-medium">#{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {performer.userId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{performer.examsCount}</TableCell>
                      <TableCell>
                        <Badge variant={performer.avgScore >= 80 ? 'default' : 'secondary'}>
                          {Math.round(performer.avgScore)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Exam Activity</CardTitle>
            <CardDescription>Latest exam submissions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="text-sm">
                      {new Date(exam.completed_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{exam.technology}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{exam.experience_level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{exam.difficulty}</Badge>
                    </TableCell>
                    <TableCell>
                      {exam.exam_results?.[0] && (
                        <Badge 
                          variant={
                            exam.exam_results[0].total_score >= 80 
                              ? 'default' 
                              : exam.exam_results[0].total_score >= 60 
                              ? 'secondary' 
                              : 'destructive'
                          }
                        >
                          {exam.exam_results[0].total_score}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/exam-results/${exam.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
