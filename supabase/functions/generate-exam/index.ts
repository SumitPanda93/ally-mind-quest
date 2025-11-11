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
    const authHeader = req.headers.get('Authorization')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

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
    let questionsText = data.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    if (questionsText.includes('```json')) {
      questionsText = questionsText.split('```json')[1].split('```')[0].trim();
    } else if (questionsText.includes('```')) {
      questionsText = questionsText.split('```')[1].split('```')[0].trim();
    }
    
    const questions = JSON.parse(questionsText);

    // Create exam record
    const { data: exam, error: examError } = await supabase
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

    if (examError) throw examError;

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

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

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
