export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      deal_transactions: {
        Row: {
          confirmed_at: string | null
          created_at: string
          deal_id: number
          error_message: string | null
          id: string
          status: string
          transaction_signature: string | null
          transaction_type: string
          user_address: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          deal_id: number
          error_message?: string | null
          id?: string
          status?: string
          transaction_signature?: string | null
          transaction_type: string
          user_address: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          deal_id?: number
          error_message?: string | null
          id?: string
          status?: string
          transaction_signature?: string | null
          transaction_type?: string
          user_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_transactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["deal_id"]
          },
        ]
      }
      deals: {
        Row: {
          amount_offered: number
          amount_offered_display: number | null
          amount_requested: number
          amount_requested_display: number | null
          blockchain_synced: boolean | null
          completed_at: string | null
          created_at: string
          deal_id: number
          escrow_bump: number | null
          expiry_timestamp: string
          id: string
          maker_address: string
          platform_fee: number | null
          status: string
          taker_address: string | null
          token_mint_offered: string
          token_mint_requested: string
          token_offered_image: string | null
          token_offered_name: string | null
          token_offered_symbol: string | null
          token_requested_image: string | null
          token_requested_name: string | null
          token_requested_symbol: string | null
          transaction_signature: string | null
          updated_at: string
        }
        Insert: {
          amount_offered: number
          amount_offered_display?: number | null
          amount_requested: number
          amount_requested_display?: number | null
          blockchain_synced?: boolean | null
          completed_at?: string | null
          created_at?: string
          deal_id: number
          escrow_bump?: number | null
          expiry_timestamp: string
          id?: string
          maker_address: string
          platform_fee?: number | null
          status?: string
          taker_address?: string | null
          token_mint_offered: string
          token_mint_requested: string
          token_offered_image?: string | null
          token_offered_name?: string | null
          token_offered_symbol?: string | null
          token_requested_image?: string | null
          token_requested_name?: string | null
          token_requested_symbol?: string | null
          transaction_signature?: string | null
          updated_at?: string
        }
        Update: {
          amount_offered?: number
          amount_offered_display?: number | null
          amount_requested?: number
          amount_requested_display?: number | null
          blockchain_synced?: boolean | null
          completed_at?: string | null
          created_at?: string
          deal_id?: number
          escrow_bump?: number | null
          expiry_timestamp?: string
          id?: string
          maker_address?: string
          platform_fee?: number | null
          status?: string
          taker_address?: string | null
          token_mint_offered?: string
          token_mint_requested?: string
          token_offered_image?: string | null
          token_offered_name?: string | null
          token_offered_symbol?: string | null
          token_requested_image?: string | null
          token_requested_name?: string | null
          token_requested_symbol?: string | null
          transaction_signature?: string | null
          updated_at?: string
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
