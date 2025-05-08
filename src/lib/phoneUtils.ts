
// This is a simple utility to generate mock phone IDs
// In a production app, these would come from a database or API
export const generateMockPhoneIds = (count: number): string[] => {
  const phoneIds: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    phoneIds.push(`phone_${i.toString().padStart(3, '0')}`);
  }
  
  return phoneIds;
};

export const getNextAvailablePhoneId = (
  phoneIds: { id: string; dailyCallCount: number }[],
  dailyLimit: number = 100
): string | undefined => {
  const availablePhone = phoneIds.find(phone => phone.dailyCallCount < dailyLimit);
  return availablePhone?.id;
};
