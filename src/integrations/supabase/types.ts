export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          categories: Json | null
          created_at: string | null
          id: string
          month: number
          savings: number | null
          total_expenses: number | null
          total_income: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          id?: string
          month: number
          savings?: number | null
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          id?: string
          month?: number
          savings?: number | null
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          ai_feedback: string | null
          correct_answers: number
          created_at: string | null
          exam_id: string
          id: string
          improvement_areas: Json | null
          incorrect_answers: number
          topic_wise_scores: Json | null
          total_score: number
          unanswered: number | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          correct_answers: number
          created_at?: string | null
          exam_id: string
          id?: string
          improvement_areas?: Json | null
          incorrect_answers: number
          topic_wise_scores?: Json | null
          total_score: number
          unanswered?: number | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          correct_answers?: number
          created_at?: string | null
          exam_id?: string
          id?: string
          improvement_areas?: Json | null
          incorrect_answers?: number
          topic_wise_scores?: Json | null
          total_score?: number
          unanswered?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          completed_at: string | null
          created_at: string | null
          difficulty: string
          experience_level: string
          id: string
          started_at: string | null
          status: string | null
          technology: string
          time_limit_minutes: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          difficulty: string
          experience_level: string
          id?: string
          started_at?: string | null
          status?: string | null
          technology: string
          time_limit_minutes?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string
          experience_level?: string
          id?: string
          started_at?: string | null
          status?: string | null
          technology?: string
          time_limit_minutes?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          budget_id: string | null
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          budget_id?: string | null
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          budget_id?: string | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          goal_type: string
          id: string
          monthly_contribution: number | null
          status: string | null
          target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          goal_type: string
          id?: string
          monthly_contribution?: number | null
          status?: string | null
          target_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          goal_type?: string
          id?: string
          monthly_contribution?: number | null
          status?: string | null
          target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string | null
          expected_return: number | null
          id: string
          investment_type: string
          notes: string | null
          risk_level: string | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expected_return?: number | null
          id?: string
          investment_type: string
          notes?: string | null
          risk_level?: string | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expected_return?: number | null
          id?: string
          investment_type?: string
          notes?: string | null
          risk_level?: string | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          experience_level: string | null
          id: string
          name: string | null
          preferred_difficulty: string | null
          technology: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          experience_level?: string | null
          id?: string
          name?: string | null
          preferred_difficulty?: string | null
          technology?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          experience_level?: string | null
          id?: string
          name?: string | null
          preferred_difficulty?: string | null
          technology?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          exam_id: string
          explanation: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_number: number
          question_text: string
          topic: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          exam_id: string
          explanation?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_number: number
          question_text: string
          topic?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          exam_id?: string
          explanation?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_number?: number
          question_text?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          created_at: string | null
          exam_id: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_answer: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_id: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_answer?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_answer?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_without_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_financial_profiles: {
        Row: {
          age: number | null
          created_at: string | null
          financial_goals: Json | null
          id: string
          monthly_income: number | null
          risk_profile: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          financial_goals?: Json | null
          id?: string
          monthly_income?: number | null
          risk_profile?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string | null
          financial_goals?: Json | null
          id?: string
          monthly_income?: number | null
          risk_profile?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      questions_without_answers: {
        Row: {
          created_at: string | null
          exam_id: string | null
          id: string | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question_number: number | null
          question_text: string | null
          topic: string | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          id?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_number?: number | null
          question_text?: string | null
          topic?: string | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          id?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_number?: number | null
          question_text?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
