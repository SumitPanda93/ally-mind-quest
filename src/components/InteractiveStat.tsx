import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InteractiveStatProps {
  title: string;
  value: string | number;
  description?: string;
  drillDownData?: any[];
  type: 'total' | 'average' | 'best';
}

const InteractiveStat = ({ title, value, description, drillDownData = [], type }: InteractiveStatProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderDrillDown = () => {
    if (!drillDownData || drillDownData.length === 0) {
      return <p className="text-muted-foreground">No data available</p>;
    }

    switch (type) {
      case 'total':
        return (
          <div className="space-y-2">
            {drillDownData.map((exam, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{exam.technology}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.experience_level} • {exam.difficulty}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(exam.completed_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={exam.exam_results?.[0]?.total_score >= 70 ? 'default' : 'secondary'}>
                    {exam.exam_results?.[0]?.total_score}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        );

      case 'average':
        const distribution = drillDownData.reduce((acc: any, exam: any) => {
          const score = exam.exam_results?.[0]?.total_score || 0;
          const range = score >= 80 ? '80-100%' : score >= 60 ? '60-79%' : score >= 40 ? '40-59%' : '0-39%';
          acc[range] = (acc[range] || 0) + 1;
          return acc;
        }, {});

        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Score Distribution</h4>
            {Object.entries(distribution).map(([range, count]: [string, any]) => (
              <div key={range} className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">{range}</span>
                <Badge variant="outline">{count} exams</Badge>
              </div>
            ))}
          </div>
        );

      case 'best':
        const topScores = [...drillDownData]
          .sort((a, b) => (b.exam_results?.[0]?.total_score || 0) - (a.exam_results?.[0]?.total_score || 0))
          .slice(0, 5);

        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm mb-2">Top 5 Performances</h4>
            {topScores.map((exam, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">#{idx + 1} - {exam.technology}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(exam.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-primary">{exam.exam_results?.[0]?.total_score}%</Badge>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
        onClick={() => drillDownData.length > 0 && setIsOpen(true)}
      >
        <CardHeader className="pb-2">
          <CardDescription>{description || title}</CardDescription>
          <CardTitle className="text-3xl">{value}</CardTitle>
        </CardHeader>
        {drillDownData.length > 0 && (
          <CardContent>
            <p className="text-xs text-muted-foreground">Click for details</p>
          </CardContent>
        )}
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title} - Detailed Analytics</DialogTitle>
            <DialogDescription>
              Complete breakdown of your {title.toLowerCase()} metrics
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {renderDrillDown()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InteractiveStat;