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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_alerts: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean
          job_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          job_id: string
          reason: string
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          job_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_alerts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_legal_files: {
        Row: {
          file_name: string
          file_path: string
          file_type: string
          id: string
          uploaded_at: string
          version: number
        }
        Insert: {
          file_name: string
          file_path: string
          file_type: string
          id?: string
          uploaded_at?: string
          version?: number
        }
        Update: {
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          uploaded_at?: string
          version?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          business_name: string
          client_user_id: string
          created_at: string
          details: string | null
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
        }
        Insert: {
          business_name: string
          client_user_id: string
          created_at?: string
          details?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Update: {
          business_name?: string
          client_user_id?: string
          created_at?: string
          details?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          company_id: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          uploaded_at: string
        }
        Insert: {
          company_id: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          company_id?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          deliverable_type: string
          file_name: string | null
          file_path: string | null
          id: string
          job_id: string
          notes: string | null
          updated_at: string
          website_credentials: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          deliverable_type: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          job_id: string
          notes?: string | null
          updated_at?: string
          website_credentials?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          deliverable_type?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          updated_at?: string
          website_credentials?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          client_user_id: string
          created_at: string
          id: string
          job_id: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          client_user_id: string
          created_at?: string
          id?: string
          job_id: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          client_user_id?: string
          created_at?: string
          id?: string
          job_id?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_documents: {
        Row: {
          doc_type: string
          file_name: string
          file_path: string
          id: string
          job_id: string
          uploaded_at: string
        }
        Insert: {
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          job_id: string
          uploaded_at?: string
        }
        Update: {
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          job_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_messages: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message: string
          sender_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          message: string
          sender_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          message?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string
          id: string
          job_id: string
          provider_user_id: string
          question: string
          status: Database["public"]["Enums"]["question_status"]
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          job_id: string
          provider_user_id: string
          question: string
          status?: Database["public"]["Enums"]["question_status"]
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          job_id?: string
          provider_user_id?: string
          question?: string
          status?: Database["public"]["Enums"]["question_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          army_deposit_amount: number | null
          assigned_at: string | null
          business_category: string
          business_details: string | null
          business_name: string
          client_user_id: string
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          provider_user_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          waiting_approval_at: string | null
        }
        Insert: {
          army_deposit_amount?: number | null
          assigned_at?: string | null
          business_category: string
          business_details?: string | null
          business_name: string
          client_user_id: string
          company_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          provider_user_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          waiting_approval_at?: string | null
        }
        Update: {
          army_deposit_amount?: number | null
          assigned_at?: string | null
          business_category?: string
          business_details?: string | null
          business_name?: string
          client_user_id?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          provider_user_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          waiting_approval_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          details: string | null
          id: string
          job_id: string
          provider_user_id: string
          status: Database["public"]["Enums"]["payment_request_status"]
          title: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          job_id: string
          provider_user_id: string
          status?: Database["public"]["Enums"]["payment_request_status"]
          title: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          job_id?: string
          provider_user_id?: string
          status?: Database["public"]["Enums"]["payment_request_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          id_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id?: string
          id_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          id_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_legal_acceptances: {
        Row: {
          accepted_at: string
          id: string
          legal_file_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          legal_file_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          legal_file_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_legal_acceptances_legal_file_id_fkey"
            columns: ["legal_file_id"]
            isOneToOne: false
            referencedRelation: "admin_legal_files"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_job: {
        Args: { _job_id: string; _provider_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "provider"
      company_status:
        | "draft"
        | "submitted_for_approval"
        | "approved"
        | "rejected"
      dispute_status: "open" | "resolved"
      job_status:
        | "open_in_pool"
        | "in_progress"
        | "waiting_for_client_approval"
        | "done"
        | "closed_by_admin"
      payment_method: "wire" | "credit_card" | "army_deposit"
      payment_request_status: "sent" | "paid_confirmed_by_client"
      question_status: "open" | "answered"
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
      app_role: ["admin", "client", "provider"],
      company_status: [
        "draft",
        "submitted_for_approval",
        "approved",
        "rejected",
      ],
      dispute_status: ["open", "resolved"],
      job_status: [
        "open_in_pool",
        "in_progress",
        "waiting_for_client_approval",
        "done",
        "closed_by_admin",
      ],
      payment_method: ["wire", "credit_card", "army_deposit"],
      payment_request_status: ["sent", "paid_confirmed_by_client"],
      question_status: ["open", "answered"],
    },
  },
} as const
