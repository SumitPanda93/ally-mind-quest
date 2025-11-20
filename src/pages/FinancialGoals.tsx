import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Target, Plus, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

const GOAL_TYPES = [
  'Emergency Fund',
  'House Purchase',
  'Car Purchase',
  'Retirement',
  'Child Education',
  'Travel',
  'Wedding',
  'Other'
];

interface Goal {
  id: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  monthly_contribution: number | null;
  status: string;
}

const FinancialGoals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'Emergency Fund',
    target_amount: '',
    deadline: '',
    monthly_contribution: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.target_amount) {
      toast.error('Please enter target amount');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('financial_goals').insert({
        user_id: user.id,
        goal_type: newGoal.goal_type,
        target_amount: parseFloat(newGoal.target_amount),
        deadline: newGoal.deadline || null,
        monthly_contribution: newGoal.monthly_contribution ? parseFloat(newGoal.monthly_contribution) : null,
        status: 'active'
      });

      if (error) throw error;

      toast.success('Goal added successfully!');
      setShowAddForm(false);
      setNewGoal({ goal_type: 'Emergency Fund', target_amount: '', deadline: '', monthly_contribution: '' });
      loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add goal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (goalId: string, amount: string) => {
    if (!amount) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newAmount = goal.current_amount + parseFloat(amount);

      const { error } = await supabase
        .from('financial_goals')
        .update({ 
          current_amount: newAmount,
          status: newAmount >= goal.target_amount ? 'completed' : 'active'
        })
        .eq('id', goalId);

      if (error) throw error;

      toast.success('Progress updated!');
      loadGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const calculateMonthsRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    const target = new Date(deadline);
    const months = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, months);
  };

  const calculateRequiredMonthlySaving = (goal: Goal) => {
    const remaining = goal.target_amount - goal.current_amount;
    const months = calculateMonthsRemaining(goal.deadline);
    if (!months || months === 0) return null;
    return Math.ceil(remaining / months);
  };

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
            Back
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">Financial Goals</h1>
          <p className="text-white/90">Plan and track your financial objectives</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        {/* Add Goal Button */}
        <Button onClick={() => setShowAddForm(!showAddForm)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {showAddForm ? 'Cancel' : 'Add New Goal'}
        </Button>

        {/* Add Goal Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
              <CardDescription>Set a financial target and track your progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Goal Type</Label>
                  <Select value={newGoal.goal_type} onValueChange={(val) => setNewGoal({ ...newGoal, goal_type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Target Date (Optional)</Label>
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Monthly Contribution (₹)</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={newGoal.monthly_contribution}
                    onChange={(e) => setNewGoal({ ...newGoal, monthly_contribution: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddGoal} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Goal'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Goals */}
        <div className="space-y-4">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No financial goals yet</p>
                <Button onClick={() => setShowAddForm(true)}>Create Your First Goal</Button>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const monthsRemaining = calculateMonthsRemaining(goal.deadline);
              const requiredMonthlySaving = calculateRequiredMonthlySaving(goal);
              const isCompleted = goal.status === 'completed';

              return (
                <Card key={goal.id} className={isCompleted ? 'border-green-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Target className={`h-5 w-5 ${isCompleted ? 'text-green-600' : ''}`} />
                          {goal.goal_type}
                        </CardTitle>
                        {isCompleted && (
                          <p className="text-sm text-green-600 font-medium mt-1">✓ Goal Achieved!</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          ₹{goal.current_amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          of ₹{goal.target_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={Math.min(progress, 100)} className="h-3" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-muted-foreground">Progress</p>
                          <p className="font-semibold">{progress.toFixed(1)}%</p>
                        </div>
                      </div>
                      {monthsRemaining !== null && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-muted-foreground">Time Left</p>
                            <p className="font-semibold">{monthsRemaining} months</p>
                          </div>
                        </div>
                      )}
                      {requiredMonthlySaving && !isCompleted && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-muted-foreground">Need/Month</p>
                            <p className="font-semibold">₹{requiredMonthlySaving.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                      {goal.monthly_contribution && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-muted-foreground">Current SIP</p>
                            <p className="font-semibold">₹{goal.monthly_contribution.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isCompleted && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Add amount"
                          id={`amount-${goal.id}`}
                        />
                        <Button
                          onClick={() => {
                            const input = document.getElementById(`amount-${goal.id}`) as HTMLInputElement;
                            handleUpdateProgress(goal.id, input.value);
                            input.value = '';
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default FinancialGoals;
