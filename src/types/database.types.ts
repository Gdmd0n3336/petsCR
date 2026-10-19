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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      messages: {
        Row: {
          created_at: string
          direction: string
          id: string
          request_id: string
          text_ru: string | null
          text_th: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          request_id: string
          text_ru?: string | null
          text_th?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          request_id?: string
          text_ru?: string | null
          text_th?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age_years: number | null
          created_at: string
          id: string
          name: string
          owner_id: string
          species: string
        }
        Insert: {
          age_years?: number | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          species: string
        }
        Update: {
          age_years?: number | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          species?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          pet_id: string | null
          requested_time: string | null
          service: string
          status: string
          updated_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          pet_id?: string | null
          requested_time?: string | null
          service: string
          status?: string
          updated_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          pet_id?: string | null
          requested_time?: string | null
          service?: string
          status?: string
          updated_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_display: string | null
          created_at: string
          id: string
          is_demo: boolean
          is_published: boolean
          price_paid: number | null
          rating_communication: number | null
          rating_doctors: number | null
          rating_overall: number
          rating_price: number | null
          review_date: string | null
          source: string
          source_url: string | null
          text: string | null
          text_lang: string | null
          venue_id: string
          visit_verified: boolean
        }
        Insert: {
          author_display?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          is_published?: boolean
          price_paid?: number | null
          rating_communication?: number | null
          rating_doctors?: number | null
          rating_overall: number
          rating_price?: number | null
          review_date?: string | null
          source: string
          source_url?: string | null
          text?: string | null
          text_lang?: string | null
          venue_id: string
          visit_verified?: boolean
        }
        Update: {
          author_display?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          is_published?: boolean
          price_paid?: number | null
          rating_communication?: number | null
          rating_doctors?: number | null
          rating_overall?: number
          rating_price?: number | null
          review_date?: string | null
          source?: string
          source_url?: string | null
          text?: string | null
          text_lang?: string | null
          venue_id?: string
          visit_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          language: string
          telegram_id: number | null
        }
        Insert: {
          created_at?: string
          id: string
          language?: string
          telegram_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          telegram_id?: number | null
        }
        Relationships: []
      }
      venue_line_links: {
        Row: {
          created_at: string
          line_user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          line_user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          line_user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_line_links_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_metrics: {
        Row: {
          avg_response_minutes: number | null
          confirmed_rate: number | null
          requests_count: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          avg_response_minutes?: number | null
          confirmed_rate?: number | null
          requests_count?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          avg_response_minutes?: number | null
          confirmed_rate?: number | null
          requests_count?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_metrics_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_services: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          price_from: number | null
          price_source: string | null
          price_to: number | null
          service: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          price_from?: number | null
          price_source?: string | null
          price_to?: number | null
          service: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          price_from?: number | null
          price_source?: string | null
          price_to?: number | null
          service?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_services_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          category: string
          coords_verified_at: string | null
          created_at: string
          district: string | null
          id: string
          is_24_7: boolean
          is_demo: boolean
          is_published: boolean
          languages: string[]
          lat: number | null
          lng: number | null
          name_en: string | null
          name_ru: string | null
          name_th: string | null
          opening_hours: string | null
          osm_id: number | null
          osm_type: string | null
          phone: string | null
          price_visit_from: number | null
          price_visit_to: number | null
          source: string
          source_checked_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          category: string
          coords_verified_at?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_24_7?: boolean
          is_demo?: boolean
          is_published?: boolean
          languages?: string[]
          lat?: number | null
          lng?: number | null
          name_en?: string | null
          name_ru?: string | null
          name_th?: string | null
          opening_hours?: string | null
          osm_id?: number | null
          osm_type?: string | null
          phone?: string | null
          price_visit_from?: number | null
          price_visit_to?: number | null
          source?: string
          source_checked_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string
          coords_verified_at?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_24_7?: boolean
          is_demo?: boolean
          is_published?: boolean
          languages?: string[]
          lat?: number | null
          lng?: number | null
          name_en?: string | null
          name_ru?: string | null
          name_th?: string | null
          opening_hours?: string | null
          osm_id?: number | null
          osm_type?: string | null
          phone?: string | null
          price_visit_from?: number | null
          price_visit_to?: number | null
          source?: string
          source_checked_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      refresh_venue_metrics: { Args: never; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
