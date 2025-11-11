import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ExamSetup = () => {
  const navigate = useNavigate();
  const [technology, setTechnology] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState('20');
  const [isGenerating, setIsGenerating] = useState(false);

  const technologyGroups = {
    'Microsoft Technologies': [
      'Azure (AZ-900, AZ-104, AZ-305, AZ-204, AZ-500)',
      'Power Platform (PL-900, PL-100, PL-300, PL-400)',
      'Microsoft 365 (MS-900, MS-102, MS-700, SC-900)',
      'Dynamics 365 (MB-910, MB-920, MB-330, MB-240)',
      'Azure Data & AI (DP-900, DP-100, AI-900)',
      '.NET Development (C#, ASP.NET Core, Entity Framework, Blazor)',
      'Power BI (Data modeling, DAX, Visualization)'
    ],
    'SAP Technologies': [
      'SAP S/4HANA (FI, SD, MM, PP, CO)',
      'SAP ABAP (Core, OOPs, CDS Views, RAP)',
      'SAP Fiori/UI5',
      'SAP BASIS & Security',
      'SAP Analytics Cloud',
      'SAP SuccessFactors',
      'SAP Ariba / Concur',
      'SAP HANA Database'
    ],
    'Oracle Technologies': [
      'Oracle Cloud Infrastructure (OCI)',
      'Oracle Database (SQL, PL/SQL, DBA)',
      'Oracle Fusion Applications',
      'Oracle APEX & Low Code',
      'Oracle E-Business Suite'
    ],
    'Cybersecurity': [
      'CompTIA Security+',
      'CEH (Certified Ethical Hacker)',
      'CISSP Fundamentals',
      'Cloud Security (AZ-500, AWS Security)',
      'Network Security',
      'Ethical Hacking / Penetration Testing',
      'SOC / Incident Response',
      'GRC (ISO 27001, NIST, GDPR)',
      'Identity & Access Management (IAM)'
    ],
    'Cloud Computing': [
      'AWS (Cloud Practitioner, Solutions Architect, Developer)',
      'Google Cloud (GCP)',
      'IBM Cloud',
      'Multi-Cloud Architecture'
    ],
    'Data Science & AI': [
      'Machine Learning (Scikit-learn, TensorFlow, PyTorch)',
      'Deep Learning (CNN, RNN, NLP)',
      'Data Analysis (Pandas, NumPy, SQL)',
      'AI Fundamentals',
      'Prompt Engineering & LLMs',
      'Data Engineering (ETL, Databricks, Snowflake)'
    ],
    'Programming & Development': [
      'Java', 'Python', 'JavaScript', 'TypeScript',
      'React', 'Angular', 'Vue.js', 'Node.js',
      'Docker', 'Kubernetes', 'DevOps'
    ]
  };

  const handleStartExam = async () => {
    if (!technology || !experienceLevel) {
      toast.error('Please select technology and experience level');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-exam', {
        body: { 
          technology, 
          experienceLevel, 
          difficulty,
          questionCount: parseInt(questionCount)
        }
      });

      if (error) throw error;

      toast.success('Exam generated successfully!');
      navigate(`/exam/${data.examId}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to generate exam');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Setup Your Mock Exam</CardTitle>
            <CardDescription>
              Configure your exam preferences to get started with AI-generated questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="technology">Select Technology</Label>
              <Select value={technology} onValueChange={setTechnology}>
                <SelectTrigger id="technology">
                  <SelectValue placeholder="Choose a technology" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {Object.entries(technologyGroups).map(([group, techs]) => (
                    <SelectGroup key={group}>
                      <SelectLabel className="font-semibold text-primary">{group}</SelectLabel>
                      {techs.map((tech) => (
                        <SelectItem key={tech} value={tech}>
                          {tech}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Experience Level</Label>
              <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner" className="cursor-pointer">
                    Beginner (0-2 years)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="cursor-pointer">
                    Intermediate (2-5 years)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expert" id="expert" />
                  <Label htmlFor="expert" className="cursor-pointer">
                    Expert (5+ years)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <RadioGroup value={difficulty} onValueChange={setDifficulty}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <Label htmlFor="easy" className="cursor-pointer">
                    Easy - Fundamental concepts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="diff-intermediate" />
                  <Label htmlFor="diff-intermediate" className="cursor-pointer">
                    Intermediate - Practical scenarios
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label htmlFor="hard" className="cursor-pointer">
                    Hard - Advanced topics & edge cases
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger id="questionCount">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 questions (15 mins)</SelectItem>
                  <SelectItem value="20">20 questions (30 mins)</SelectItem>
                  <SelectItem value="30">30 questions (45 mins)</SelectItem>
                  <SelectItem value="40">40 questions (60 mins)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleStartExam} 
              disabled={isGenerating || !technology || !experienceLevel}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Exam...
                </>
              ) : (
                'Start Exam'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamSetup;
