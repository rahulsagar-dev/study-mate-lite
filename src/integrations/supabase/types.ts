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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_error_logs: {
        Row: {
          created_at: string
          error_message: string
          function_name: string | null
          id: string
          input_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message: string
          function_name?: string | null
          id?: string
          input_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string
          function_name?: string | null
          id?: string
          input_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          status: string | null
          text_length: number | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          status?: string | null
          text_length?: number | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          status?: string | null
          text_length?: number | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      flashcard_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back_text: string
          created_at: string
          front_text: string
          id: string
          position: number
          set_id: string
        }
        Insert: {
          back_text: string
          created_at?: string
          front_text: string
          id?: string
          position?: number
          set_id: string
        }
        Update: {
          back_text?: string
          created_at?: string
          front_text?: string
          id?: string
          position?: number
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "flashcard_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_history: {
        Row: {
          card_count: number
          created_at: string
          id: string
          input_text: string | null
          output_data: Json | null
          source_filename: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          card_count?: number
          created_at?: string
          id?: string
          input_text?: string | null
          output_data?: Json | null
          source_filename?: string | null
          source_type?: string
          user_id: string
        }
        Update: {
          card_count?: number
          created_at?: string
          id?: string
          input_text?: string | null
          output_data?: Json | null
          source_filename?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          created_at: string
          duration: number
          id: string
          session_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration: number
          id?: string
          session_type: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration?: number
          id?: string
          session_type?: string
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_settings: {
        Row: {
          auto_start_breaks: boolean
          auto_start_pomodoro: boolean
          created_at: string
          id: string
          long_break_duration: number
          short_break_duration: number
          sound_enabled: boolean
          updated_at: string
          user_id: string
          work_duration: number
        }
        Insert: {
          auto_start_breaks?: boolean
          auto_start_pomodoro?: boolean
          created_at?: string
          id?: string
          long_break_duration?: number
          short_break_duration?: number
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
          work_duration?: number
        }
        Update: {
          auto_start_breaks?: boolean
          auto_start_pomodoro?: boolean
          created_at?: string
          id?: string
          long_break_duration?: number
          short_break_duration?: number
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
          work_duration?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          favorite_subjects: string[] | null
          id: string
          streak: number | null
          study_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          favorite_subjects?: string[] | null
          id?: string
          streak?: number | null
          study_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          favorite_subjects?: string[] | null
          id?: string
          streak?: number | null
          study_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          compression_ratio: number | null
          created_at: string
          id: string
          original_text: string
          summary_text: string
          summary_type: string
          title: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          compression_ratio?: number | null
          created_at?: string
          id?: string
          original_text: string
          summary_text: string
          summary_type?: string
          title: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          compression_ratio?: number | null
          created_at?: string
          id?: string
          original_text?: string
          summary_text?: string
          summary_type?: string
          title?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          linked_session_id: string | null
          position: number
          priority: Database["public"]["Enums"]["priority_level"]
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          linked_session_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          linked_session_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      priority_level: "high" | "medium" | "low"
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
    Enums: {
      priority_level: ["high", "medium", "low"],
    },
  },
} as const
