
import { supabase } from './supabase/client';
import { PhoneId } from "@/types";

// Generate mock phone IDs for demonstration
export const generateMockPhoneIds = (count: number): string[] => {
  const phoneIds: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    phoneIds.push(`phone_${i.toString().padStart(3, '0')}`);
  }
  
  return phoneIds;
};

// Initialize phone ID objects and store in database
export const initializePhoneIds = async (ids: string[]): Promise<PhoneId[]> => {
  const phoneIds = ids.map(id => ({
    id,
    dailyCallCount: 0,
    totalCalls: 0
  }));
  
  // Insert phone IDs into database if they don't exist
  for (const phoneId of phoneIds) {
    const { error } = await supabase
      .from('phone_ids')
      .upsert({
        id: phoneId.id,
        daily_call_count: phoneId.dailyCallCount,
        total_calls: phoneId.totalCalls,
        last_reset_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
    if (error) {
      console.error('Error initializing phone ID:', error);
    }
  }
  
  return phoneIds;
};

// Get all phone IDs from database
export const getPhoneIds = async (): Promise<PhoneId[]> => {
  const { data, error } = await supabase
    .from('phone_ids')
    .select('*');
    
  if (error) {
    console.error('Error fetching phone IDs:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    dailyCallCount: item.daily_call_count,
    totalCalls: item.total_calls
  }));
};

// Get the next available phone ID that hasn't reached the daily limit
export const getNextAvailablePhoneId = async (
  dailyLimit: number = 100
): Promise<string | undefined> => {
  // Check for phone IDs that haven't reached daily limit
  const { data, error } = await supabase
    .from('phone_ids')
    .select('*')
    .lt('daily_call_count', dailyLimit)
    .order('last_used_at', { ascending: true })
    .limit(1);
    
  if (error || !data || data.length === 0) {
    console.error('Error fetching available phone ID:', error);
    return undefined;
  }
  
  return data[0].id;
};

// Update the call count for a specific phone ID
export const incrementPhoneIdUsage = async (
  phoneId: string
): Promise<void> => {
  const { error } = await supabase
    .from('phone_ids')
    .update({
      daily_call_count: supabase.rpc('increment_counter', { row_id: phoneId, counter_name: 'daily_call_count' }),
      total_calls: supabase.rpc('increment_counter', { row_id: phoneId, counter_name: 'total_calls' }),
      last_used_at: new Date().toISOString()
    })
    .eq('id', phoneId);
    
  if (error) {
    console.error('Error incrementing phone ID usage:', error);
    throw new Error('Failed to update phone ID usage');
  }
};

// Reset all daily call counts (would typically be done on a daily schedule)
export const resetDailyCallCounts = async (): Promise<void> => {
  const { error } = await supabase
    .from('phone_ids')
    .update({
      daily_call_count: 0,
      last_reset_at: new Date().toISOString()
    });
    
  if (error) {
    console.error('Error resetting daily call counts:', error);
    throw new Error('Failed to reset daily call counts');
  }
};

// Check if daily reset is needed (more than 24 hours since last reset)
export const checkAndResetDailyCounts = async (): Promise<boolean> => {
  // Get the oldest last_reset_at timestamp
  const { data, error } = await supabase
    .from('phone_ids')
    .select('last_reset_at')
    .order('last_reset_at', { ascending: true })
    .limit(1);
    
  if (error || !data || data.length === 0) {
    console.error('Error checking reset time:', error);
    return false;
  }
  
  const lastResetAt = new Date(data[0].last_reset_at);
  const now = new Date();
  const hoursSinceReset = (now.getTime() - lastResetAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceReset >= 24) {
    await resetDailyCallCounts();
    return true;
  }
  
  return false;
};
