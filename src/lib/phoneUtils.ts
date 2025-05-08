
// This is a utility to generate and manage phone IDs
import { PhoneId } from "@/types";

// Generate mock phone IDs for demonstration
export const generateMockPhoneIds = (count: number): string[] => {
  const phoneIds: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    phoneIds.push(`phone_${i.toString().padStart(3, '0')}`);
  }
  
  return phoneIds;
};

// Initialize phone ID objects with usage tracking
export const initializePhoneIds = (ids: string[]): PhoneId[] => {
  return ids.map(id => ({
    id,
    dailyCallCount: 0,
    totalCalls: 0
  }));
};

// Get the next available phone ID that hasn't reached the daily limit
export const getNextAvailablePhoneId = (
  phoneIds: PhoneId[],
  dailyLimit: number = 100
): string | undefined => {
  const availablePhone = phoneIds.find(phone => phone.dailyCallCount < dailyLimit);
  return availablePhone?.id;
};

// Update the call count for a specific phone ID
export const incrementPhoneIdUsage = (
  phoneIds: PhoneId[],
  phoneId: string
): PhoneId[] => {
  return phoneIds.map(phone => {
    if (phone.id === phoneId) {
      return {
        ...phone,
        dailyCallCount: phone.dailyCallCount + 1,
        totalCalls: phone.totalCalls + 1
      };
    }
    return phone;
  });
};

// Reset all daily call counts (would typically be done on a daily schedule)
export const resetDailyCallCounts = (phoneIds: PhoneId[]): PhoneId[] => {
  return phoneIds.map(phone => ({
    ...phone,
    dailyCallCount: 0
  }));
};
