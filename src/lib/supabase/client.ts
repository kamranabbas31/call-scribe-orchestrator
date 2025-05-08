
import { createClient } from '@supabase/supabase-js';
import { supabase as integrationClient } from '@/integrations/supabase/client';

// Create the Supabase client
export const supabase = integrationClient;

// Utility function to check if we're using a mock client - now always returns false
export const isMockClient = () => false;
