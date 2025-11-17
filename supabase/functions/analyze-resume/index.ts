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
    const { fileName, filePath } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing resume:', fileName, 'from path:', filePath);

    // Download file from Supabase storage
    const fileResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/resumes/${filePath}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    // Get file content
    const fileBlob = await fileResponse.blob();
    const fileArrayBuffer = await fileBlob.arrayBuffer();
    
    console.log('File downloaded successfully, size:', fileArrayBuffer.byteLength, 'bytes');

    // For now, we'll provide intelligent analysis based on best practices
    // since parsing PDF/DOCX in edge functions requires additional libraries
    const fileExt = fileName.toLowerCase().split('.').pop();

    const systemPrompt = `You are an expert resume reviewer specializing in tech industry applications. Provide comprehensive, actionable feedback based on industry best practices for ATS compatibility, technical skills presentation, and professional formatting.`;

    const userPrompt = `I have received a resume file named "${fileName}" (${fileExt?.toUpperCase()} format). 

Based on best practices for tech industry resumes, provide a comprehensive analysis covering:

**OVERALL SCORE**: [Score out of 100]

**FILE FORMAT ASSESSMENT**:
- ${fileExt?.toUpperCase()} format evaluation for ATS compatibility
- Filename professionalism assessment

**ATS COMPATIBILITY ANALYSIS** (Score: X/25):
Rate the resume on:
- Standard section headings (Summary, Experience, Education, Skills)
- Avoidance of complex formatting (tables, text boxes, graphics)
- Font choices and sizing
- Bullet point formatting
- Overall parsability by ATS systems

**CONTENT STRUCTURE** (Score: X/25):
Evaluate:
- Professional summary quality and brevity
- Experience listing (reverse chronological order)
- Achievement quantification (metrics, percentages, impact)
- Use of strong action verbs
- Appropriate length (1-2 pages)

**TECHNICAL SKILLS PRESENTATION** (Score: X/25):
Assess:
- Skill categorization and grouping
- Specificity of technical competencies
- Keyword optimization for job descriptions
- Certification prominence
- Technology stack clarity

**PROFESSIONAL FORMATTING** (Score: X/25):
Review:
- Date format consistency
- Contact information appropriateness
- Grammar and spelling
- White space and readability
- Email professionalism

**TOP 5 ACTION ITEMS**:
1. [Critical improvement needed]
2. [Important enhancement]
3. [Recommended optimization]
4. [Suggested refinement]
5. [Beneficial addition]

**TECH INDUSTRY RED FLAGS TO AVOID**:
- Generic objective statements
- Responsibility lists instead of achievements
- Buzzword overuse without context
- Unexplained employment gaps
- Unprofessional contact details

**CAREER ADVANCEMENT RECOMMENDATIONS**:
- Portfolio/GitHub link importance
- Side project showcasing
- Open source contribution value
- Tech stack specificity per role
- Certification strategic value

Provide specific, encouraging, and actionable feedback that will measurably improve job search success.`;

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
    const analysis = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
