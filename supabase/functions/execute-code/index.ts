import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Piston API endpoint for code execution
const PISTON_API = 'https://emkc.org/api/v2/piston';

// Language mapping for Piston
const languageMap: Record<string, string> = {
  'python': 'python',
  'javascript': 'javascript',
  'java': 'java',
  'cpp': 'c++',
  'sql': 'sqlite3',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language, code, stdin } = await req.json();
    console.log('Executing code:', { language, codeLength: code?.length });

    if (!language || !code) {
      throw new Error('Language and code are required');
    }

    const pistonLanguage = languageMap[language];
    if (!pistonLanguage) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Get available runtimes
    const runtimesResponse = await fetch(`${PISTON_API}/runtimes`);
    const runtimes = await runtimesResponse.json();
    
    // Find the latest version for the requested language
    const runtime = runtimes.find((r: any) => r.language === pistonLanguage);
    if (!runtime) {
      throw new Error(`Runtime not found for language: ${pistonLanguage}`);
    }

    console.log('Using runtime:', runtime.language, runtime.version);

    // Execute code
    const executeResponse = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{
          content: code,
        }],
        stdin: stdin || '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    const result = await executeResponse.json();
    console.log('Execution result:', result);

    return new Response(
      JSON.stringify({
        output: result.run?.output || result.compile?.output || '',
        stderr: result.run?.stderr || result.compile?.stderr || '',
        exitCode: result.run?.code || result.compile?.code || 0,
        executionTime: result.run?.signal || 'N/A',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in execute-code function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
