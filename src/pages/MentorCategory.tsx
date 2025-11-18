import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FileText, BookOpen, Sparkles, ArrowLeft, TrendingUp, Dumbbell, GraduationCap, Calculator, Activity, Brain } from "lucide-react";

const categoryConfig = {
  tech: {
    title: "Tech Mentor",
    description: "AI-guided tech prep: mock interviews, MCQ exams, resume insights, and career guidance.",
    heroIcon: MessageSquare,
    actions: [
      { label: "Start MCQ Exam", to: "/exam-setup", variant: "default" as const },
      { label: "Mock Interview", to: "/interview", variant: "outline" as const },
      { label: "Resume Analyzer", to: "/resume", variant: "secondary" as const },
    ],
  },
  finance: {
    title: "Finance Mentor",
    description: "Personal finance guidance: budgeting, investments, and goal tracking.",
    heroIcon: TrendingUp,
    actions: [
      { label: "Budget Planner", to: "/finance/budget", variant: "default" as const, icon: Calculator },
      { label: "Investment Tracker", to: "/finance/investments", variant: "outline" as const, icon: TrendingUp },
      { label: "Financial Goals", to: "/finance/goals", variant: "secondary" as const, icon: FileText },
    ],
  },
  health: {
    title: "Health Mentor",
    description: "Wellness planning, lifestyle guidance, and habit tracking.",
    heroIcon: Activity,
    actions: [
      { label: "Workout Planner", to: "/health/workout", variant: "default" as const, icon: Dumbbell },
      { label: "Meal Tracker", to: "/health/meals", variant: "outline" as const, icon: Activity },
      { label: "Health Metrics", to: "/health/metrics", variant: "secondary" as const, icon: Sparkles },
    ],
  },
  education: {
    title: "Education Mentor",
    description: "Study planning, concept explanations, and learning paths.",
    heroIcon: GraduationCap,
    actions: [
      { label: "Study Planner", to: "/education/study", variant: "default" as const, icon: BookOpen },
      { label: "Flashcards", to: "/education/flashcards", variant: "outline" as const, icon: Brain },
      { label: "Learning Goals", to: "/education/goals", variant: "secondary" as const, icon: GraduationCap },
    ],
  },
} as const;

const MentorCategory = () => {
  const { category } = useParams();
  const navigate = useNavigate();

  const cfg = useMemo(() => {
    const key = (category || "").toLowerCase() as keyof typeof categoryConfig;
    return categoryConfig[key];
  }, [category]);

  useEffect(() => {
    if (!cfg) return;
    const title = `${cfg.title} • MENTOR`;
    const desc = cfg.description;
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
  }, [cfg]);

  if (!cfg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Mentor not found</CardTitle>
            <CardDescription>Choose a valid mentor category.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = cfg.heroIcon;

  const isComingSoon = (cfg as any)?.comingSoon === true;

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="relative container mx-auto px-4 py-16">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4 text-white">
            <div className="h-14 w-14 rounded-xl bg-background/10 backdrop-blur flex items-center justify-center border border-white/20">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{cfg.title}</h1>
              <p className="text-white/90">{cfg.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <section>
          <h2 className="sr-only">{cfg.title} tools and actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cfg.actions.map((a) => {
              const ActionIcon = (a as any).icon || MessageSquare;
              return (
                <Card key={a.label} className="hover:shadow-elegant transition-all hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ActionIcon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>{a.label}</CardTitle>
                    </div>
                    <CardDescription>
                      {category === 'tech' && 'AI-powered tools to boost your tech career'}
                      {category === 'finance' && 'Smart tools for financial planning and growth'}
                      {category === 'health' && 'Track and improve your wellness journey'}
                      {category === 'education' && 'Optimize your learning and study habits'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant={a.variant} onClick={() => navigate(a.to)}>
                      {a.label}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MentorCategory;
