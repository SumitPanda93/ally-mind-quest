import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Target, PiggyBank, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FinancialProfile {
  monthly_income: number;
  risk_profile: string;
}

interface Budget {
  total_income: number;
  total_expenses: number;
  savings: number;
}

interface Goal {
  goal_type: string;
  target_amount: number;
  current_amount: number;
}

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load financial profile
      const { data: profileData } = await supabase
        .from('user_financial_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);

      // Load current month budget
      const currentDate = new Date();
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentDate.getMonth() + 1)
        .eq('year', currentDate.getFullYear())
        .single();

      setBudget(budgetData);

      // Load active goals
      const { data: goalsData } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(3);

      setGoals(goalsData || []);

      // Calculate health score
      calculateHealthScore(profileData, budgetData, goalsData || []);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = (profile: any, budget: any, goals: any[]) => {
    let score = 0;

    // Savings ratio (40 points)
    if (budget?.savings && budget?.total_income) {
      const savingsRatio = (budget.savings / budget.total_income) * 100;
      if (savingsRatio >= 30) score += 40;
      else if (savingsRatio >= 20) score += 30;
      else if (savingsRatio >= 10) score += 20;
      else score += 10;
    }

    // Goal progress (30 points)
    if (goals.length > 0) {
      score += 20;
      const avgProgress = goals.reduce((acc, g) => 
        acc + (g.current_amount / g.target_amount * 100), 0) / goals.length;
      if (avgProgress >= 50) score += 10;
    }

    // Income stability (30 points)
    if (profile?.monthly_income && profile.monthly_income > 0) {
      score += 30;
    }

    setHealthScore(Math.min(score, 100));
  };

  const getHealthStatus = () => {
    if (healthScore >= 80) return { text: "Excellent!", color: "text-green-600", icon: TrendingUp };
    if (healthScore >= 60) return { text: "Good", color: "text-blue-600", icon: TrendingUp };
    if (healthScore >= 40) return { text: "Needs Improvement", color: "text-yellow-600", icon: AlertCircle };
    return { text: "Critical", color: "text-red-600", icon: TrendingDown };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  const status = getHealthStatus();
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-hero">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/mentor/finance')}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Finance Mentor
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">Financial Dashboard</h1>
          <p className="text-white/90">Your complete financial health overview</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Financial Health Score */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className={`h-6 w-6 ${status.color}`} />
              Financial Health Score
            </CardTitle>
            <CardDescription>Your overall financial wellness rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold">{healthScore}/100</span>
                <span className={`text-xl font-semibold ${status.color}`}>{status.text}</span>
              </div>
              <Progress value={healthScore} className="h-4" />
              <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>0-40: Critical</div>
                <div>41-70: Good</div>
                <div>71-100: Excellent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{profile?.monthly_income?.toLocaleString() || '0'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-blue-600" />
                Monthly Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{budget?.savings?.toLocaleString() || '0'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {budget?.total_income && budget?.savings 
                  ? `${((budget.savings / budget.total_income) * 100).toFixed(1)}% of income`
                  : 'Set up your budget'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{goals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {goals.length > 0 ? 'Making progress' : 'Create your first goal'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Goals Preview */}
        {goals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Goals</CardTitle>
              <CardDescription>Track your financial goals progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                return (
                  <div key={goal.goal_type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{goal.goal_type}</span>
                      <span className="text-muted-foreground">
                        ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progress} />
                  </div>
                );
              })}
              <Button onClick={() => navigate('/finance/goals')} className="w-full mt-4">
                View All Goals
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/finance/budget')}>
            <CardHeader>
              <CardTitle>Budget Planner</CardTitle>
              <CardDescription>Manage income, expenses, and track spending</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/finance/investments')}>
            <CardHeader>
              <CardTitle>Investment Advisor</CardTitle>
              <CardDescription>Get personalized investment recommendations</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FinanceDashboard;
