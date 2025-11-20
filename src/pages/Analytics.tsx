import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, TrendingUp, Activity, BarChart3, Eye, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface DailyFootfall {
  date: string;
  unique_visitors_count: number;
  total_page_views: number;
}

interface MentorFootfall {
  mentor_category: string;
  unique_visitors: number;
  total_visits: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [dailyFootfall, setDailyFootfall] = useState<DailyFootfall[]>([]);
  const [mentorFootfall, setMentorFootfall] = useState<MentorFootfall[]>([]);
  const [lifetimeVisitors, setLifetimeVisitors] = useState(0);
  const [todayStats, setTodayStats] = useState<DailyFootfall | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please log in to access analytics.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view analytics.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      loadAnalytics();
    } catch (error) {
      console.error('Admin check error:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Get active visitors (sessions with last_ping within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: activeCount } = await supabase
        .from('visitor_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_ping', fiveMinutesAgo);

      setActiveVisitors(activeCount || 0);

      // Get daily footfall (last 7 days)
      const { data: dailyData } = await supabase
        .from('daily_footfall')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (dailyData) {
        setDailyFootfall(dailyData);
        setTodayStats(dailyData[0] || null);
      }

      // Get mentor footfall for today
      const today = new Date().toISOString().split('T')[0];
      const { data: mentorData } = await supabase
        .from('mentor_footfall')
        .select('*')
        .eq('date', today);

      if (mentorData) {
        setMentorFootfall(mentorData);
      }

      // Get lifetime visitors
      const { data: lifetimeData } = await supabase
        .from('lifetime_visitors')
        .select('total_unique_visitors')
        .single();

      if (lifetimeData) {
        setLifetimeVisitors(lifetimeData.total_unique_visitors);
      }

      // Set up real-time subscription for active visitors
      const channel = supabase
        .channel('analytics-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'visitor_sessions'
          },
          async () => {
            // Refresh active count
            const { count } = await supabase
              .from('visitor_sessions')
              .select('*', { count: 'exact', head: true })
              .gte('last_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString());
            
            setActiveVisitors(count || 0);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    }
  };

  const getMentorIcon = (category: string) => {
    switch (category) {
      case 'tech': return '💻';
      case 'finance': return '💰';
      case 'health': return '🏃';
      case 'education': return '📚';
      default: return '📊';
    }
  };

  const getMentorColor = (category: string) => {
    switch (category) {
      case 'tech': return 'bg-primary/10 text-primary';
      case 'finance': return 'bg-secondary/10 text-secondary';
      case 'health': return 'bg-accent/10 text-accent';
      case 'education': return 'bg-muted text-foreground';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const yesterdayStats = dailyFootfall[1] || null;
  const visitorChange = todayStats && yesterdayStats 
    ? ((todayStats.unique_visitors_count - yesterdayStats.unique_visitors_count) / yesterdayStats.unique_visitors_count * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Platform Analytics
          </h1>
          <p className="text-muted-foreground mt-2">Real-time visitor insights and platform metrics</p>
        </div>

        {/* Real-Time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="animate-pulse-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Live Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{activeVisitors}</div>
              <p className="text-xs text-muted-foreground mt-1">Active in last 5 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Today's Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayStats?.unique_visitors_count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {Number(visitorChange) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                )}
                {visitorChange}% vs yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-secondary" />
                Page Views Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayStats?.total_page_views || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Lifetime Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{lifetimeVisitors}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time unique</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Trends</TabsTrigger>
            <TabsTrigger value="mentors">Mentor Distribution</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Last 7 Days</CardTitle>
                <CardDescription>Daily unique visitors and page views</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyFootfall.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="text-sm text-muted-foreground">{day.total_page_views} page views</p>
                      </div>
                      <Badge variant="secondary" className="text-lg">
                        {day.unique_visitors_count} visitors
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mentor Category Performance</CardTitle>
                <CardDescription>Today's distribution across mentor categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentorFootfall.length === 0 ? (
                    <p className="text-muted-foreground col-span-2 text-center py-8">
                      No mentor visits recorded today
                    </p>
                  ) : (
                    mentorFootfall.map((mentor, idx) => (
                      <Card key={idx} className={getMentorColor(mentor.mentor_category)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">{getMentorIcon(mentor.mentor_category)}</span>
                            {mentor.mentor_category.charAt(0).toUpperCase() + mentor.mentor_category.slice(1)} Mentor
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">{mentor.unique_visitors}</p>
                              <p className="text-xs text-muted-foreground">Unique visitors</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">{mentor.total_visits}</p>
                              <p className="text-xs text-muted-foreground">Total visits</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Platform performance summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Average Daily Visitors</h4>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {dailyFootfall.length > 0 
                          ? Math.round(dailyFootfall.reduce((sum, day) => sum + day.unique_visitors_count, 0) / dailyFootfall.length)
                          : 0}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Based on last 7 days</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-secondary/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-secondary mt-1" />
                    <div>
                      <h4 className="font-semibold">Most Popular Mentor</h4>
                      <p className="text-2xl font-bold text-secondary mt-1">
                        {mentorFootfall.length > 0
                          ? mentorFootfall.reduce((prev, current) => 
                              prev.unique_visitors > current.unique_visitors ? prev : current
                            ).mentor_category.charAt(0).toUpperCase() + 
                            mentorFootfall.reduce((prev, current) => 
                              prev.unique_visitors > current.unique_visitors ? prev : current
                            ).mentor_category.slice(1)
                          : 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Most visited today</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-accent/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <h4 className="font-semibold">Engagement Rate</h4>
                      <p className="text-2xl font-bold text-accent mt-1">
                        {todayStats && todayStats.unique_visitors_count > 0
                          ? (todayStats.total_page_views / todayStats.unique_visitors_count).toFixed(1)
                          : '0'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Pages per visitor today</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
