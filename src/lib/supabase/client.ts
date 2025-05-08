
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock client if environment variables are missing (for development purposes)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Anon Key. Using mock client for development.');
}

// Create the Supabase client with fallbacks to prevent runtime errors
// In production, you must set the actual environment variables
export const supabase = createClient(
  supabaseUrl || 'https://mock-project.supabase.co',
  supabaseAnonKey || 'mock-anon-key'
);

// Utility function to check if we're using a mock client
export const isMockClient = () => !supabaseUrl || !supabaseAnonKey;
