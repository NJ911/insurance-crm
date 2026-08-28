import { createClient } from '@supabase/supabase-js';

const ACTIVE_SUPABASE_URL = 'https://zazocgyfabkzzaropgjo.supabase.co';
const ACTIVE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphem9jZ3lmYWJrenphcm9wZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDk5OTAsImV4cCI6MjEwMzQyNTk5MH0.oBzW_1pt6wUOsZpl1G22miED7TjS_JIRexv9VhpZCys';

// Detect and override stale / deleted projects from Vercel environment variables
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isOldProject = envUrl && envUrl.includes('yuqtypatwmeyeojpjygh');

export const supabaseUrl = (isOldProject || !envUrl) ? ACTIVE_SUPABASE_URL : envUrl;
export const supabaseAnonKey = (isOldProject || !envKey) ? ACTIVE_SUPABASE_ANON_KEY : envKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
