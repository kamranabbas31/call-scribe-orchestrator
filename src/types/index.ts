
export interface Lead {
  id: string;
  name: string;
  phoneNumber: string;
  phoneId?: string;
  status: CallStatus;
  disposition?: string;
  duration?: number;
  cost?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export enum CallStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  FAILED = 'Failed'
}

export interface PhoneId {
  id: string;
  dailyCallCount: number;
  totalCalls: number;
}

export interface CallStats {
  completedCalls: number;
  inProgressCalls: number;
  remainingCalls: number;
  failedCalls: number;
  totalMinutes: number;
  totalCost: number;
}

export interface PacingOption {
  value: number;
  label: string;
}
