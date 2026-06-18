// Hand-written to match /supabase/migrations/0001_init.sql.
// Regenerate with: npx supabase gen types typescript --project-id <id> > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrderStatus =
  | 'created'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type UserRole = 'customer' | 'admin'

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country: string
  full_name: string
  phone: string
  contact_email?: string
}

export interface Database {
  public: {
    Tables: {
      visitor_logs: {
        Row: {
          id: number
          request_id: string | null
          ip: string | null
          country: string | null
          city: string | null
          pathname: string | null
          user_agent: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          request_id?: string | null
          ip?: string | null
          country?: string | null
          city?: string | null
          pathname?: string | null
          user_agent?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          request_id?: string | null
          ip?: string | null
          country?: string | null
          city?: string | null
          pathname?: string | null
          user_agent?: string | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          email: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          email?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          email?: string | null
          role?: UserRole
          created_at?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          phone: string | null
          contact_email: string | null
          line1: string
          line2: string | null
          city: string
          state: string
          pincode: string
          country: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          phone?: string | null
          contact_email?: string | null
          line1: string
          line2?: string | null
          city: string
          state: string
          pincode: string
          country?: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          phone?: string | null
          contact_email?: string | null
          line1?: string
          line2?: string | null
          city?: string
          state?: string
          pincode?: string
          country?: string
          is_default?: boolean
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          price_paise: number
          images: Json
          video_url: string | null
          video_position: number | null
          stock: number
          is_active: boolean
          is_bestseller: boolean
          bestseller_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          price_paise: number
          images?: Json
          video_url?: string | null
          video_position?: number | null
          stock?: number
          is_active?: boolean
          is_bestseller?: boolean
          bestseller_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          price_paise?: number
          images?: Json
          video_url?: string | null
          video_position?: number | null
          stock?: number
          is_active?: boolean
          is_bestseller?: boolean
          bestseller_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_percent: number
          min_order_paise: number | null
          max_discount_paise: number | null
          usage_limit: number | null
          banner_color: string | null
          free_shipping: boolean
          starts_at: string
          ends_at: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_percent: number
          min_order_paise?: number | null
          max_discount_paise?: number | null
          usage_limit?: number | null
          banner_color?: string | null
          free_shipping?: boolean
          starts_at: string
          ends_at: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_percent?: number
          min_order_paise?: number | null
          max_discount_paise?: number | null
          usage_limit?: number | null
          banner_color?: string | null
          free_shipping?: boolean
          starts_at?: string
          ends_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          cover_image_url: string | null
          video_url: string | null
          image_position: 'top' | 'center' | 'bottom' | 'left' | 'right'
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          cover_image_url?: string | null
          video_url?: string | null
          image_position?: 'top' | 'center' | 'bottom' | 'left' | 'right'
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          cover_image_url?: string | null
          video_url?: string | null
          image_position?: 'top' | 'center' | 'bottom' | 'left' | 'right'
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_photos: {
        Row: {
          id: string
          url: string
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          message: string
          is_read: boolean
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          message: string
          is_read?: boolean
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          message?: string
          is_read?: boolean
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      product_series: {
        Row: {
          product_id: string
          series_id: string
          display_order: number
        }
        Insert: {
          product_id: string
          series_id: string
          display_order?: number
        }
        Update: {
          product_id?: string
          series_id?: string
          display_order?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          status: OrderStatus
          settled: boolean
          subtotal_paise: number
          shipping_paise: number
          discount_paise: number
          sale_id: string | null
          total_paise: number
          shipping_address: Json
          tracking_number: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number: string
          status?: OrderStatus
          settled?: boolean
          subtotal_paise: number
          shipping_paise?: number
          discount_paise?: number
          sale_id?: string | null
          total_paise: number
          shipping_address: Json
          tracking_number?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          status?: OrderStatus
          settled?: boolean
          subtotal_paise?: number
          shipping_paise?: number
          discount_paise?: number
          sale_id?: string | null
          total_paise?: number
          shipping_address?: Json
          tracking_number?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          unit_price_paise: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          unit_price_paise: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          unit_price_paise?: number
          quantity?: number
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      increment_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
