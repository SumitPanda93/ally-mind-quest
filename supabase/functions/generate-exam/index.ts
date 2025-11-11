import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { technology, experienceLevel, difficulty, questionCount = 20 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get JWT token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for server operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    const systemPrompt = `You are an expert technical exam creator specializing in ${technology}.
    Generate ${questionCount} multiple-choice questions for a ${experienceLevel} level candidate.
    Difficulty: ${difficulty}
    
    Follow these rules:
    - Questions should match ${difficulty} difficulty (like Microsoft/SAP certification exams)
    - Each question must have exactly 4 options (A, B, C, D)
    - Only ONE correct answer per question
    - Include detailed explanations for the correct answer
    - Cover diverse topics within ${technology}
    - Questions should test practical knowledge, not just theory
    
    Return ONLY a valid JSON array with this exact structure:
    [
      {
        "question_number": 1,
        "question_text": "Question here?",
        "option_a": "Option A text",
        "option_b": "Option B text",
        "option_c": "Option C text",
        "option_d": "Option D text",
        "correct_answer": "A",
        "explanation": "Detailed explanation why this is correct",
        "topic": "Specific topic area"
      }
    ]`;

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
          { role: 'user', content: `Generate ${questionCount} exam questions for ${technology} at ${experienceLevel} level.` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_questions',
              description: 'Return exam questions in structured format',
              parameters: {
                type: 'object',
                properties: {
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question_number: { type: 'integer' },
                        question_text: { type: 'string' },
                        option_a: { type: 'string' },
                        option_b: { type: 'string' },
                        option_c: { type: 'string' },
                        option_d: { type: 'string' },
                        correct_answer: { type: 'string', enum: ['A','B','C','D','a','b','c','d'] },
                        explanation: { type: 'string' },
                        topic: { type: 'string' }
                      },
                      required: ['question_number','question_text','option_a','option_b','option_c','option_d','correct_answer','explanation','topic'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['questions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_questions' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();

    // Prefer tool calling structured output
    let questions: any[] | null = null;

    try {
      const toolCalls = data?.choices?.[0]?.message?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        const argsStr = toolCalls[0]?.function?.arguments ?? '';
        const parsed = JSON.parse(argsStr);
        questions = parsed.questions;
      }
    } catch (e) {
      console.warn('Tool call parse failed, will try content extraction', e);
    }

    if (!questions) {
      let questionsText = data?.choices?.[0]?.message?.content ?? '';
      const sanitize = (input: string) => {
        let s = input.trim();

        // Remove markdown fences
        s = s.replace(/```json|```/g, '');

        // Replace smart quotes with regular quotes
        s = s.replace(/[\u2018\u2019\u201C\u201D]/g, '"');

        // Remove trailing commas before } or ]
        s = s.replace(/,\s*([}\]])/g, '$1');

        // Attempt to extract the largest JSON array in text
        const match = s.match(/\[\s*{[\s\S]*}\s*\]/);
        if (match) s = match[0];

        return s;
      };

      const text = sanitize(questionsText);
      try {
        questions = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse AI JSON after sanitization', e, { preview: text.slice(0, 500) });
        throw new Error('AI returned invalid JSON for questions');
      }
    }

    if (!Array.isArray(questions)) {
      throw new Error('AI did not return an array of questions');
    }

    // Create exam record
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .insert({
        user_id: user.id,
        technology,
        experience_level: experienceLevel,
        difficulty,
        total_questions: questionCount,
        status: 'in_progress'
      })
      .select()
      .single();

    if (examError) {
      console.error('Exam insert error:', examError);
      throw examError;
    }

    console.log('Exam created:', exam.id);

    // Insert questions
    const questionsToInsert = questions.map((q: any) => ({
      exam_id: exam.id,
      question_number: q.question_number,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer.toUpperCase(),
      explanation: q.explanation,
      topic: q.topic
    }));

    const { error: questionsError } = await supabaseAdmin
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Questions insert error:', questionsError);
      throw questionsError;
    }

    return new Response(
      JSON.stringify({ 
        examId: exam.id,
        questionCount: questions.length,
        message: 'Exam generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-exam function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
