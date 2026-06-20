export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          correct_answer: string[];
          created_at: string;
          exam: Database["public"]["Enums"]["exam_type"];
          id: number;
          is_active: boolean;
          options_json: Json;
          question: string;
          question_type: Database["public"]["Enums"]["question_type"];
          source_id: number | null;
          source_json: Json | null;
          topic: string;
        };
        Insert: {
          correct_answer: string[];
          created_at?: string;
          exam?: Database["public"]["Enums"]["exam_type"];
          id: number;
          is_active?: boolean;
          options_json?: Json;
          question: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          source_id?: number | null;
          source_json?: Json | null;
          topic: string;
        };
        Update: {
          correct_answer?: string[];
          created_at?: string;
          exam?: Database["public"]["Enums"]["exam_type"];
          id?: number;
          is_active?: boolean;
          options_json?: Json;
          question?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          source_id?: number | null;
          source_json?: Json | null;
          topic?: string;
        };
        Relationships: [];
      };
      simulations: {
        Row: {
          created_at: string;
          duration_seconds: number;
          exam: Database["public"]["Enums"]["exam_type"];
          finished_at: string | null;
          id: string;
          mode: Database["public"]["Enums"]["simulation_mode"];
          score_percent: number;
          status: Database["public"]["Enums"]["simulation_status"];
          topic_filter: string[] | null;
          total_correct: number;
          total_questions: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number;
          exam?: Database["public"]["Enums"]["exam_type"];
          finished_at?: string | null;
          id?: string;
          mode: Database["public"]["Enums"]["simulation_mode"];
          score_percent?: number;
          status?: Database["public"]["Enums"]["simulation_status"];
          topic_filter?: string[] | null;
          total_correct?: number;
          total_questions: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number;
          exam?: Database["public"]["Enums"]["exam_type"];
          finished_at?: string | null;
          id?: string;
          mode?: Database["public"]["Enums"]["simulation_mode"];
          score_percent?: number;
          status?: Database["public"]["Enums"]["simulation_status"];
          topic_filter?: string[] | null;
          total_correct?: number;
          total_questions?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      simulation_questions: {
        Row: {
          correct_answer: string[];
          id: number;
          is_correct: boolean | null;
          position: number;
          question_id: number;
          selected_answer: string[];
          simulation_id: string;
          topic: string;
        };
        Insert: {
          correct_answer: string[];
          id?: number;
          is_correct?: boolean | null;
          position: number;
          question_id: number;
          selected_answer?: string[];
          simulation_id: string;
          topic: string;
        };
        Update: {
          correct_answer?: string[];
          id?: number;
          is_correct?: boolean | null;
          position?: number;
          question_id?: number;
          selected_answer?: string[];
          simulation_id?: string;
          topic?: string;
        };
        Relationships: [];
      };
      user_question_stats: {
        Row: {
          id: number;
          last_seen_at: string | null;
          question_id: number;
          status: Database["public"]["Enums"]["question_status"];
          times_correct: number;
          times_seen: number;
          times_wrong: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: number;
          last_seen_at?: string | null;
          question_id: number;
          status?: Database["public"]["Enums"]["question_status"];
          times_correct?: number;
          times_seen?: number;
          times_wrong?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: number;
          last_seen_at?: string | null;
          question_id?: number;
          status?: Database["public"]["Enums"]["question_status"];
          times_correct?: number;
          times_seen?: number;
          times_wrong?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      exam_type: "csa" | "cad" | "cis_df";
      question_type: "single_choice" | "multi_select" | "drag_and_drop";
      question_status: "not_seen" | "wrong" | "correct";
      simulation_mode: "balanced" | "review_errors" | "random";
      simulation_status: "in_progress" | "completed";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type PublicSchema = Database["public"];

export type TableRow<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TableInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TableUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

