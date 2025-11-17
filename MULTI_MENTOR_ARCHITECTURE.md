# 🎯 MENTOR Platform - Multi-Mentor Architecture Plan

## Executive Summary

This document outlines the complete architectural plan for transforming the TechMock Mentor application into the **MENTOR** platform - a multi-domain AI-guided mentorship ecosystem covering Tech, Finance, Health, and Education.

---

## ✅ Phase 1: Foundation & Security (COMPLETED)

### 1.1 Security Fixes ✓
- ✅ Created `user_roles` table with proper RBAC
- ✅ Implemented `has_role()` SECURITY DEFINER function
- ✅ Fixed admin privilege escalation vulnerability
- ✅ Created `questions_without_answers` view to prevent exam answer exposure
- ✅ Added input validation constraints on database level
- ✅ Updated AdminDashboard to use secure role checking
- ✅ Updated ExamTaking to use secure questions view

### 1.2 Branding & Design System ✓
- ✅ Updated color scheme to MENTOR brand colors:
  - Primary: Deep Blue (#1A2A6C) - Trust
  - Secondary: Electric Purple (#6A0572) - Intelligence  
  - Accent: Aqua (#00E0FF) - Innovation
- ✅ Added Poppins (headings) and Inter (body) fonts
- ✅ Created new gradients and shadows in design system
- ✅ Updated meta tags and branding in index.html

---

## 📋 Phase 2: Database Schema for Multi-Mentor System

### 2.1 Core Tables to Create

#### `mentor_categories` Table
```sql
CREATE TABLE public.mentor_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- 'tech', 'finance', 'health', 'education'
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    color_primary TEXT, -- HSL color for mentor theme
    color_secondary TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `mentor_sessions` Table
```sql
CREATE TABLE public.mentor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES mentor_categories(id) NOT NULL,
    session_type TEXT NOT NULL, -- 'chat', 'exam', 'assessment', 'analysis'
    title TEXT,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    metadata JSONB, -- Store session-specific data
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `user_progress` Table (Gamification)
```sql
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES mentor_categories(id),
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, category_id)
);
```

#### `user_badges` Table
```sql
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT NOT NULL, -- 'first_session', 'streak_7', 'master_tech', etc.
    category_id UUID REFERENCES mentor_categories(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB
);
```

#### `subscription_plans` Table
```sql
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT UNIQUE NOT NULL, -- 'free', 'pro', 'premium'
    display_name TEXT NOT NULL,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB, -- List of features as JSON array
    limits JSONB, -- Session limits, exam limits, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `user_subscriptions` Table
```sql
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    payment_provider TEXT, -- 'stripe', 'manual', etc.
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 2.2 Existing Tables to Enhance

#### Update `exams` Table
```sql
ALTER TABLE public.exams
ADD COLUMN category_id UUID REFERENCES mentor_categories(id),
ADD COLUMN session_id UUID REFERENCES mentor_sessions(id);

-- Backfill existing exams with 'tech' category
UPDATE public.exams 
SET category_id = (SELECT id FROM mentor_categories WHERE slug = 'tech' LIMIT 1);
```

#### Update `profiles` Table
```sql
ALTER TABLE public.profiles
ADD COLUMN subscription_plan TEXT DEFAULT 'free',
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN preferred_categories TEXT[], -- Array of mentor slugs
ADD COLUMN dark_mode_enabled BOOLEAN DEFAULT false;
```

---

## 🎨 Phase 3: Frontend Architecture

### 3.1 New Route Structure

```
/                          → Landing page (multi-mentor showcase)
/auth                      → Login/Signup
/dashboard                 → Unified user dashboard (all mentors)

/mentors/tech              → Tech Mentor landing
/mentors/tech/chat         → Tech chat interface
/mentors/tech/exams        → Tech exam selection
/mentors/tech/interview    → Mock interview (existing)
/mentors/tech/resume       → Resume analysis (existing)

/mentors/finance           → Finance Mentor landing
/mentors/finance/chat      → Financial guidance chat
/mentors/finance/planner   → Budget & investment planner
/mentors/finance/analyzer  → Risk analysis tool

/mentors/health            → Health Mentor landing
/mentors/health/chat       → Wellness guidance
/mentors/health/planner    → Habit & wellness planner
/mentors/health/tracker    → Health metrics tracking

/mentors/education         → Education Mentor landing
/mentors/education/chat    → Concept explanation
/mentors/education/planner → Study schedule generator
/mentors/education/quiz    → Subject-wise quizzes

/exam/:examId              → Exam taking (existing)
/exam-results/:examId      → Results (existing)
/admin                     → Admin dashboard (existing)
/settings                  → User settings & preferences
/pricing                   → Subscription plans
```

### 3.2 Component Architecture

#### New Components to Create

1. **`MentorCard.tsx`** - Reusable mentor category card
2. **`UnifiedDashboard.tsx`** - Main dashboard showing all mentor progress
3. **`MentorLanding.tsx`** - Generic mentor landing template
4. **`ChatInterface.tsx`** - Reusable AI chat component for all mentors
5. **`ProgressTracker.tsx`** - Gamification progress display
6. **`BadgeDisplay.tsx`** - Badge collection UI
7. **`SubscriptionManager.tsx`** - Plan selection and management
8. **`DailyInsights.tsx`** - Daily tips widget
9. **`FinancePlanner.tsx`** - Finance-specific tools
10. **`HealthPlanner.tsx`** - Health-specific tools
11. **`StudyPlanner.tsx`** - Education-specific tools

### 3.3 Shared Services/Hooks

```typescript
// hooks/useMentorChat.ts - Generic chat hook for all mentors
// hooks/useUserProgress.ts - Gamification progress tracking
// hooks/useSubscription.ts - Subscription status management
// hooks/useDailyInsights.ts - Daily tips fetching
// services/gamificationService.ts - XP, badges, streaks logic
// services/subscriptionService.ts - Plan features checking
```

---

## 🔌 Phase 4: Backend Architecture (Edge Functions)

### 4.1 New Edge Functions to Create

#### 1. `chat-mentor` (Generic Chat Function)
```typescript
// Handles chat for all mentor categories
// Input: { category: 'tech' | 'finance' | 'health' | 'education', messages: [] }
// Uses different system prompts per category
```

#### 2. `finance-analyzer`
```typescript
// Analyzes user's financial goals and provides recommendations
// Input: { income, expenses, goals, risk_tolerance }
// Output: { analysis, recommendations, asset_allocation }
```

#### 3. `health-analyzer`
```typescript
// Provides wellness recommendations (NOT medical advice)
// Input: { lifestyle_data, goals }
// Output: { recommendations, habit_suggestions }
```

#### 4. `study-planner`
```typescript
// Generates study schedules based on exams
// Input: { exam_date, subjects, current_level }
// Output: { schedule, milestones, daily_tasks }
```

#### 5. `calculate-progress`
```typescript
// Updates user XP, levels, badges
// Input: { user_id, activity_type, category_id }
// Output: { new_xp, level_up, badges_earned }
```

#### 6. `daily-insights`
```typescript
// Generates personalized daily tips
// Input: { user_id, categories }
// Output: { insights: [{ category, tip, action }] }
```

### 4.2 Enhanced Existing Edge Functions

#### Update `generate-exam`
- Add category_id parameter
- Support multiple exam types (tech, education)
- Link to mentor_sessions

#### Update `tech-interview`
- Add session tracking
- Link to mentor_sessions
- Add user activity logging for gamification

---

## 🎮 Phase 5: Gamification System

### 5.1 XP Point System

| Activity | XP Points |
|----------|-----------|
| Complete exam | 100 XP |
| Daily login | 10 XP |
| Chat session (>5 messages) | 25 XP |
| Complete assessment | 75 XP |
| 7-day streak | 200 XP bonus |
| Perfect exam score | 150 XP bonus |

### 5.2 Badge System

**Tech Mentor Badges:**
- 🎓 First Interview - Complete first mock interview
- 🏆 Tech Master - Score 90%+ on 5 exams
- 🔥 Coding Streak - 30-day streak
- 💼 Interview Pro - Complete 20 interviews

**Finance Mentor Badges:**
- 💰 Financial Planner - Create first budget
- 📈 Investment Guru - Complete risk analysis
- 💎 Savings Champion - Track savings for 30 days

**Health Mentor Badges:**
- 🏃 Wellness Warrior - 7-day health streak
- 🥗 Healthy Habits - Complete 10 daily check-ins
- 🧘 Mindfulness Master - 30 wellness sessions

**Education Mentor Badges:**
- 📚 Study Master - Complete study plan
- 🎯 Quiz Champion - 10 perfect quiz scores
- 🌟 Learning Streak - 15-day study streak

### 5.3 Leveling System

- Level 1-5: Beginner (0-500 XP)
- Level 6-10: Intermediate (501-1500 XP)
- Level 11-15: Advanced (1501-3000 XP)
- Level 16-20: Expert (3001-5000 XP)
- Level 21+: Master (5000+ XP)

---

## 💰 Phase 6: Subscription Model

### 6.1 Plan Tiers

#### Free Plan
- 5 AI chat sessions/month (across all mentors)
- 2 exams/month
- 1 assessment/month
- Basic progress tracking
- No resume analysis
- Ads displayed

#### Pro Plan ($19.99/month)
- 50 AI chat sessions/month
- 10 exams/month
- 5 assessments/month
- Full progress tracking
- 2 resume analyses/month
- Priority AI responses
- No ads

#### Premium Plan ($39.99/month)
- Unlimited AI chat sessions
- Unlimited exams
- Unlimited assessments
- Advanced analytics
- Unlimited resume analyses
- Personalized coaching
- API access
- Early feature access
- No ads

### 6.2 Feature Gating Logic
```typescript
// Example feature check
async function canAccessFeature(userId: string, feature: string) {
  const subscription = await getUserSubscription(userId);
  const limits = await getUsageThisMonth(userId);
  
  switch (subscription.plan) {
    case 'free':
      if (feature === 'chat' && limits.chatSessions >= 5) return false;
      if (feature === 'exam' && limits.exams >= 2) return false;
      return true;
    case 'pro':
      if (feature === 'chat' && limits.chatSessions >= 50) return false;
      return true;
    case 'premium':
      return true; // Unlimited
  }
}
```

---

## 🚀 Phase 7: Implementation Roadmap

### Sprint 1: Core Infrastructure (Week 1-2)
- ✅ Security fixes (COMPLETED)
- ✅ Design system rebrand (COMPLETED)
- Create mentor_categories table and seed data
- Create subscription_plans table and seed data
- Build unified dashboard structure
- Create MentorCard component

### Sprint 2: Tech Mentor Enhancement (Week 3-4)
- Refactor existing tech features into new structure
- Add category_id to exams
- Create chat-mentor edge function
- Update routing to /mentors/tech/*
- Add session tracking

### Sprint 3: Finance Mentor (Week 5-6)
- Create Finance mentor landing page
- Build FinancePlanner component
- Create finance-analyzer edge function
- Add budget planning UI
- Create financial insights chat

### Sprint 4: Health Mentor (Week 7-8)
- Create Health mentor landing page
- Build HealthPlanner component
- Create health-analyzer edge function
- Add habit tracking UI
- Create wellness chat

### Sprint 5: Education Mentor (Week 9-10)
- Create Education mentor landing page
- Build StudyPlanner component
- Create study-planner edge function
- Add quiz generation
- Create concept explanation chat

### Sprint 6: Gamification (Week 11-12)
- Implement XP system
- Create badge display
- Add streak tracking
- Build leaderboard
- Create progress visualizations

### Sprint 7: Subscription System (Week 13-14)
- Build subscription UI
- Integrate payment provider (Stripe)
- Implement feature gating
- Add usage tracking
- Create admin subscription management

### Sprint 8: Polish & Launch (Week 15-16)
- Performance optimization
- Mobile responsiveness
- SEO optimization
- User testing
- Bug fixes
- Launch preparation

---

## 🎯 Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Session duration per mentor category
- Completion rate of assessments
- Chat message volume

### Conversion Metrics
- Free → Pro conversion rate
- Pro → Premium upgrade rate
- Churn rate
- Customer Lifetime Value (CLV)

### Quality Metrics
- User satisfaction score
- Net Promoter Score (NPS)
- Feature usage distribution
- Bug report rate

---

## 🔐 Security Considerations

### Already Implemented ✓
- ✅ Proper RBAC with user_roles table
- ✅ RLS policies on all tables
- ✅ Server-side validation
- ✅ Secure admin access
- ✅ Protected exam answers

### Still Required
- ⚠️ Input validation with zod (client + server)
- ⚠️ Rate limiting per user on edge functions
- ⚠️ API key rotation strategy
- ⚠️ Audit logging for sensitive operations
- ⚠️ Payment data encryption
- ⚠️ GDPR compliance features

---

## 📊 Technical Stack Summary

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS (MENTOR design system)
- React Router for navigation
- Tanstack Query for data fetching
- Poppins & Inter fonts

**Backend:**
- Supabase (via Lovable Cloud)
- PostgreSQL database
- Edge Functions (Deno)
- Row Level Security (RLS)

**AI Layer:**
- Lovable AI (google/gemini-2.5-flash default)
- Multi-model support

**Authentication:**
- Supabase Auth
- Email/password + Google OAuth

**Payments:**
- Stripe integration (planned)

**Hosting:**
- Lovable Cloud deployment
- Custom domain support

---

## 📝 Next Immediate Steps

1. **Review and Approve Architecture** - Get stakeholder approval on this plan
2. **Create Mentor Categories Migration** - Set up the 4 mentor categories in database
3. **Seed Subscription Plans** - Add free/pro/premium plans to database
4. **Update Landing Page** - Transform Index.tsx to showcase all 4 mentors
5. **Build Unified Dashboard** - Create the main user dashboard
6. **Begin Sprint 1** - Start core infrastructure work

---

## 💡 Future Expansion Ideas

### Additional Mentor Categories (Phase 9+)
- Career Mentor - Job search, resume building, career transitions
- Legal Mentor - Basic legal guidance and document review
- Parenting Mentor - Parenting advice and child development
- Relationship Mentor - Communication and relationship guidance
- Business Mentor - Entrepreneurship and business strategy

### Advanced Features
- Voice chat with mentors
- Video analysis for interviews
- Peer-to-peer mentoring marketplace
- Corporate/team subscriptions
- White-label solutions for enterprises
- Mobile app (React Native)
- API for third-party integrations

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-17  
**Status:** READY FOR IMPLEMENTATION
