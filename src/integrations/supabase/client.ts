
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ebmiuqrdzzdliupgcqsy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibWl1cXJkenpkbGl1cGdjcXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzYyNzQsImV4cCI6MjA2ODUxMjI3NH0.Ayq9GzSfcpERcoXSE2xu7Gk4GZQp94wRqPpe7e8bPq8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
