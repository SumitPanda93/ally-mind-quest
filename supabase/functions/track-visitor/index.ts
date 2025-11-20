import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, page, mentorCategory } = await req.json();
    
    if (!sessionId || !page) {
      throw new Error('sessionId and page are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from auth header if present
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    console.log('Tracking visitor:', { sessionId, page, mentorCategory, userId });

    // Update or insert visitor session
    const { error: sessionError } = await supabase
      .from('visitor_sessions')
      .upsert({
        session_id: sessionId,
        user_id: userId,
        page,
        mentor_category: mentorCategory,
        last_ping: new Date().toISOString(),
      }, {
        onConflict: 'session_id',
        ignoreDuplicates: false
      });

    if (sessionError) {
      console.error('Session tracking error:', sessionError);
    }

    // Log page visit
    const { error: visitError } = await supabase
      .from('page_visits')
      .insert({
        page,
        session_id: sessionId,
        user_id: userId,
      });

    if (visitError) {
      console.error('Page visit tracking error:', visitError);
    }

    // Update daily footfall
    const today = new Date().toISOString().split('T')[0];
    
    // Get unique sessions for today
    const { data: todaySessions } = await supabase
      .from('page_visits')
      .select('session_id')
      .gte('visited_at', `${today}T00:00:00Z`)
      .lt('visited_at', `${today}T23:59:59Z`);

    const uniqueSessions = new Set(todaySessions?.map(s => s.session_id) || []);
    const totalViews = todaySessions?.length || 0;

    await supabase
      .from('daily_footfall')
      .upsert({
        date: today,
        unique_visitors_count: uniqueSessions.size,
        total_page_views: totalViews,
      }, {
        onConflict: 'date',
        ignoreDuplicates: false
      });

    // Update mentor footfall if mentor category provided
    if (mentorCategory) {
      const { data: mentorSessions } = await supabase
        .from('page_visits')
        .select('session_id, page')
        .gte('visited_at', `${today}T00:00:00Z`)
        .like('page', `%${mentorCategory}%`);

      const uniqueMentorSessions = new Set(mentorSessions?.map(s => s.session_id) || []);

      await supabase
        .from('mentor_footfall')
        .upsert({
          date: today,
          mentor_category: mentorCategory,
          unique_visitors: uniqueMentorSessions.size,
          total_visits: mentorSessions?.length || 0,
        }, {
          onConflict: 'date,mentor_category',
          ignoreDuplicates: false
        });
    }

    // Cleanup old sessions
    await supabase.rpc('cleanup_old_sessions');

    // Get current active visitors count
    const { count: activeCount } = await supabase
      .from('visitor_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({ 
        success: true,
        activeVisitors: activeCount || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-visitor function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
