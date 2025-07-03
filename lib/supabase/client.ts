import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

/**
 * Supabase client for browser/client-side usage
 *
 * This client is configured for client-side operations and includes
 * automatic session management and real-time subscriptions.
 */

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Get a typed Supabase client instance for browser usage
 *
 * @example
 * ```typescript
 * const supabase = createClient()
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*')
 * ```
 */
export const supabase = createClient()
