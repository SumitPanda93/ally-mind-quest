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
              <h1 className="text-5xl font-bold">MENTOR</h1>
            </div>
            <p className="text-xl mb-8 text-white/90">
              Guidance. Simplified. Your personalized AI mentorship platform for Tech, Finance, Health, and Education.
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

      {/* Mentor Categories Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Choose Your Mentor</h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Get personalized AI-powered guidance in your area of interest
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-primary">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Tech Mentor</CardTitle>
              <CardDescription className="text-base">
                Mock interviews, coding assessments, resume analysis, and career guidance for tech professionals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-secondary/5 to-secondary/10">
            <CardHeader>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-secondary flex items-center justify-center shadow-glow-secondary">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Finance Mentor</CardTitle>
              <CardDescription className="text-base">
                Personal finance guidance, budget planning, investment tips, and financial goal tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-accent flex items-center justify-center shadow-glow-accent">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Health Mentor</CardTitle>
              <CardDescription className="text-base">
                Wellness planning, lifestyle guidance, habit tracking, and holistic health recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-muted/5 to-muted/10">
            <CardHeader>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-subtle flex items-center justify-center shadow-elegant">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Education Mentor</CardTitle>
              <CardDescription className="text-base">
                Study planning, concept explanations, exam prep, and personalized learning paths
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
