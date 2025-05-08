import { supabase } from './supabase/client';

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