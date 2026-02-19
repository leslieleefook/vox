export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      assistants: {
        Row: {
          id: string
          client_id: string
          name: string
          system_prompt: string
          voice_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          system_prompt: string
          voice_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          system_prompt?: string
          voice_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      phone_numbers: {
        Row: {
          id: string
          client_id: string
          assistant_id: string
          number: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          assistant_id: string
          number: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          assistant_id?: string
          number?: string
          created_at?: string
        }
      }
      call_logs: {
        Row: {
          id: string
          client_id: string
          assistant_id: string
          phone_number_id: string
          caller_number: string
          duration_seconds: number
          status: string
          transcript: Json
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          assistant_id: string
          phone_number_id: string
          caller_number: string
          duration_seconds?: number
          status?: string
          transcript?: Json
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          assistant_id?: string
          phone_number_id?: string
          caller_number?: string
          duration_seconds?: number
          status?: string
          transcript?: Json
          created_at?: string
        }
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
  }
}
