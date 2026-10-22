// Generated from the hosted HAJAPRO Supabase schema.
// Regenerate after database migrations; do not edit table definitions by hand.

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
      app_notifications: {
        Row: {
          body: string
          business_id: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          business_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          role: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          business_type: Database["public"]["Enums"]["business_type"]
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          id: string
          movement_type: string
          note: string | null
          product_id: string
          quantity: number
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          id?: string
          movement_type: string
          note?: string | null
          product_id: string
          quantity: number
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          id?: string
          movement_type?: string
          note?: string | null
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_business_fk"
            columns: ["product_id", "business_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      measurements: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          customer_id: string
          id: string
          label: string
          measurement_values: Json
          notes: string | null
          recorded_at: string
          unit: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          label: string
          measurement_values?: Json
          notes?: string | null
          recorded_at?: string
          unit?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          label?: string
          measurement_values?: Json
          notes?: string | null
          recorded_at?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_customer_business_fk"
            columns: ["customer_id", "business_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          id: string
          note: string | null
          order_id: string
          payment_method: string
          recorded_by: string
          reference: string | null
          status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          payment_method?: string
          recorded_by: string
          reference?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          payment_method?: string
          recorded_by?: string
          reference?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_order_business_fk"
            columns: ["order_id", "business_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          customer_id: string | null
          deposit_amount: number
          description: string | null
          due_date: string | null
          id: string
          order_number: number
          status: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          deposit_amount?: number
          description?: string | null
          due_date?: string | null
          id?: string
          order_number?: never
          status?: string
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          deposit_amount?: number
          description?: string | null
          due_date?: string | null
          id?: string
          order_number?: never
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_business_fk"
            columns: ["customer_id", "business_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          created_by: string
          id: string
          low_stock_threshold: number
          name: string
          sku: string | null
          stock_quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          low_stock_threshold?: number
          name: string
          sku?: string | null
          stock_quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          sku?: string | null
          stock_quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_business: {
        Args: {
          p_name: string
          p_type: Database["public"]["Enums"]["business_type"]
        }
        Returns: string
      }
    }
    Enums: {
      business_role: "owner" | "manager" | "staff"
      business_type: "tailor" | "trading"
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
    Enums: {
      business_role: ["owner", "manager", "staff"],
      business_type: ["tailor", "trading"],
    },
  },
} as const

