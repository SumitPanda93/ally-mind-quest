import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Play, Bug, FileCode, Award, Save, Trash2, ArrowLeft, Moon, Sun } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const LANGUAGES = [
  { value: 'python', label: 'Python', extension: '.py', template: 'print("Hello, World!")' },
  { value: 'javascript', label: 'JavaScript', extension: '.js', template: 'console.log("Hello, World!");' },
  { value: 'java', label: 'Java', extension: '.java', template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
  { value: 'cpp', label: 'C++', extension: '.cpp', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
  { value: 'sql', label: 'SQL', extension: '.sql', template: 'SELECT "Hello, World!" as greeting;' },
];

export default function CodingPlayground() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [savedSnippets, setSavedSnippets] = useState<any[]>([]);

  useEffect(() => {
    loadSavedSnippets();
  }, []);

  const loadSavedSnippets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('code_snippets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setSavedSnippets(data);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    const lang = LANGUAGES.find(l => l.value === value);
    if (lang) {
      setCode(lang.template);
      setOutput('');
      setAiResult(null);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    setAiResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('execute-code', {
        body: { language, code, stdin }
      });

      if (error) throw error;

      if (data.stderr) {
        setOutput(`Error:\n${data.stderr}\n\nOutput:\n${data.output}`);
      } else {
        setOutput(data.output || 'Code executed successfully with no output.');
      }
    } catch (error: any) {
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive"
      });
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAIAction = async (action: 'fix' | 'explain' | 'score') => {
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-code-assistant', {
        body: { 
          action, 
          code, 
          language,
          error: output.includes('Error:') ? output : undefined,
          output: !output.includes('Error:') ? output : undefined
        }
      });

      if (error) throw error;

      setAiResult(data);
      
      if (action === 'fix' && data.correctedCode) {
        toast({
          title: "Code Fixed!",
          description: "AI has corrected your code. Review the changes in the AI panel.",
        });
      }
    } catch (error: any) {
      toast({
        title: "AI Analysis Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveSnippet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save code snippets.",
        variant: "destructive"
      });
      return;
    }

    const title = prompt('Enter a title for this snippet:');
    if (!title) return;

    const { error } = await supabase
      .from('code_snippets')
      .insert({
        user_id: user.id,
        title,
        language,
        code,
        stdin
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save snippet.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Saved!",
        description: "Code snippet saved successfully.",
      });
      loadSavedSnippets();
    }
  };

  const loadSnippet = (snippet: any) => {
    setLanguage(snippet.language);
    setCode(snippet.code);
    setStdin(snippet.stdin || '');
    setOutput('');
    setAiResult(null);
  };

  const deleteSnippet = async (id: string) => {
    const { error } = await supabase
      .from('code_snippets')
      .delete()
      .eq('id', id);

    if (!error) {
      toast({ title: "Deleted", description: "Snippet removed." });
      loadSavedSnippets();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Coding Playground
            </h1>
            <p className="text-muted-foreground mt-2">Write, run, and debug code with AI assistance</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
          >
            {theme === 'vs-dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar - Saved Snippets */}
          <Card className="p-4 lg:col-span-1 max-h-[800px] overflow-y-auto">
            <h3 className="font-semibold mb-4">Saved Snippets</h3>
            {savedSnippets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved snippets yet</p>
            ) : (
              <div className="space-y-2">
                {savedSnippets.map((snippet) => (
                  <Card key={snippet.id} className="p-3 cursor-pointer hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div onClick={() => loadSnippet(snippet)} className="flex-1">
                        <p className="font-medium text-sm">{snippet.title}</p>
                        <Badge variant="outline" className="mt-1">
                          {LANGUAGES.find(l => l.value === snippet.language)?.label}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteSnippet(snippet.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Main Editor Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Controls */}
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2 flex-1 justify-end">
                  <Button onClick={runCode} disabled={isRunning}>
                    <Play className="mr-2 h-4 w-4" />
                    {isRunning ? 'Running...' : 'Run'}
                  </Button>
                  <Button onClick={() => handleAIAction('fix')} variant="outline" disabled={isAnalyzing}>
                    <Bug className="mr-2 h-4 w-4" />
                    Fix Code
                  </Button>
                  <Button onClick={() => handleAIAction('explain')} variant="outline" disabled={isAnalyzing}>
                    <FileCode className="mr-2 h-4 w-4" />
                    Explain
                  </Button>
                  <Button onClick={() => handleAIAction('score')} variant="outline" disabled={isAnalyzing}>
                    <Award className="mr-2 h-4 w-4" />
                    Score
                  </Button>
                  <Button onClick={saveSnippet} variant="secondary">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </Card>

            {/* Editor */}
            <Card className="overflow-hidden">
              <Editor
                height="400px"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme={theme}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </Card>

            {/* Input/Output */}
            <Tabs defaultValue="output" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="input">Input</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
                <TabsTrigger value="ai">AI Assistant</TabsTrigger>
              </TabsList>

              <TabsContent value="input">
                <Card className="p-4">
                  <Textarea
                    placeholder="Enter input for your program (stdin)..."
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    className="min-h-[200px] font-mono"
                  />
                </Card>
              </TabsContent>

              <TabsContent value="output">
                <Card className="p-4">
                  <pre className="min-h-[200px] font-mono text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                    {output || 'Output will appear here...'}
                  </pre>
                </Card>
              </TabsContent>

              <TabsContent value="ai">
                <Card className="p-4 min-h-[200px]">
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center h-[200px]">
                      <div className="animate-pulse text-muted-foreground">Analyzing code...</div>
                    </div>
                  ) : aiResult ? (
                    <div className="space-y-4">
                      {aiResult.correctedCode && (
                        <div>
                          <h4 className="font-semibold mb-2">Corrected Code:</h4>
                          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                            {aiResult.correctedCode}
                          </pre>
                          <p className="mt-2 text-sm">{aiResult.explanation}</p>
                        </div>
                      )}
                      
                      {aiResult.overview && (
                        <div>
                          <h4 className="font-semibold mb-2">Code Explanation:</h4>
                          <p className="text-sm mb-2">{aiResult.overview}</p>
                          <Separator className="my-2" />
                          <div className="text-sm space-y-1">
                            {aiResult.breakdown?.map((item: any, i: number) => (
                              <p key={i}>• {item.explanation || item}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {aiResult.overall !== undefined && (
                        <div>
                          <h4 className="font-semibold mb-2">Code Quality Score:</h4>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Overall Score</p>
                              <p className="text-3xl font-bold text-primary">{aiResult.overall}/100</p>
                              <Badge className="mt-1">{aiResult.level}</Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>Readability: {aiResult.readability}/100</div>
                              <div>Best Practices: {aiResult.bestPractices}/100</div>
                              <div>Efficiency: {aiResult.efficiency}/100</div>
                              <div>Error Handling: {aiResult.errorHandling}/100</div>
                            </div>
                          </div>
                          <h5 className="font-semibold text-sm mb-2">Suggestions:</h5>
                          <ul className="text-sm space-y-1">
                            {aiResult.suggestions?.map((s: string, i: number) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiResult.raw && (
                        <div className="text-sm whitespace-pre-wrap">{aiResult.raw}</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      Click "Fix Code", "Explain", or "Score" to get AI assistance
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
