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
    const { examId } = await req.json();
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

    // Get exam details
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (examError) throw examError;

    // Get all questions
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_number');

    if (questionsError) throw questionsError;

    // Get user answers
    const { data: userAnswers, error: answersError } = await supabaseAdmin
      .from('user_answers')
      .select('*')
      .eq('exam_id', examId);

    if (answersError) throw answersError;

    // Calculate scores
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const topicScores: { [key: string]: { correct: number; total: number } } = {};

    questions.forEach((question: any) => {
      const answer = userAnswers.find((a: any) => a.question_id === question.id);
      const topic = question.topic || 'General';
      
      if (!topicScores[topic]) {
        topicScores[topic] = { correct: 0, total: 0 };
      }
      topicScores[topic].total++;

      if (!answer?.selected_answer) {
        unansweredCount++;
      } else if (answer.selected_answer === question.correct_answer) {
        correctCount++;
        topicScores[topic].correct++;
      } else {
        incorrectCount++;
      }
    });

    const totalScore = ((correctCount / questions.length) * 100).toFixed(2);

    // Generate AI feedback
    const performanceSummary = `
    Technology: ${exam.technology}
    Experience Level: ${exam.experience_level}
    Difficulty: ${exam.difficulty}
    Score: ${totalScore}%
    Correct: ${correctCount}/${questions.length}
    Incorrect: ${incorrectCount}
    Unanswered: ${unansweredCount}
    Topic Scores: ${JSON.stringify(topicScores)}
    `;

    const systemPrompt = `You are an expert technical mentor providing detailed feedback on exam performance.
    Analyze the results and provide:
    1. Overall performance assessment
    2. Strengths identified
    3. Specific areas for improvement
    4. Recommended study topics
    5. Next steps and learning resources
    
    Be encouraging but honest. Focus on actionable advice.`;

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
          { role: 'user', content: `Provide detailed feedback for this exam result:\n${performanceSummary}` }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      // Continue without AI feedback
    }

    let aiFeedback = 'Great job completing the exam!';
    if (response.ok) {
      const data = await response.json();
      aiFeedback = data.choices[0].message.content;
    }

    // Calculate improvement areas
    const improvementAreas = Object.entries(topicScores)
      .filter(([_, scores]) => (scores.correct / scores.total) < 0.7)
      .map(([topic, scores]) => ({
        topic,
        accuracy: ((scores.correct / scores.total) * 100).toFixed(1),
        questionsCount: scores.total
      }));

    // Save results
    const { data: result, error: resultError } = await supabaseAdmin
      .from('exam_results')
      .insert({
        exam_id: examId,
        user_id: user.id,
        total_score: parseFloat(totalScore),
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        unanswered: unansweredCount,
        topic_wise_scores: topicScores,
        ai_feedback: aiFeedback,
        improvement_areas: improvementAreas
      })
      .select()
      .single();

    if (resultError) throw resultError;

    // Update exam status
    await supabaseAdmin
      .from('exams')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', examId);

    return new Response(
      JSON.stringify({ 
        result,
        message: 'Exam evaluated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in evaluate-exam function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
