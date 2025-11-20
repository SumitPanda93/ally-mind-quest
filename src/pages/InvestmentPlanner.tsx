import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TrendingUp, AlertCircle, DollarSign, Target } from "lucide-react";
import { toast } from "sonner";

const InvestmentPlanner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentPeriod, setInvestmentPeriod] = useState('');
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [recommendation, setRecommendation] = useState<any>(null);

  const handleGetRecommendation = async () => {
    if (!investmentAmount || !investmentPeriod) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('financial-advisor', {
        body: {
          type: 'investment',
          amount: parseFloat(investmentAmount),
          period: parseInt(investmentPeriod),
          riskProfile
        }
      });

      if (error) throw error;

      setRecommendation(data);
      toast.success('Investment plan generated!');
    } catch (error) {
      console.error('Error getting recommendation:', error);
      toast.error('Failed to generate recommendation');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
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
          <h1 className="text-4xl font-bold text-white mb-2">AI Investment Advisor</h1>
          <p className="text-white/90">Get personalized investment recommendations</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Investment Details
            </CardTitle>
            <CardDescription>Tell us about your investment goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Investment Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 100000"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Investment Period (years)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={investmentPeriod}
                  onChange={(e) => setInvestmentPeriod(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Risk Profile</Label>
              <Select value={riskProfile} onValueChange={setRiskProfile}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Conservative (Low Risk)</SelectItem>
                  <SelectItem value="moderate">Balanced (Moderate Risk)</SelectItem>
                  <SelectItem value="high">Aggressive (High Risk)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {riskProfile === 'low' && 'Prefer stable returns with minimal risk'}
                {riskProfile === 'moderate' && 'Balance between growth and safety'}
                {riskProfile === 'high' && 'Willing to take risks for higher returns'}
              </p>
            </div>

            <Button onClick={handleGetRecommendation} disabled={loading} className="w-full">
              {loading ? 'Generating Plan...' : 'Get Investment Recommendation'}
            </Button>
          </CardContent>
        </Card>

        {/* Recommendation Results */}
        {recommendation && (
          <>
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Your Investment Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Expected Returns</p>
                    <p className="text-2xl font-bold text-green-600">
                      {recommendation.expectedReturn || '10-12%'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Projected Value</p>
                    <p className="text-2xl font-bold">
                      ₹{recommendation.projectedValue?.toLocaleString() || '150000'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    <p className={`text-2xl font-bold ${getRiskColor(riskProfile)}`}>
                      {riskProfile.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Recommended Portfolio Mix
                  </h3>
                  <div className="space-y-3">
                    {recommendation.portfolio?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.type}</span>
                            <span className="text-sm">{item.allocation}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${item.allocation}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </div>
                    )) || (
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Equity Mutual Funds</span>
                            <span>40%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '40%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Fixed Deposits</span>
                            <span>30%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '30%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Gold/Bonds</span>
                            <span>30%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '30%' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    AI Recommendation
                  </h4>
                  <p className="text-sm">
                    {recommendation.advice || 
                      `Based on your ${riskProfile} risk profile and ${investmentPeriod}-year timeline, we recommend diversifying across equity, debt, and alternative investments. Consider SIP (Systematic Investment Plan) for rupee-cost averaging benefits.`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Open a Demat account if you don't have one</li>
                  <li>Research recommended mutual funds and schemes</li>
                  <li>Start with SIP for systematic investing</li>
                  <li>Review and rebalance portfolio annually</li>
                  <li>Stay invested for long-term wealth creation</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}

        {/* Educational Content */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold">What is SIP?</h4>
              <p className="text-muted-foreground">
                Systematic Investment Plan allows you to invest fixed amounts regularly, reducing market timing risk.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Diversification</h4>
              <p className="text-muted-foreground">
                Spread investments across asset classes to minimize risk and maximize returns.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Risk vs Return</h4>
              <p className="text-muted-foreground">
                Higher potential returns come with higher risk. Balance based on your goals and timeline.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InvestmentPlanner;
