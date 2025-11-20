import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, PieChart } from "lucide-react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  'Housing',
  'Utilities',
  'Food',
  'Transport',
  'Entertainment',
  'Healthcare',
  'Education',
  'Shopping',
  'Other'
];

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const BudgetPlanner = () => {
  const navigate = useNavigate();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50);

      if (data) setExpenses(data);

      // Load income from profile
      const { data: profile } = await supabase
        .from('user_financial_profiles')
        .select('monthly_income')
        .eq('user_id', user.id)
        .single();

      if (profile?.monthly_income) {
        setMonthlyIncome(profile.monthly_income.toString());
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      toast.success('Expense added successfully');
      setNewExpense({ amount: '', category: 'Food', description: '' });
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Expense deleted');
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleSaveIncome = async () => {
    if (!monthlyIncome) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_financial_profiles')
        .upsert({
          user_id: user.id,
          monthly_income: parseFloat(monthlyIncome)
        });

      if (error) throw error;

      toast.success('Income updated successfully');
    } catch (error) {
      console.error('Error saving income:', error);
      toast.error('Failed to save income');
    }
  };

  const getCategoryTotals = () => {
    const totals: Record<string, number> = {};
    expenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    });
    return totals;
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const income = parseFloat(monthlyIncome) || 0;
  const savings = income - totalExpenses;
  const savingsRate = income > 0 ? (savings / income * 100).toFixed(1) : '0';

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
          <h1 className="text-4xl font-bold text-white mb-2">Budget Planner & Expense Tracker</h1>
          <p className="text-white/90">Track your income and expenses efficiently</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Income & Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monthly Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter income"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                />
                <Button onClick={handleSaveIncome} size="sm">Save</Button>
              </div>
              <p className="text-2xl font-bold mt-2">₹{income.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">₹{savings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{savingsRate}% of income</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Expense */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newExpense.category} onValueChange={(val) => setNewExpense({ ...newExpense, category: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Optional"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddExpense} disabled={loading} className="w-full">
                  Add Expense
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(getCategoryTotals()).map(([category, amount]) => (
                <div key={category}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">{category}</span>
                    <span>₹{amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(amount / totalExpenses) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your latest spending activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No expenses yet. Add your first expense above.</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{expense.category}</span>
                        <span className="text-xs text-muted-foreground">{expense.date}</span>
                      </div>
                      {expense.description && (
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">₹{expense.amount.toLocaleString()}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BudgetPlanner;
