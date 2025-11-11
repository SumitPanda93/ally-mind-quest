import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ResultsChartProps {
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  topicWiseScores?: { [key: string]: { correct: number; total: number } };
}

const ResultsChart = ({ correctAnswers, incorrectAnswers, unanswered, topicWiseScores }: ResultsChartProps) => {
  const pieData = [
    { name: 'Correct', value: correctAnswers, color: '#10b981' },
    { name: 'Incorrect', value: incorrectAnswers, color: '#ef4444' },
    { name: 'Unanswered', value: unanswered, color: '#6b7280' }
  ].filter(item => item.value > 0);

  const topicData = topicWiseScores 
    ? Object.entries(topicWiseScores).map(([topic, scores]) => ({
        topic: topic.length > 15 ? topic.substring(0, 15) + '...' : topic,
        accuracy: ((scores.correct / scores.total) * 100).toFixed(1),
        correct: scores.correct,
        total: scores.total
      }))
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {topicData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Topic-wise Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topicData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border p-2 rounded shadow">
                          <p className="font-semibold">{payload[0].payload.topic}</p>
                          <p className="text-sm">Accuracy: {payload[0].value}%</p>
                          <p className="text-sm">
                            {payload[0].payload.correct}/{payload[0].payload.total} correct
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResultsChart;
