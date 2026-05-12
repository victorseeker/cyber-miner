import { createClient } from '@supabase/supabase-js'

// 记得替换成你实际的 URL 和 Key
const supabaseUrl = 'https://sdiopjpgznnpvfqbtooc.supabase.co'
const supabaseAnonKey = 'sb_publishable_Dp7_UyqoQw8E7X2iHeEsmw_uaLMYTXE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)