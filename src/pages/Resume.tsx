import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Resume = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setAnalysis(null);
      } else {
        toast.error('Please upload a PDF, DOC, or DOCX file');
      }
    }
  };

  const analyzeResume = async () => {
    if (!file) {
      toast.error('Please upload a resume first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to analyze resume');
        return;
      }

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Call edge function with just filename
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          fileName: file.name
        }
      });

      if (error) throw error;

      setAnalysis(data?.analysis || 'Analysis complete.');
      toast.success('Analysis complete!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-primary">Resume Analyzer</h1>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="resume">Upload Your Resume</Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button onClick={analyzeResume} disabled={!file || isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
              {file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {analysis && (
              <Card className="p-6 bg-muted">
                <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
                <p className="whitespace-pre-wrap">{analysis}</p>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Resume;
