import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, language, error, output } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('AI Code Assistant:', { action, language });

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'fix') {
      systemPrompt = `You are an expert code debugger. Analyze the code and error, then provide:
1. The corrected code
2. Explanation of what was wrong
3. Step-by-step fix explanation

Format your response as JSON with keys: correctedCode, explanation, steps (array of strings)`;
      userPrompt = `Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\`

Error:
${error || 'No error provided'}

Fix this code and explain the issue.`;
    } else if (action === 'explain') {
      systemPrompt = `You are a programming teacher. Explain the code in simple terms:
1. What the code does overall
2. Break down each important section
3. Explain the logic flow
4. Describe the expected output

Format your response as JSON with keys: overview, breakdown (array of {line, explanation}), logic, expectedOutput`;
      userPrompt = `Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\`

${output ? `Output:\n${output}\n\n` : ''}

Explain this code in detail.`;
    } else if (action === 'score') {
      systemPrompt = `You are a code quality reviewer. Evaluate the code on:
- Readability (0-100)
- Best practices (0-100)
- Efficiency (0-100)
- Error handling (0-100)
- Overall score (0-100)

Also provide: level (Excellent/Good/Needs Improvement/Poor), suggestions (array of strings), complexity analysis.

Format as JSON with keys: readability, bestPractices, efficiency, errorHandling, overall, level, suggestions, complexity`;
      userPrompt = `Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\`

Score this code and provide improvement suggestions.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      parsedResponse = { raw: aiResponse };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-code-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
