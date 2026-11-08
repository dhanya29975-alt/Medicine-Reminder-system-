export type MedicineForm = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'inhaler' | 'drops' | 'cream' | 'other';

export type FoodInstruction = 'Before meal' | 'With meal' | 'After meal' | 'Empty stomach' | 'At bedtime' | 'As needed';

export type ReminderFrequency = 'daily' | 'weekly' | 'custom';

export type DoseStatus = 'taken' | 'snoozed' | 'skipped' | 'missed' | 'pending';

export type AlarmSoundType = 'digital' | 'chime' | 'pulse' | 'marimba' | 'hospital';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emergencyContact?: EmergencyContact;
}

export interface MedicineInventory {
  count: number;
  lowThreshold: number;
  unit: string;
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  form: MedicineForm;
  instructions: FoodInstruction;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD or empty
  times: string[];   // ["08:00", "14:00", "20:00"]
  frequency: ReminderFrequency;
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  color: string;     // 'teal' | 'rose' | 'amber' | 'indigo' | 'emerald' | 'purple' | 'cyan'
  icon?: string;
  inventory?: MedicineInventory;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface MedicineHistoryItem {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string; // e.g. "2026-11-08 08:00"
  actualTime: string;    // e.g. "2026-11-08 08:04"
  status: DoseStatus;
  reason?: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  alarmSound: AlarmSoundType;
  volume: number; // 0 - 100
  snoozeDurationMinutes: number; // e.g. 5
  voiceReadout: boolean;
  vibration: boolean;
  highContrast: boolean;
  largeText: boolean;
  notificationPermission: 'default' | 'granted' | 'denied';
}

export interface ActiveAlarmDose {
  id: string; // unique trigger id
  medicine: Medicine;
  scheduledTime: string; // "HH:mm"
  scheduledDate: string; // "YYYY-MM-DD"
  isSnoozed?: boolean;
  snoozeCount?: number;
  triggeredAt: number; // timestamp
}
