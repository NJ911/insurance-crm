import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yuqtypatwmeyeojpjygh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cXR5cGF0d21leWVvanBqeWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NzczOTYsImV4cCI6MjEwMzM1MzM5Nn0.oDsdZHepIPWIYviNpuQOW9-tc8tunOJWNOWAKJ2Cf1k';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
