import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, FileText, BarChart3, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-interview.jpg';
import mentorIcon from '@/assets/mentor-icon.png';

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="relative container mx-auto px-4 py-24 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-white">
            <div className="flex items-center gap-3 mb-6">
              <img src={mentorIcon} alt="Mentor" className="h-12 w-12" />
              <h1 className="text-5xl font-bold">TechMock Mentor</h1>
            </div>
            <p className="text-xl mb-8 text-white/90">
              Your AI-powered interview coach. Practice mock interviews, get instant feedback, and land your dream tech job.
            </p>
            <div className="flex gap-4">
              <Button size="lg" variant="secondary" onClick={handleGetStarted}>
                Get Started <Sparkles className="ml-2 h-5 w-5" />
              </Button>
              {!isAuthenticated && (
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1">
            <img 
              src={heroImage} 
              alt="Interview preparation" 
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Everything You Need to Succeed</h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Comprehensive tools to prepare for your next tech interview
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>AI Mock Interviews</CardTitle>
              <CardDescription>
                Practice with realistic AI-powered interview simulations tailored to your target role
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle>Resume Analysis</CardTitle>
              <CardDescription>
                Get AI-powered feedback on your resume with ATS optimization tips and improvements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-accent" />
              </div>
              <CardTitle>Performance Tracking</CardTitle>
              <CardDescription>
                Monitor your progress with detailed analytics and personalized improvement suggestions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Ace Your Next Interview?</h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of professionals preparing with AI-powered mentorship
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted}>
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 TechMock Mentor. Your path to interview success.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
