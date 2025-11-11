import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
  showResult?: boolean;
  correctAnswer?: string;
  explanation?: string;
}

const QuestionCard = ({
  questionNumber,
  questionText,
  options,
  selectedAnswer,
  onAnswerSelect,
  showResult = false,
  correctAnswer,
  explanation
}: QuestionCardProps) => {
  const getOptionStyle = (option: string) => {
    if (!showResult) return '';
    if (option === correctAnswer) return 'border-green-500 bg-green-50 dark:bg-green-950';
    if (option === selectedAnswer && option !== correctAnswer) 
      return 'border-red-500 bg-red-50 dark:bg-red-950';
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Question {questionNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base font-medium">{questionText}</p>
        
        <RadioGroup value={selectedAnswer} onValueChange={onAnswerSelect} disabled={showResult}>
          {Object.entries(options).map(([key, value]) => (
            <div key={key} className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors ${getOptionStyle(key)}`}>
              <RadioGroupItem value={key} id={`q${questionNumber}-${key}`} className="mt-1" />
              <Label 
                htmlFor={`q${questionNumber}-${key}`} 
                className="flex-1 cursor-pointer leading-relaxed"
              >
                <span className="font-semibold mr-2">{key}.</span>
                {value}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {showResult && explanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-semibold text-sm mb-2">Explanation:</p>
            <p className="text-sm">{explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
