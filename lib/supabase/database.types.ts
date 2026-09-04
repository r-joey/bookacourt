export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      booking_slots: {
        Row: {
          booking_id: string
          court_id: string
          ends_at: string
          id: string
          price: number
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          venue_id: string
        }
        Insert: {
          booking_id: string
          court_id: string
          ends_at: string
          id?: string
          price?: number
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          venue_id: string
        }
        Update: {
          booking_id?: string
          court_id?: string
          ends_at?: string
          id?: string
          price?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_slots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_slots_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_slots_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string
          booking_date: string
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          hold_expires_at: string | null
          id: string
          notes: string | null
          payment_method_id: string | null
          payment_proof_url: string | null
          source: Database["public"]["Enums"]["booking_source"]
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          booking_code?: string
          booking_date: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          hold_expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method_id?: string | null
          payment_proof_url?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          booking_code?: string
          booking_date?: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          hold_expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method_id?: string | null
          payment_proof_url?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      court_creation_events: {
        Row: {
          court_id: string | null
          court_name: string | null
          created_at: string
          id: string
          tenant_id: string
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          court_id?: string | null
          court_name?: string | null
          created_at?: string
          id?: string
          tenant_id: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          court_id?: string | null
          court_name?: string | null
          created_at?: string
          id?: string
          tenant_id?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_creation_events_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_creation_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_creation_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          created_at: string
          deleted_at: string | null
          hourly_price: number
          id: string
          is_active: boolean
          name: string
          sort_order: number
          sport: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          hourly_price?: number
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          sport?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          hourly_price?: number
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          sport?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          court_count: number
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          paid_at: string | null
          period_end: string
          period_start: string
          proof_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          submitted_at: string | null
          tenant_id: string
          unit_price: number
        }
        Insert: {
          amount?: number
          court_count?: number
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          paid_at?: string | null
          period_end: string
          period_start: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          submitted_at?: string | null
          tenant_id: string
          unit_price?: number
        }
        Update: {
          amount?: number
          court_count?: number
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          submitted_at?: string | null
          tenant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          created_at: string
          id: string
          is_active: boolean
          label: string
          note: string | null
          qr_url: string | null
          sort_order: number
          venue_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          note?: string | null
          qr_url?: string | null
          sort_order?: number
          venue_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          note?: string | null
          qr_url?: string | null
          sort_order?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          currency: string
          id: boolean
          invoice_grace_days: number
          payment_account_name: string | null
          payment_account_number: string | null
          payment_label: string | null
          payment_note: string | null
          payment_qr_url: string | null
          price_per_court: number
          updated_at: string
        }
        Insert: {
          currency?: string
          id?: boolean
          invoice_grace_days?: number
          payment_account_name?: string | null
          payment_account_number?: string | null
          payment_label?: string | null
          payment_note?: string | null
          payment_qr_url?: string | null
          price_per_court?: number
          updated_at?: string
        }
        Update: {
          currency?: string
          id?: boolean
          invoice_grace_days?: number
          payment_account_name?: string | null
          payment_account_number?: string | null
          payment_label?: string | null
          payment_note?: string | null
          payment_qr_url?: string | null
          price_per_court?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_start_date: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean
          next_invoice_date: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          billing_start_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean
          next_invoice_date?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          billing_start_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          next_invoice_date?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      venue_hours: {
        Row: {
          closes: string
          id: string
          is_closed: boolean
          opens: string
          venue_id: string
          weekday: number
        }
        Insert: {
          closes?: string
          id?: string
          is_closed?: boolean
          opens?: string
          venue_id: string
          weekday: number
        }
        Update: {
          closes?: string
          id?: string
          is_closed?: boolean
          opens?: string
          venue_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "venue_hours_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_staff: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_staff_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          amenities: string[]
          banner_urls: string[]
          contact_number: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          is_published: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          slug: string
          sport: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          banner_urls?: string[]
          contact_number?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          slug: string
          sport?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[]
          banner_urls?: string[]
          contact_number?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          slug?: string
          sport?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_generate_invoices: { Args: Record<string, never>; Returns: number }
      attach_payment_proof: {
        Args: {
          p_booking_id: string
          p_payment_method_id: string
          p_proof_url: string
        }
        Returns: undefined
      }
      cancel_online_booking: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      create_online_booking: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_date: string
          p_slots: Json
          p_venue_id: string
        }
        Returns: Json
      }
      create_walkin_booking: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_date: string
          p_slots: Json
          p_venue_id: string
        }
        Returns: Json
      }
      expire_stale_holds: { Args: Record<string, never>; Returns: number }
      find_booking: {
        Args: { p_code: string; p_contact: string }
        Returns: Json
      }
      generate_booking_code: { Args: Record<string, never>; Returns: string }
      generate_due_invoices: { Args: Record<string, never>; Returns: number }
      generate_venue_slug: { Args: { p_name: string }; Returns: string }
      get_availability: {
        Args: { p_date: string; p_venue_id: string }
        Returns: {
          court_id: string
          hour: number
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      is_platform_admin: { Args: Record<string, never>; Returns: boolean }
      is_venue_member: { Args: { p_venue_id: string }; Returns: boolean }
      submit_invoice_payment: {
        Args: { p_invoice_id: string; p_proof_url: string }
        Returns: undefined
      }
    }
    Enums: {
      booking_source: "online" | "walkin"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "cancelled"
        | "expired"
        | "completed"
      invoice_status: "pending" | "paid" | "void" | "submitted" | "overdue"
      user_role: "platform_admin" | "tenant" | "staff"
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

export const Constants = {
  public: {
    Enums: {
      booking_source: ["online", "walkin"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "cancelled",
        "expired",
        "completed",
      ],
      invoice_status: ["pending", "paid", "void", "submitted", "overdue"],
      user_role: ["platform_admin", "tenant", "staff"],
    },
  },
} as const

// ---- Domain aliases ----
export type Venue = Tables<"venues">
export type Court = Tables<"courts">
export type Booking = Tables<"bookings">
export type BookingSlot = Tables<"booking_slots">
export type PaymentMethod = Tables<"payment_methods">
export type VenueHours = Tables<"venue_hours">
export type Profile = Tables<"profiles">
export type Invoice = Tables<"invoices">
export type BookingStatus = Enums<"booking_status">
export type UserRole = Enums<"user_role">
