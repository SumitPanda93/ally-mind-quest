import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Users, BookOpen, TrendingUp, Award, Settings, 
  FileText, Mic, AlertCircle, Activity, Shield, Database,
  Download, Eye, Edit, Trash2, Plus, Search, Filter
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  technology: string;
  difficulty: string;
  topic: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Overview stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExams: 0,
    avgScore: 0,
    activeVisitors: 0,
    todayVisitors: 0
  });
  
  // User Management
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  
  // Mock Exam Management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examFilter, setExamFilter] = useState("");
  
  // Recent Activity
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please log in to access the admin panel.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Check if user has admin role using RLS-safe query
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (error || !roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      loadAdminData();
    } catch (error) {
      console.error('Admin check error:', error);
      navigate('/dashboard');
    }
  };

  const loadAdminData = async () => {
    try {
      // Get total users count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active visitors (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: activeCount } = await supabase
        .from('visitor_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_ping', fiveMinutesAgo);

      // Get today's visitors
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase
        .from('daily_footfall')
        .select('unique_visitors_count')
        .eq('date', today)
        .single();

      // Get completed exams with results
      const { data: examsData, count: examCount } = await supabase
        .from('exams')
        .select(`
          id,
          technology,
          difficulty,
          completed_at,
          exam_results (
            total_score,
            correct_answers,
            incorrect_answers
          )
        `, { count: 'exact' })
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      // Calculate average score
      let avgScore = 0;
      if (examsData && examsData.length > 0) {
        const scores = examsData
          .map(e => e.exam_results?.[0]?.total_score)
          .filter(s => s !== undefined);
        
        if (scores.length > 0) {
          avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
      }

      // Get top performers - simplified without join
      const { data: topPerformersData } = await supabase
        .from('exam_results')
        .select('user_id, total_score')
        .order('total_score', { ascending: false })
        .limit(10);

      // Group by user and calculate average
      const userScores = new Map();
      topPerformersData?.forEach(result => {
        const userId = result.user_id;
        if (!userScores.has(userId)) {
          userScores.set(userId, {
            userId: userId,
            scores: []
          });
        }
        userScores.get(userId).scores.push(result.total_score);
      });

      const topPerformers = Array.from(userScores.values())
        .map(user => ({
          userId: user.userId,
          avgScore: user.scores.reduce((a: number, b: number) => a + b, 0) / user.scores.length,
          examCount: user.scores.length
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      setStats({
        totalUsers: userCount || 0,
        totalExams: examCount || 0,
        avgScore: Math.round(avgScore),
        activeVisitors: activeCount || 0,
        todayVisitors: todayData?.unique_visitors_count || 0
      });

      setRecentExams(examsData || []);
      setTopPerformers(topPerformers);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersData = data?.map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        created_at: profile.created_at || ''
      })) || [];

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          topic,
          exam_id
        `)
        .limit(100);

      if (error) throw error;

      // Get exam details for each question
      const examIds = [...new Set(data?.map(q => q.exam_id))];
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, technology, difficulty')
        .in('id', examIds);

      const examMap = new Map(examsData?.map(e => [e.id, e]));

      const questionsData = data?.map(q => {
        const exam = examMap.get(q.exam_id);
        return {
          id: q.id,
          question_text: q.question_text,
          technology: exam?.technology || 'Unknown',
          difficulty: exam?.difficulty || 'Unknown',
          topic: q.topic || 'General'
        };
      }) || [];

      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      loadUsers();
    } else if (activeTab === "exams" && questions.length === 0) {
      loadQuestions();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading admin dashboard...</div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredQuestions = questions.filter(q => 
    examFilter === "" || q.technology.toLowerCase().includes(examFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Admin Control Panel
              </h1>
            </div>
            <p className="text-muted-foreground">Comprehensive platform management & monitoring</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Live Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.activeVisitors}</div>
              <p className="text-xs text-muted-foreground mt-1">Active now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                Today's Traffic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.todayVisitors}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique visitors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" />
                Total Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalExams}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed tests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">Platform average</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="exams">Mock Exams</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Highest average scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No data available</p>
                    ) : (
                      topPerformers.map((performer, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">User {performer.userId.substring(0, 8)}...</p>
                            <p className="text-sm text-muted-foreground">{performer.examCount} exams</p>
                          </div>
                          <Badge variant={performer.avgScore >= 80 ? 'default' : 'secondary'}>
                            {Math.round(performer.avgScore)}%
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Exam Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Recent Exam Activity
                  </CardTitle>
                  <CardDescription>Latest completed exams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentExams.slice(0, 5).map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{exam.technology}</p>
                          <p className="text-sm text-muted-foreground">
                            {exam.difficulty} • {new Date(exam.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        {exam.exam_results?.[0] && (
                          <Badge variant={exam.exam_results[0].total_score >= 60 ? 'default' : 'destructive'}>
                            {exam.exam_results[0].total_score}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" onClick={() => navigate('/analytics')} className="h-20 flex flex-col gap-2">
                  <Activity className="h-5 w-5" />
                  View Analytics
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('users')} className="h-20 flex flex-col gap-2">
                  <Users className="h-5 w-5" />
                  Manage Users
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('exams')} className="h-20 flex flex-col gap-2">
                  <BookOpen className="h-5 w-5" />
                  Manage Exams
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('config')} className="h-20 flex flex-col gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>View and manage registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mentor Management Tab */}
          <TabsContent value="mentors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Mentor Module Management
                </CardTitle>
                <CardDescription>Configure and manage mentor categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Tech Mentor', 'Finance Mentor', 'Health Mentor', 'Education Mentor'].map((mentor) => (
                    <Card key={mentor}>
                      <CardHeader>
                        <CardTitle className="text-lg">{mentor}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Status</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mock Exam Management Tab */}
          <TabsContent value="exams" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Mock Exam Question Bank
                    </CardTitle>
                    <CardDescription>Manage exam questions and content</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Question</DialogTitle>
                        <DialogDescription>Create a new exam question</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Technology</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select technology" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="java">Java</SelectItem>
                              <SelectItem value="react">React</SelectItem>
                              <SelectItem value="azure">Azure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Difficulty</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Question Text</Label>
                          <Textarea placeholder="Enter question..." rows={4} />
                        </div>
                        <Button className="w-full">Create Question</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Filter by technology..."
                        value={examFilter}
                        onChange={(e) => setExamFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Technology</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuestions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No questions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredQuestions.slice(0, 20).map((question) => (
                          <TableRow key={question.id}>
                            <TableCell className="max-w-md truncate">{question.question_text}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{question.technology}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{question.difficulty}</Badge>
                            </TableCell>
                            <TableCell>{question.topic}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Platform Analytics
                </CardTitle>
                <CardDescription>Comprehensive analytics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">View detailed platform analytics</p>
                  <Button onClick={() => navigate('/analytics')}>
                    Open Full Analytics Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  System Logs & Errors
                </CardTitle>
                <CardDescription>Monitor system errors and activity logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4" />
                  <p>System logging and error tracking</p>
                  <p className="text-sm mt-2">Coming soon: Real-time error monitoring and activity logs</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>Manage global platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Platform Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>App Name</Label>
                        <Input defaultValue="MENTOR" />
                      </div>
                      <div>
                        <Label>Tagline</Label>
                        <Input defaultValue="One Stop. All Growth. AI Driven." />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">Feature Toggles</h3>
                    <div className="space-y-3">
                      {['Mock Exams', 'Voice Interviews', 'Resume Analyzer', 'Coding Playground'].map((feature) => (
                        <div key={feature} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span>{feature}</span>
                          <Badge variant="default">Enabled</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
