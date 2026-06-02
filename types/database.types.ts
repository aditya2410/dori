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
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          user_id: string
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
          stock?: number
          is_active?: boolean
          is_bestseller?: boolean
          bestseller_order?: number | null
          created_at?: string
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
          image_position?: 'top' | 'center' | 'bottom' | 'left' | 'right'
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
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
        }
        Insert: {
          product_id: string
          series_id: string
        }
        Update: {
          product_id?: string
          series_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          status: OrderStatus
          subtotal_paise: number
          shipping_paise: number
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
          subtotal_paise: number
          shipping_paise?: number
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
          subtotal_paise?: number
          shipping_paise?: number
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
