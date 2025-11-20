import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, FileText, BarChart3, Sparkles, CheckCircle, Users, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import heroImage from '@/assets/hero-interview.jpg';
import mentorIcon from '@/assets/mentor-icon.png';
import OnboardingModal from '@/components/OnboardingModal';

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      
      // Show onboarding for first-time users
      if (session) {
        const hasSeenOnboarding = localStorage.getItem('mentor_onboarding_seen');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
          localStorage.setItem('mentor_onboarding_seen', 'true');
        }
      }
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

  const trustSignals = [
    { icon: Users, label: '10,000+ Active Users' },
    { icon: Award, label: '50+ Certifications Covered' },
    { icon: CheckCircle, label: '95% Success Rate' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLS45LTItMi0yaC04Yy0xLjEgMC0yIC45LTIgMnY4YzAgMS4xLjkgMiAyIDJoOGMxLjEgMCAyLS45IDItMnYtOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Text Content */}
            <div className="flex-1 text-white space-y-8 animate-slide-up">
              <div className="flex items-center gap-4">
                <img src={mentorIcon} alt="MENTOR" className="h-16 w-16 animate-float" />
                <div>
                  <h1 className="text-5xl md:text-6xl font-poppins font-black tracking-tight">
                    MENTOR
                  </h1>
                  <p className="text-xl md:text-2xl text-white/90 font-inter font-medium">
                    Guidance. Simplified.
                  </p>
                </div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-poppins font-bold leading-tight">
                One Stop. All Growth. AI Driven.
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 max-w-xl">
                Master tech skills, optimize finances, improve health, and accelerate learning—all with personalized AI mentorship tailored to your goals.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  onClick={handleGetStarted}
                  className="text-lg px-8 py-6 shadow-elegant hover:shadow-glow-secondary animate-pulse-glow"
                >
                  Start Free Assessment <Sparkles className="ml-2 h-5 w-5" />
                </Button>
                {!isAuthenticated && (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-white/10 text-white border-white hover:bg-white/20 text-lg px-8 py-6"
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                )}
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap gap-6 pt-4 animate-slide-up animate-stagger-1">
                {trustSignals.map((signal, idx) => {
                  const Icon = signal.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-white/90">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{signal.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="flex-1 animate-slide-up animate-stagger-2">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-accent opacity-20 blur-2xl rounded-full" />
                <img 
                  src={heroImage} 
                  alt="Interview preparation" 
                  className="relative rounded-2xl shadow-glow-accent"
                />
              </div>
            </div>
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
          <Card className="text-center hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10" onClick={() => navigate('/mentor/tech')}>
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

          <Card className="text-center hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-secondary/5 to-secondary/10" onClick={() => navigate('/mentor/finance')}>
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

          <Card className="text-center hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-accent/5 to-accent/10" onClick={() => navigate('/mentor/health')}>
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

          <Card className="text-center hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-muted/5 to-muted/10" onClick={() => navigate('/mentor/education')}>
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
