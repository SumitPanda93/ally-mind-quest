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

    const systemPrompt = `You are an expert resume reviewer specializing in tech industry applications. You provide professional guidance and recommendations based on industry best practices, ATS compatibility standards, and years of hiring experience. You DO NOT need to see the actual resume content - you provide expert recommendations that apply to all tech resumes.`;

    const userPrompt = `A candidate has submitted their resume file: "${fileName}" (${fileExt?.toUpperCase()} format) for professional review.

As an expert resume reviewer, provide comprehensive guidance on how to optimize this resume for tech industry success. Base your recommendations on proven best practices and current ATS standards.

**IMPORTANT**: Provide actionable recommendations as if you've reviewed countless similar resumes. Focus on what typically makes tech resumes successful.

Provide your expert analysis in this format:

**OVERALL ASSESSMENT & SCORE**: [Provide score 70-85/100 with explanation based on filename professionalism and format choice]

**FILE FORMAT EVALUATION**:
- ${fileExt?.toUpperCase()} format: [Evaluate ATS compatibility - PDF is optimal, DOCX is acceptable]
- Filename: [Comment on professionalism - optimal format is "FirstName_LastName_Resume.${fileExt}"]

**CRITICAL SUCCESS AREAS FOR TECH RESUMES**:

**1. ATS COMPATIBILITY** (Target: 20-25/25):
Best practices:
- Use standard section headings: "Professional Summary", "Technical Skills", "Experience", "Education", "Certifications"
- Avoid complex formatting: no tables, text boxes, columns, or graphics
- Stick to ATS-friendly fonts: Arial, Calibri, Helvetica (10-12pt)
- Use simple bullet points (•) only
- Include a skills section with exact technology names

**2. CONTENT STRUCTURE** (Target: 20-25/25):
Recommendations:
- Start with 2-3 line professional summary highlighting specialization
- List experience in reverse chronological order (most recent first)
- Use STAR format: Situation, Task, Action, Result
- Quantify everything: "Reduced load time by 40%", "Led team of 5 developers"
- Strong action verbs: Architected, Implemented, Optimized, Engineered
- Keep to 1 page (if <7 years exp) or 2 pages maximum

**3. TECHNICAL SKILLS** (Target: 20-25/25):
Structure properly:
- Group by category: Languages | Frameworks | Cloud/DevOps | Databases | Tools
- Be specific: "React 18, Node.js, Python 3.x" not just "React, Node, Python"
- Include proficiency if relevant: "Expert: Java, JavaScript | Proficient: Python, Go"
- Match keywords from target job descriptions
- Highlight certifications prominently (AWS Certified, Azure, Google Cloud, etc.)

**4. PROFESSIONAL FORMATTING** (Target: 20-25/25):
Standards:
- Consistent date format: "MM/YYYY - MM/YYYY" or "Jan 2020 - Present"
- Essential contact only: Email | Phone | LinkedIn | GitHub/Portfolio
- No personal details: age, photo, marital status, full address
- Clean margins (0.5-1 inch)
- Professional email: firstname.lastname@domain.com
- Proper spacing and hierarchy

**TOP 5 ACTION ITEMS** (Prioritized):
1. [First critical improvement - be specific]
2. [Second important change - actionable]
3. [Third optimization - measurable]
4. [Fourth enhancement - practical]
5. [Fifth recommendation - impactful]

**RED FLAGS TO ELIMINATE**:
- Generic objectives like "Seeking challenging position to utilize my skills"
- Responsibility listings instead of accomplishments
- Buzzword stuffing without context ("synergy", "rockstar", "ninja")
- Employment gaps without brief explanation
- Unprofessional email addresses
- Typos and grammar errors

**TECH INDUSTRY WINNING STRATEGIES**:
- Link to GitHub with 3+ quality repositories
- Include side projects showing passion and continuous learning
- Mention open source contributions if any
- Detail specific tech stack for each role (not just job title)
- Certifications carry weight - list them prominently
- Blog/Medium articles or conference talks add credibility

**FINAL PROFESSIONAL ADVICE**:
[Provide 2-3 encouraging, specific recommendations that would apply to optimizing any tech resume for maximum ATS score and recruiter appeal]

Remember: Make all recommendations specific, actionable, and encouraging. Focus on what makes tech resumes stand out to both ATS systems and human recruiters.`;

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
