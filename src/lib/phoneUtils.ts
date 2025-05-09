
import { supabase } from './supabase/client';

export const generateMockPhoneIds = (count: number): string[] => {
  const phoneIds = [];
  for (let i = 0; i < count; i++) {
    // Generate random phone IDs in a format like "phone-123456"
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    phoneIds.push(`phone-${randomNum}`);
  }
  return phoneIds;
};

export const initializePhoneIds = async (phoneIds: string[]): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  
  const entries = phoneIds.map(phoneId => ({
    phone_id: phoneId,
    last_used: today,
    used_today: 0
  }));
  
  const { error } = await supabase
    .from('phone_ids')
    .insert(entries);
    
  if (error) {
    console.error('Error initializing phone IDs:', error);
    throw error;
  }
};

export const getPhoneIds = async () => {
  const { data, error } = await supabase
    .from('phone_ids')
    .select('*');
    
  if (error) {
    console.error('Error fetching phone IDs:', error);
    throw error;
  }
  
  return (data || []).map(item => ({
    id: item.id,
    phoneId: item.phone_id, 
    dailyCallCount: item.used_today || 0,
    totalCalls: item.total_calls || 0
  }));
};

export const checkAndResetDailyCounts = async (): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('phone_ids')
    .select('*')
    .neq('last_used', today)
    .limit(1);
    
  if (error) {
    console.error('Error checking phone ID reset:', error);
    throw error;
  }
  
  // If we found any records that don't have today's date,
  // reset all records' daily counts
  if (data && data.length > 0) {
    const { error: updateError } = await supabase
      .from('phone_ids')
      .update({ 
        used_today: 0,
        last_used: today
      })
      .neq('last_used', today);
      
    if (updateError) {
      console.error('Error resetting phone ID daily counts:', updateError);
      throw updateError;
    }
    
    return true; // Reset was performed
  }
  
  return false; // No reset needed
};

// Get the next available phone ID that hasn't hit daily cap
export const getAvailablePhoneId = async (
  dailyLimit: number = 100
): Promise<string> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("phone_ids")
    .select("*")
    .lte("used_today", dailyLimit)
    .eq("last_used", today)
    .order("used_today", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    throw new Error("No available phone ID");
  }

  const selected = data[0];

  const { error: updateError } = await supabase
    .from("phone_ids")
    .update({ used_today: selected.used_today + 1 })
    .eq("id", selected.id);

  if (updateError) {
    console.error("Failed to update phone ID usage:", updateError);
    throw new Error("Usage update failed");
  }

  return selected.phone_id;
};

export const getNextAvailablePhoneId = async (dailyLimit: number = 100): Promise<string | null> => {
  try {
    return await getAvailablePhoneId(dailyLimit);
  } catch (error) {
    console.error("Error getting next available phone ID:", error);
    return null;
  }
};

export const incrementPhoneIdUsage = async (phoneId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('phone_ids')
    .select('*')
    .eq('phone_id', phoneId)
    .single();
    
  if (error) {
    console.error('Error fetching phone ID for increment:', error);
    throw error;
  }
  
  const { error: updateError } = await supabase
    .from('phone_ids')
    .update({ 
      total_calls: (data.total_calls || 0) + 1,
      last_used_at: new Date().toISOString()
    })
    .eq('id', data.id);
    
  if (updateError) {
    console.error('Error incrementing phone ID usage:', updateError);
    throw updateError;
  }
};
