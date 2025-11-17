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
    const { fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing resume:', fileName);

    // Extract file type and provide targeted analysis
    const fileExt = fileName.toLowerCase().split('.').pop();
    const isPDF = fileExt === 'pdf';
    const isDoc = fileExt === 'doc' || fileExt === 'docx';

    const systemPrompt = `You are an expert resume reviewer specializing in tech industry applications. Provide comprehensive, actionable feedback based on industry best practices for ATS compatibility, technical skills presentation, and professional formatting.`;

    const userPrompt = `Analyze this ${isPDF ? 'PDF' : isDoc ? 'Word document' : 'document'} resume (filename: "${fileName}") and provide expert feedback.

Provide a detailed evaluation in this format:

**OVERALL SCORE**: [Score out of 100 based on filename conventions and best practices]

**FILE FORMAT ASSESSMENT**:
- Evaluate if ${fileExt.toUpperCase()} is ATS-friendly (PDF is best, DOC/DOCX acceptable)
- Comment on filename professionalism (should be: FirstName_LastName_Resume.${fileExt})

**CRITICAL SUCCESS FACTORS**:

**ATS COMPATIBILITY** (Score: X/25):
- Use standard section headings (Summary, Experience, Education, Skills)
- Avoid tables, text boxes, headers/footers, and graphics
- Use standard fonts (Arial, Calibri, Times New Roman) 10-12pt
- Save as PDF to preserve formatting
- Use simple bullet points (•) not fancy symbols

**CONTENT STRUCTURE** (Score: X/25):
- Professional summary/objective (2-3 lines max)
- Experience in reverse chronological order
- Quantifiable achievements (increased X by Y%, reduced Z by N hours)
- Action verbs (Led, Developed, Implemented, Optimized)
- 1-2 pages maximum (1 page for <10 years experience)

**TECHNICAL SKILLS PRESENTATION** (Score: X/25):
- Group by category (Languages, Frameworks, Tools, Cloud, Databases)
- Be specific with versions/proficiency levels
- Match job description keywords
- Include certifications prominently

**PROFESSIONAL FORMATTING** (Score: X/25):
- Consistent date formats (MM/YYYY)
- No personal info (age, photo, marital status, address - just email, phone, LinkedIn)
- No spelling/grammar errors
- Clean white space and margins
- Professional email address

**TOP 5 ACTION ITEMS**:
1. [Specific actionable improvement]
2. [Specific actionable improvement]
3. [Specific actionable improvement]
4. [Specific actionable improvement]
5. [Specific actionable improvement]

**RED FLAGS TO AVOID**:
- Generic objectives ("Seeking a challenging position...")
- Duties instead of achievements
- Too many buzzwords without context
- Employment gaps without explanation
- Unprofessional email addresses

**TECH INDUSTRY SPECIFIC TIPS**:
- GitHub/Portfolio links are valuable
- Side projects demonstrate passion
- Open source contributions count
- Include tech stack for each role
- Certifications boost credibility

Provide practical, encouraging feedback that will improve their job search success.`;

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
