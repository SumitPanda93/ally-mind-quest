import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageSquare, TrendingUp, Activity, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const OnboardingModal = ({ open, onClose }: OnboardingModalProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  const mentors = [
    {
      id: 'tech',
      name: 'Tech Mentor',
      icon: MessageSquare,
      description: 'Mock tests & interview prep',
      gradient: 'from-primary/10 to-primary/5',
    },
    {
      id: 'finance',
      name: 'Finance Mentor',
      icon: TrendingUp,
      description: 'Budget planning & investing',
      gradient: 'from-secondary/10 to-secondary/5',
    },
    {
      id: 'health',
      name: 'Health Mentor',
      icon: Activity,
      description: 'Wellness & lifestyle',
      gradient: 'from-accent/10 to-accent/5',
      comingSoon: true,
    },
    {
      id: 'education',
      name: 'Education Mentor',
      icon: GraduationCap,
      description: 'Study planning & coaching',
      gradient: 'from-muted/30 to-muted/10',
      comingSoon: true,
    },
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Just getting started' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced professional' },
  ];

  const handleNext = () => {
    if (step === 1 && selectedMentor) {
      setStep(2);
    } else if (step === 2 && experienceLevel) {
      setStep(3);
    }
  };

  const handleStartDiagnostic = () => {
    onClose();
    if (selectedMentor === 'tech') {
      navigate('/exam-setup');
    } else if (selectedMentor === 'finance') {
      navigate('/mentor/finance');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-poppins">
            {step === 1 && "Welcome to MENTOR!"}
            {step === 2 && "What's your experience level?"}
            {step === 3 && "You're all set!"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Choose your mentor to get started with personalized guidance"}
            {step === 2 && "This helps us customize your learning path"}
            {step === 3 && "Ready to begin your journey with personalized assessments"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Choose Mentor */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
              {mentors.map((mentor) => {
                const Icon = mentor.icon;
                return (
                  <button
                    key={mentor.id}
                    onClick={() => !mentor.comingSoon && setSelectedMentor(mentor.id)}
                    disabled={mentor.comingSoon}
                    className={`relative p-6 rounded-lg border-2 text-left transition-all ${
                      selectedMentor === mentor.id
                        ? 'border-primary bg-primary/5 shadow-elegant'
                        : 'border-border hover:border-primary/50 hover:shadow-soft'
                    } ${mentor.comingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${mentor.gradient} opacity-50`} />
                    <div className="relative">
                      <Icon className="h-8 w-8 mb-3 text-primary" />
                      <h3 className="font-poppins font-semibold mb-1">{mentor.name}</h3>
                      <p className="text-sm text-muted-foreground">{mentor.description}</p>
                      {mentor.comingSoon && (
                        <span className="mt-2 inline-block text-xs bg-muted px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Experience Level */}
          {step === 2 && (
            <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel} className="space-y-3 animate-slide-up">
              {experienceLevels.map((level) => (
                <div
                  key={level.value}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    experienceLevel === level.value
                      ? 'border-primary bg-primary/5 shadow-soft'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setExperienceLevel(level.value)}
                >
                  <RadioGroupItem value={level.value} id={level.value} className="mt-0.5" />
                  <Label htmlFor={level.value} className="cursor-pointer flex-1">
                    <div className="font-semibold">{level.label}</div>
                    <div className="text-sm text-muted-foreground">{level.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="text-center py-8 animate-scale-in space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-primary animate-pulse-glow">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-poppins font-bold mb-2">Perfect! Let's get started</h3>
                <p className="text-muted-foreground">
                  We'll start with a quick 10-question diagnostic to understand your current level
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-primary' : s < step ? 'w-4 bg-primary/50' : 'w-4 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
            {step === 1 ? 'Skip' : 'Back'}
          </Button>
          <Button
            onClick={step === 3 ? handleStartDiagnostic : handleNext}
            disabled={step === 1 ? !selectedMentor : step === 2 ? !experienceLevel : false}
            className="gap-2"
          >
            {step === 3 ? (
              <>
                Start Diagnostic <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Next <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
