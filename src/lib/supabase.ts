import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zazocgyfabkzzaropgjo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphem9jZ3lmYWJrenphcm9wZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDk5OTAsImV4cCI6MjEwMzQyNTk5MH0.oBzW_1pt6wUOsZpl1G22miED7TjS_JIRexv9VhpZCys';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
