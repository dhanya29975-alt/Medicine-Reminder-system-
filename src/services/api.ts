import { Medicine, MedicineHistoryItem, User, UserSettings } from '../types';

const TOKEN_KEY = 'medialarm_auth_token';
const CACHE_KEY_USER = 'medialarm_user';
const CACHE_KEY_MEDS = 'medialarm_meds';
const CACHE_KEY_HIST = 'medialarm_history';
const CACHE_KEY_SETTINGS = 'medialarm_settings';

export class ApiService {
  private static getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || 'usr_demo_1';
  }

  public static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CACHE_KEY_USER);
  }

  // --- Auth ---
  public static async getCurrentUser(): Promise<User | null> {
    const cached = localStorage.getItem(CACHE_KEY_USER);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(CACHE_KEY_USER, JSON.stringify(data.user));
        return data.user;
      }
    } catch (e) {
      // fallback to cached
    }
    return cached ? JSON.parse(cached) : null;
  }

  public static async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to login');
      }
      const data = await res.json();
      this.setToken(data.token);
      localStorage.setItem(CACHE_KEY_USER, JSON.stringify(data.user));
      return data;
    } catch (e: any) {
      // Mock login fallback if offline
      const mockUser: User = {
        id: email.includes('arthur') ? 'usr_demo_2' : 'usr_demo_1',
        name: email.includes('arthur') ? 'Arthur Pendelton' : 'Jane Doe',
        email,
        phone: '+1 (555) 234-5678',
        emergencyContact: {
          name: 'Robert Doe',
          relation: 'Spouse',
          phone: '+1 (555) 987-6543'
        }
      };
      this.setToken(mockUser.id);
      localStorage.setItem(CACHE_KEY_USER, JSON.stringify(mockUser));
      return { user: mockUser, token: mockUser.id };
    }
  }

  public static async register(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    emergencyContact?: any;
  }): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }
      const result = await res.json();
      this.setToken(result.token);
      localStorage.setItem(CACHE_KEY_USER, JSON.stringify(result.user));
      return result;
    } catch (e: any) {
      const fallbackUser: User = {
        id: `usr_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        emergencyContact: data.emergencyContact
      };
      this.setToken(fallbackUser.id);
      localStorage.setItem(CACHE_KEY_USER, JSON.stringify(fallbackUser));
      return { user: fallbackUser, token: fallbackUser.id };
    }
  }

  // --- Medicines ---
  public static async getMedicines(): Promise<Medicine[]> {
    let remoteMeds: Medicine[] | null = null;
    try {
      const res = await fetch('/api/medicines', {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
      if (res.ok) {
        remoteMeds = await res.json();
      }
    } catch (e) {
      console.warn('Network fetch /api/medicines failed, using cached medicines:', e);
    }

    const cachedRaw = localStorage.getItem(CACHE_KEY_MEDS);
    const cachedList: Medicine[] = cachedRaw ? JSON.parse(cachedRaw) : [];

    if (remoteMeds && Array.isArray(remoteMeds)) {
      // Merge remote with local cache so newly added local medicines are never erased
      const mergedMap = new Map<string, Medicine>();
      cachedList.forEach((m) => mergedMap.set(m.id, m));
      remoteMeds.forEach((m) => mergedMap.set(m.id, m));
      const combined = Array.from(mergedMap.values());
      localStorage.setItem(CACHE_KEY_MEDS, JSON.stringify(combined));
      return combined;
    }

    return cachedList;
  }

  public static async createMedicine(medData: Partial<Medicine>): Promise<Medicine> {
    let newMed: Medicine | null = null;
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(medData)
      });
      if (res.ok) {
        newMed = await res.json();
      }
    } catch (e) {
      console.warn('API createMedicine network failure, saving to local cache:', e);
    }

    if (!newMed) {
      newMed = {
        id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: this.getToken(),
        name: medData.name ? String(medData.name).trim() : 'Medicine',
        dosage: (medData.dosage && String(medData.dosage).trim()) || '1 dose',
        form: medData.form || 'tablet',
        instructions: medData.instructions || 'With meal',
        startDate: medData.startDate || new Date().toISOString().split('T')[0],
        endDate: medData.endDate || '',
        times: medData.times && medData.times.length ? medData.times : ['08:00'],
        frequency: medData.frequency || 'daily',
        daysOfWeek: medData.daysOfWeek && medData.daysOfWeek.length ? medData.daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
        color: medData.color || 'teal',
        icon: medData.icon || 'pill',
        inventory: medData.inventory || { count: 30, lowThreshold: 7, unit: 'doses' },
        notes: medData.notes || '',
        active: true,
        createdAt: new Date().toISOString()
      };
    }

    // Synchronously update localStorage cache so it can never be lost
    try {
      const cached = localStorage.getItem(CACHE_KEY_MEDS);
      const list: Medicine[] = cached ? JSON.parse(cached) : [];
      const updated = [...list.filter((m) => m.id !== newMed!.id), newMed];
      localStorage.setItem(CACHE_KEY_MEDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }

    return newMed;
  }

  public static async updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine> {
    let updatedMed: Medicine | null = null;
    try {
      const res = await fetch(`/api/medicines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        updatedMed = await res.json();
      }
    } catch (e) {}

    // Synchronously update localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY_MEDS);
      const list: Medicine[] = cached ? JSON.parse(cached) : [];
      const updatedList = list.map((m) => {
        if (m.id === id) {
          return updatedMed || { ...m, ...updates };
        }
        return m;
      });
      localStorage.setItem(CACHE_KEY_MEDS, JSON.stringify(updatedList));
      if (!updatedMed) {
        const found = updatedList.find((m) => m.id === id);
        if (found) return found;
      }
    } catch (e) {}

    return updatedMed || ({ ...(updates as any), id } as Medicine);
  }

  public static async deleteMedicine(id: string): Promise<boolean> {
    try {
      await fetch(`/api/medicines/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
    } catch (e) {}

    // Synchronously update localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY_MEDS);
      if (cached) {
        const list: Medicine[] = JSON.parse(cached);
        const filtered = list.filter((m) => m.id !== id);
        localStorage.setItem(CACHE_KEY_MEDS, JSON.stringify(filtered));
      }
    } catch (e) {}

    return true;
  }

  // --- History ---
  public static async getHistory(): Promise<MedicineHistoryItem[]> {
    try {
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
      if (res.ok) {
        const hist = await res.json();
        localStorage.setItem(CACHE_KEY_HIST, JSON.stringify(hist));
        return hist;
      }
    } catch (e) {}
    const cached = localStorage.getItem(CACHE_KEY_HIST);
    return cached ? JSON.parse(cached) : [];
  }

  public static async logHistory(item: Partial<MedicineHistoryItem>): Promise<MedicineHistoryItem> {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    const localItem: MedicineHistoryItem = {
      id: `hist_${Date.now()}`,
      userId: this.getToken(),
      medicineId: item.medicineId || '',
      medicineName: item.medicineName || 'Medicine',
      dosage: item.dosage || '',
      scheduledTime: item.scheduledTime || new Date().toISOString(),
      actualTime: item.actualTime || new Date().toISOString(),
      status: item.status || 'taken',
      reason: item.reason || '',
      createdAt: new Date().toISOString()
    };
    return localItem;
  }

  public static async deleteHistoryItem(id: string): Promise<boolean> {
    try {
      await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
    } catch (e) {}
    return true;
  }

  // --- Settings ---
  public static async getSettings(): Promise<UserSettings> {
    try {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
      if (res.ok) {
        const s = await res.json();
        localStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(s));
        return s;
      }
    } catch (e) {}
    const cached = localStorage.getItem(CACHE_KEY_SETTINGS);
    if (cached) return JSON.parse(cached);
    return {
      userId: this.getToken(),
      alarmSound: 'digital',
      volume: 85,
      snoozeDurationMinutes: 5,
      voiceReadout: true,
      vibration: true,
      highContrast: false,
      largeText: false,
      notificationPermission: 'default'
    };
  }

  public static async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        localStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(updated));
        return updated;
      }
    } catch (e) {}
    return updates as UserSettings;
  }

  public static async resetDemo(): Promise<void> {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem(CACHE_KEY_MEDS);
    localStorage.removeItem(CACHE_KEY_HIST);
    localStorage.removeItem(CACHE_KEY_SETTINGS);
  }
}
