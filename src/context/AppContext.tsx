import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ActiveAlarmDose,
  Medicine,
  MedicineHistoryItem,
  User,
  UserSettings,
  DoseStatus
} from '../types';
import { ApiService } from '../services/api';
import { audioEngine } from '../services/audioEngine';

interface SnoozedItem {
  id: string;
  medicine: Medicine;
  originalTime: string;
  ringAt: number; // timestamp ms
  snoozeCount: number;
}

interface AppContextType {
  user: User | null;
  medicines: Medicine[];
  history: MedicineHistoryItem[];
  settings: UserSettings;
  activeAlarm: ActiveAlarmDose | null;
  currentTime: Date;
  currentTab: 'dashboard' | 'schedule' | 'medicines' | 'history' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'schedule' | 'medicines' | 'history' | 'settings') => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAddEditModalOpen: boolean;
  setIsAddEditModalOpen: (open: boolean) => void;
  editingMedicine: Medicine | null;
  setEditingMedicine: (med: Medicine | null) => void;
  snoozedList: SnoozedItem[];
  
  // Actions
  login: (email: string, password?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  saveMedicine: (medData: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  resetToDemo: () => Promise<void>;

  // Alarm Actions
  handleTaken: (dose: ActiveAlarmDose) => Promise<void>;
  handleSnooze: (dose: ActiveAlarmDose) => void;
  handleSkip: (dose: ActiveAlarmDose, reason?: string) => Promise<void>;
  triggerAlarmNow: (medicine?: Medicine, customTime?: string) => void;
  scheduleQuickTestAlarm: (seconds?: number) => void;
  stopActiveAlarmSound: () => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [history, setHistory] = useState<MedicineHistoryItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userId: 'usr_demo_1',
    alarmSound: 'digital',
    volume: 85,
    snoozeDurationMinutes: 5,
    voiceReadout: true,
    vibration: true,
    highContrast: false,
    largeText: false,
    notificationPermission: 'default'
  });

  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmDose | null>(null);
  const [snoozedList, setSnoozedList] = useState<SnoozedItem[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'schedule' | 'medicines' | 'history' | 'settings'>('dashboard');
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Set of alarms triggered today to prevent duplicate ringing in the same minute
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());
  const lastMinuteRef = useRef<string>('');

  // Initial load
  const loadData = useCallback(async () => {
    try {
      const u = await ApiService.getCurrentUser();
      if (u) setUser(u);
      const [m, h, s] = await Promise.all([
        ApiService.getMedicines(),
        ApiService.getHistory(),
        ApiService.getSettings()
      ]);
      setMedicines(m);
      setHistory(h);
      if (s) setSettings(s);
    } catch (e) {
      console.error('Error loading initial data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Pre-unlock audio on user's first click anywhere on the page
    const handleFirstGesture = () => {
      audioEngine.unlockAudio();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration warning:', err);
      });

      // Listen for message from service worker notification action
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_ACTION') {
          const action = event.data.action;
          const alarmData = event.data.data?.alarm;
          if (alarmData) {
            if (action === 'taken') handleTaken(alarmData);
            else if (action === 'snooze') handleSnooze(alarmData);
            else if (action === 'skip') handleSkip(alarmData);
          }
        }
      });
    }

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [loadData]);

  // Request system notification permission
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser.');
      return 'denied';
    }
    const perm = await Notification.requestPermission();
    setSettings((prev) => ({ ...prev, notificationPermission: perm }));
    await ApiService.updateSettings({ notificationPermission: perm });
    return perm;
  };

  // Trigger browser notification
  const fireNotification = useCallback((dose: ActiveAlarmDose) => {
    const title = `🚨 Medicine Alarm: ${dose.medicine.name}`;
    const body = `Time for ${dose.medicine.dosage} (${dose.medicine.instructions}). Tap to respond.`;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_NOTIFICATION',
        title,
        options: {
          body,
          tag: `med_${dose.medicine.id}_${dose.scheduledTime}`,
          data: { alarm: dose }
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon.svg',
          requireInteraction: true
        });
      } catch (e) {}
    }
  }, []);

  // Ring the alarm immediately with audio & voice
  const startRingingAlarm = useCallback((dose: ActiveAlarmDose) => {
    setActiveAlarm(dose);
    // Play continuous synthesizer alarm sound
    audioEngine.startAlarm(settings.alarmSound, settings.volume, settings.vibration);
    // If voiceReadout is on, speak medicine name and instructions
    if (settings.voiceReadout) {
      setTimeout(() => {
        audioEngine.speakReminder(dose.medicine.name, dose.medicine.dosage, dose.medicine.instructions);
      }, 600);
    }
    // Fire mobile notification
    fireNotification(dose);
  }, [settings, fireNotification]);

  // Clock tick & Real-time Alarm Monitor (Runs every second)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;
      const currentDateStr = now.toISOString().split('T')[0];
      const currentDayOfWeek = now.getDay();
      const currentTimestamp = now.getTime();

      // Reset triggered alarms on minute change or new day
      if (lastMinuteRef.current !== currentTimeStr) {
        lastMinuteRef.current = currentTimeStr;
      }

      // 1. Check Snoozed Alarms that have reached their ringAt timestamp
      setSnoozedList((prevSnoozed) => {
        const readyToRing: SnoozedItem[] = [];
        const stillWaiting: SnoozedItem[] = [];

        prevSnoozed.forEach((item) => {
          if (currentTimestamp >= item.ringAt) {
            readyToRing.push(item);
          } else {
            stillWaiting.push(item);
          }
        });

        if (readyToRing.length > 0 && !activeAlarm) {
          const first = readyToRing[0];
          startRingingAlarm({
            id: `snooze_${first.id}_${Date.now()}`,
            medicine: first.medicine,
            scheduledTime: first.originalTime,
            scheduledDate: currentDateStr,
            isSnoozed: true,
            snoozeCount: first.snoozeCount,
            triggeredAt: currentTimestamp
          });
          // return remaining
          return [...stillWaiting, ...readyToRing.slice(1)];
        }
        return prevSnoozed;
      });

      // 2. Check Scheduled Medicine Times
      if (!activeAlarm) {
        for (const med of medicines) {
          if (!med.active) continue;

          // Check start/end dates
          if (med.startDate && currentDateStr < med.startDate) continue;
          if (med.endDate && currentDateStr > med.endDate) continue;

          // Check frequency & day of week
          if (med.frequency === 'weekly' || med.frequency === 'custom') {
            if (!med.daysOfWeek || !med.daysOfWeek.includes(currentDayOfWeek)) {
              continue;
            }
          }

          // Check each scheduled time
          for (const schedTime of med.times) {
            if (schedTime === currentTimeStr) {
              const alarmKey = `${med.id}_${currentDateStr}_${schedTime}`;
              if (!triggeredAlarmsRef.current.has(alarmKey)) {
                triggeredAlarmsRef.current.add(alarmKey);
                startRingingAlarm({
                  id: `alarm_${med.id}_${currentDateStr}_${schedTime}`,
                  medicine: med,
                  scheduledTime: schedTime,
                  scheduledDate: currentDateStr,
                  triggeredAt: currentTimestamp
                });
                return; // ring one at a time
              }
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [medicines, activeAlarm, startRingingAlarm]);

  // Alarm Action: TAKEN
  const handleTaken = async (dose: ActiveAlarmDose) => {
    audioEngine.stopAlarm();
    setActiveAlarm(null);

    // Remove from snoozed list if it was snoozed
    setSnoozedList((prev) => prev.filter((s) => s.medicine.id !== dose.medicine.id));

    // Celebrate with confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const now = new Date();
    const actualTimeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const scheduledTimeStr = `${dose.scheduledDate} ${dose.scheduledTime}`;

    // Log in database
    const logged = await ApiService.logHistory({
      medicineId: dose.medicine.id,
      medicineName: dose.medicine.name,
      dosage: dose.medicine.dosage,
      scheduledTime: scheduledTimeStr,
      actualTime: actualTimeStr,
      status: 'taken',
      reason: ''
    });

    setHistory((prev) => [logged, ...prev]);

    // Decrement inventory in local state
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === dose.medicine.id && m.inventory && m.inventory.count > 0) {
          return {
            ...m,
            inventory: {
              ...m.inventory,
              count: m.inventory.count - 1
            }
          };
        }
        return m;
      })
    );
  };

  // Alarm Action: SNOOZE
  const handleSnooze = (dose: ActiveAlarmDose) => {
    audioEngine.stopAlarm();
    setActiveAlarm(null);

    const snoozeMinutes = settings.snoozeDurationMinutes || 5;
    const ringAt = Date.now() + snoozeMinutes * 60 * 1000;
    const nextCount = (dose.snoozeCount || 0) + 1;

    setSnoozedList((prev) => [
      ...prev.filter((item) => item.medicine.id !== dose.medicine.id),
      {
        id: `snoozed_${dose.medicine.id}_${Date.now()}`,
        medicine: dose.medicine,
        originalTime: dose.scheduledTime,
        ringAt,
        snoozeCount: nextCount
      }
    ]);
  };

  // Alarm Action: SKIP
  const handleSkip = async (dose: ActiveAlarmDose, reason: string = 'Skipped by user') => {
    audioEngine.stopAlarm();
    setActiveAlarm(null);

    // Remove from snoozed list
    setSnoozedList((prev) => prev.filter((s) => s.medicine.id !== dose.medicine.id));

    const now = new Date();
    const actualTimeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const scheduledTimeStr = `${dose.scheduledDate} ${dose.scheduledTime}`;

    const logged = await ApiService.logHistory({
      medicineId: dose.medicine.id,
      medicineName: dose.medicine.name,
      dosage: dose.medicine.dosage,
      scheduledTime: scheduledTimeStr,
      actualTime: actualTimeStr,
      status: 'skipped',
      reason
    });

    setHistory((prev) => [logged, ...prev]);
  };

  // Manual Trigger: Test Alarm Now
  const triggerAlarmNow = (medicine?: Medicine, customTime?: string) => {
    const med = medicine || medicines[0] || {
      id: 'med_test',
      userId: user?.id || 'demo',
      name: 'Sample Medicine (Test)',
      dosage: '1 Tablet (500mg)',
      form: 'tablet',
      instructions: 'With meal',
      startDate: new Date().toISOString().split('T')[0],
      times: ['12:00'],
      frequency: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      color: 'teal',
      active: true,
      createdAt: new Date().toISOString()
    };

    const now = new Date();
    const timeStr = customTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    startRingingAlarm({
      id: `test_alarm_${Date.now()}`,
      medicine: med,
      scheduledTime: timeStr,
      scheduledDate: now.toISOString().split('T')[0],
      triggeredAt: Date.now()
    });
  };

  // Helper: Schedule Quick Test Alarm in X Seconds
  const scheduleQuickTestAlarm = (seconds: number = 5) => {
    const targetTime = new Date(Date.now() + seconds * 1000);
    const med = medicines[0] || {
      id: 'med_demo',
      userId: user?.id || 'usr_demo_1',
      name: 'Test Dose',
      dosage: '10 mg',
      form: 'tablet',
      instructions: 'With water',
      startDate: targetTime.toISOString().split('T')[0],
      times: ['12:00'],
      frequency: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      color: 'teal',
      active: true,
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      triggerAlarmNow(med);
    }, seconds * 1000);
  };

  const stopActiveAlarmSound = () => {
    audioEngine.stopAlarm();
  };

  // CRUD for Medicines
  const saveMedicine = async (medData: Partial<Medicine>) => {
    if (editingMedicine?.id) {
      const updated = await ApiService.updateMedicine(editingMedicine.id, medData);
      setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } else {
      const created = await ApiService.createMedicine(medData);
      setMedicines((prev) => [...prev, created]);
    }
    setEditingMedicine(null);
    setIsAddEditModalOpen(false);
  };

  const deleteMedicine = async (id: string) => {
    await ApiService.deleteMedicine(id);
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const deleteHistoryItem = async (id: string) => {
    await ApiService.deleteHistoryItem(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    const saved = await ApiService.updateSettings(updates);
    if (saved) setSettings(saved);
  };

  const login = async (email: string, password?: string) => {
    const res = await ApiService.login(email, password);
    setUser(res.user);
    setIsAuthModalOpen(false);
    await loadData();
  };

  const register = async (data: any) => {
    const res = await ApiService.register(data);
    setUser(res.user);
    setIsAuthModalOpen(false);
    await loadData();
  };

  const logout = () => {
    ApiService.clearToken();
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const resetToDemo = async () => {
    await ApiService.resetDemo();
    await loadData();
    triggeredAlarmsRef.current.clear();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        medicines,
        history,
        settings,
        activeAlarm,
        currentTime,
        currentTab,
        setCurrentTab,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAddEditModalOpen,
        setIsAddEditModalOpen,
        editingMedicine,
        setEditingMedicine,
        snoozedList,
        login,
        register,
        logout,
        saveMedicine,
        deleteMedicine,
        updateSettings,
        deleteHistoryItem,
        resetToDemo,
        handleTaken,
        handleSnooze,
        handleSkip,
        triggerAlarmNow,
        scheduleQuickTestAlarm,
        stopActiveAlarmSound,
        requestNotificationPermission
      }}
    >
      <div className={settings.highContrast ? 'contrast-125' : ''}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
