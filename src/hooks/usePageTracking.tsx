import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

// Extract mentor category from path
const getMentorCategory = (pathname: string): string | null => {
  if (pathname.includes('/mentor/tech') || pathname.includes('/interview') || pathname.includes('/exam') || pathname.includes('/resume') || pathname.includes('/coding-playground')) {
    return 'tech';
  }
  if (pathname.includes('/mentor/finance') || pathname.includes('/finance/')) {
    return 'finance';
  }
  if (pathname.includes('/mentor/health') || pathname.includes('/health/')) {
    return 'health';
  }
  if (pathname.includes('/mentor/education') || pathname.includes('/education/')) {
    return 'education';
  }
  return null;
};

export const usePageTracking = () => {
  const location = useLocation();
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const trackVisit = async () => {
    const sessionId = getSessionId();
    const page = location.pathname;
    const mentorCategory = getMentorCategory(page);

    try {
      await supabase.functions.invoke('track-visitor', {
        body: { 
          sessionId, 
          page,
          mentorCategory 
        }
      });
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  useEffect(() => {
    // Track initial visit
    trackVisit();

    // Set up heartbeat ping every 30 seconds
    heartbeatInterval.current = setInterval(() => {
      trackVisit();
    }, 30000);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [location.pathname]);
};
