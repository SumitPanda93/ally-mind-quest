import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Award, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PerformanceCardProps {
  stats: {
    totalExams: number;
    avgScore: number;
    bestScore: number;
  };
  recentExams: any[];
}

const PerformanceCard = ({ stats, recentExams }: PerformanceCardProps) => {
  // Calculate performance metrics
  const getPerformanceTrend = () => {
    if (recentExams.length < 2) return 0;
    const recent = recentExams.slice(0, 2);
    const latestScore = recent[0]?.exam_results?.[0]?.total_score || 0;
    const previousScore = recent[1]?.exam_results?.[0]?.total_score || 0;
    return latestScore - previousScore;
  };

  const getPercentile = () => {
    // Estimate percentile based on average score
    if (stats.avgScore >= 90) return 95;
    if (stats.avgScore >= 80) return 85;
    if (stats.avgScore >= 70) return 70;
    if (stats.avgScore >= 60) return 55;
    return 40;
  };

  const trend = getPerformanceTrend();
  const percentile = getPercentile();

  if (stats.totalExams === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <BarChart3 className="h-10 w-10 text-accent mb-2" />
          <CardTitle>Performance</CardTitle>
          <CardDescription>Track your progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Complete exams to see your performance metrics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <BarChart3 className="h-10 w-10 text-accent mb-2" />
        <CardTitle>Performance</CardTitle>
        <CardDescription>Your progress overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Average Score</span>
            <span className="font-semibold">{stats.avgScore}%</span>
          </div>
          <Progress value={stats.avgScore} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className={`h-4 w-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          <span className="text-muted-foreground">Trend:</span>
          <span className={`font-semibold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Award className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">Percentile:</span>
          <span className="font-semibold">{percentile}th</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Best Score:</span>
          <span className="font-semibold">{stats.bestScore}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceCard;