import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, amount, period, riskProfile, income, expenses } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'investment') {
      systemPrompt = `You are an expert financial advisor specializing in investment planning. Provide clear, actionable advice in simple language.`;
      
      userPrompt = `Create an investment recommendation for:
- Investment Amount: ₹${amount}
- Investment Period: ${period} years
- Risk Profile: ${riskProfile}

Provide:
1. Expected annual return percentage
2. Projected value after ${period} years
3. Detailed portfolio allocation (JSON array with type, allocation%, description)
4. Investment advice in 2-3 sentences

Format response as JSON:
{
  "expectedReturn": "10-12%",
  "projectedValue": 150000,
  "portfolio": [
    {"type": "Equity Mutual Funds", "allocation": 40, "description": "Growth-oriented equity funds"},
    {"type": "Fixed Deposits", "allocation": 30, "description": "Stable returns with capital protection"},
    {"type": "Gold/Bonds", "allocation": 30, "description": "Hedge against inflation"}
  ],
  "advice": "Your personalized advice here"
}`;
    } else if (type === 'budget') {
      systemPrompt = `You are a personal finance expert helping users optimize their budgets. Be encouraging and practical.`;
      
      userPrompt = `Analyze this financial situation:
- Monthly Income: ₹${income}
- Monthly Expenses: ₹${expenses}
- Savings: ₹${income - expenses}

Provide:
1. Budget health assessment
2. Savings recommendations
3. Expense optimization tips
4. Emergency fund guidance

Keep response under 200 words, friendly tone.`;
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Try to parse as JSON for investment recommendations
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      // If not JSON, return as text advice
      parsedResponse = { advice: aiResponse };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in financial-advisor function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to get financial advice' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
