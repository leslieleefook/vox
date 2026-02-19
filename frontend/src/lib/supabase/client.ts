import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Use cookies to persist session so middleware can access it
          storage: typeof window !== 'undefined' ? {
            getItem: (key: string) => {
              const cookies = document.cookie.split(';')
              const cookie = cookies.find(c => c.trim().startsWith(key + '='))
              return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
            },
            setItem: (key: string, value: string) => {
              document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
            },
            removeItem: (key: string) => {
              document.cookie = `${key}=; path=/; max-age=0`
            }
          } : undefined
        }
      }
    )
  }
  return supabaseInstance
}

// For backwards compatibility with existing imports
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop) {
    return getSupabase()[prop as keyof ReturnType<typeof createClient<Database>>]
  }
})

export type { Session, User } from '@supabase/supabase-js'
