import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// Data directory & persistent database
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial mock & sample data
function getInitialDb() {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  
  // Calculate next upcoming time in 2 minutes for immediate live demo
  const nextMin = new Date(now.getTime() + 2 * 60000);
  const nextMinStr = `${String(nextMin.getHours()).padStart(2, '0')}:${String(nextMin.getMinutes()).padStart(2, '0')}`;

  return {
    users: [
      {
        id: 'usr_demo_1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        phone: '+1 (555) 234-5678',
        emergencyContact: {
          name: 'Robert Doe',
          relation: 'Spouse',
          phone: '+1 (555) 987-6543'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_demo_2',
        name: 'Arthur Pendelton',
        email: 'arthur@seniorcare.org',
        password: 'password123',
        phone: '+1 (555) 345-6789',
        emergencyContact: {
          name: 'Dr. Sarah Smith',
          relation: 'Physician / Caregiver',
          phone: '+1 (555) 876-5432'
        },
        createdAt: new Date().toISOString()
      }
    ],
    medicines: [
      {
        id: 'med_1',
        userId: 'usr_demo_1',
        name: 'Metformin',
        dosage: '500 mg',
        form: 'tablet',
        instructions: 'With meal',
        startDate: today,
        endDate: '',
        times: ['08:00', nextMinStr, '20:00'],
        frequency: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        color: 'teal',
        icon: 'pill',
        inventory: { count: 48, lowThreshold: 10, unit: 'tablets' },
        notes: 'Take with morning and evening breakfast/dinner to reduce stomach upset.',
        active: true,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'med_2',
        userId: 'usr_demo_1',
        name: 'Lisinopril',
        dosage: '10 mg',
        form: 'tablet',
        instructions: 'Before meal',
        startDate: today,
        endDate: '',
        times: ['09:00'],
        frequency: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        color: 'rose',
        icon: 'heart',
        inventory: { count: 22, lowThreshold: 7, unit: 'tablets' },
        notes: 'Blood pressure control. Check BP periodically before taking.',
        active: true,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
      },
      {
        id: 'med_3',
        userId: 'usr_demo_1',
        name: 'Vitamin D3 & Calcium',
        dosage: '2000 IU',
        form: 'capsule',
        instructions: 'After meal',
        startDate: today,
        endDate: '',
        times: ['13:00'],
        frequency: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        color: 'amber',
        icon: 'sun',
        inventory: { count: 60, lowThreshold: 14, unit: 'capsules' },
        notes: 'Bone density support.',
        active: true,
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
      },
      {
        id: 'med_4',
        userId: 'usr_demo_1',
        name: 'Atorvastatin',
        dosage: '20 mg',
        form: 'tablet',
        instructions: 'At bedtime',
        startDate: today,
        endDate: '',
        times: ['21:30'],
        frequency: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        color: 'indigo',
        icon: 'shield',
        inventory: { count: 30, lowThreshold: 5, unit: 'tablets' },
        notes: 'Cholesterol management. Take consistently at night.',
        active: true,
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
      }
    ],
    history: [
      {
        id: 'hist_1',
        userId: 'usr_demo_1',
        medicineId: 'med_1',
        medicineName: 'Metformin',
        dosage: '500 mg',
        scheduledTime: `${today} 08:00`,
        actualTime: `${today} 08:04`,
        status: 'taken',
        reason: '',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'hist_2',
        userId: 'usr_demo_1',
        medicineId: 'med_2',
        medicineName: 'Lisinopril',
        dosage: '10 mg',
        scheduledTime: `${today} 09:00`,
        actualTime: `${today} 09:12`,
        status: 'taken',
        reason: '',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'hist_3',
        userId: 'usr_demo_1',
        medicineId: 'med_3',
        medicineName: 'Vitamin D3 & Calcium',
        dosage: '2000 IU',
        scheduledTime: `${new Date(Date.now() - 86400000).toISOString().split('T')[0]} 13:00`,
        actualTime: `${new Date(Date.now() - 86400000).toISOString().split('T')[0]} 13:02`,
        status: 'taken',
        reason: '',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'hist_4',
        userId: 'usr_demo_1',
        medicineId: 'med_4',
        medicineName: 'Atorvastatin',
        dosage: '20 mg',
        scheduledTime: `${new Date(Date.now() - 86400000).toISOString().split('T')[0]} 21:30`,
        actualTime: '',
        status: 'missed',
        reason: 'Fell asleep early',
        createdAt: new Date(Date.now() - 86400000 * 0.9).toISOString()
      }
    ],
    settings: {
      usr_demo_1: {
        userId: 'usr_demo_1',
        alarmSound: 'digital',
        volume: 85,
        snoozeDurationMinutes: 5,
        voiceReadout: true,
        vibration: true,
        highContrast: false,
        largeText: false,
        notificationPermission: 'granted'
      },
      usr_demo_2: {
        userId: 'usr_demo_2',
        alarmSound: 'pulse',
        volume: 100,
        snoozeDurationMinutes: 5,
        voiceReadout: true,
        vibration: true,
        highContrast: true,
        largeText: true,
        notificationPermission: 'granted'
      }
    }
  };
}

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db:', err);
    return getInitialDb();
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Simple token/user middleware simulation
  function getUserIdFromReq(req: express.Request): string {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      if (token.startsWith('usr_')) return token;
    }
    return 'usr_demo_1';
  }

  // --- Auth APIs ---
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, phone, emergencyContact } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const db = readDb();
    const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email,
      password: password || 'password123',
      phone: phone || '',
      emergencyContact: emergencyContact || { name: '', relation: '', phone: '' },
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    db.settings[newUser.id] = {
      userId: newUser.id,
      alarmSound: 'digital',
      volume: 85,
      snoozeDurationMinutes: 5,
      voiceReadout: true,
      vibration: true,
      highContrast: false,
      largeText: false,
      notificationPermission: 'default'
    };
    writeDb(db);
    return res.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        emergencyContact: newUser.emergencyContact
      },
      token: newUser.id
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDb();
    const user = db.users.find(
      (u: any) => u.email.toLowerCase() === (email || '').toLowerCase()
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emergencyContact: user.emergencyContact
      },
      token: user.id
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const userId = getUserIdFromReq(req);
    const db = readDb();
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emergencyContact: user.emergencyContact
      }
    });
  });

  app.put('/api/auth/profile', (req, res) => {
    const userId = getUserIdFromReq(req);
    const { name, phone, emergencyContact } = req.body;
    const db = readDb();
    const idx = db.users.findIndex((u: any) => u.id === userId);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    if (name) db.users[idx].name = name;
    if (phone !== undefined) db.users[idx].phone = phone;
    if (emergencyContact) db.users[idx].emergencyContact = emergencyContact;

    writeDb(db);
    return res.json({ user: db.users[idx] });
  });

  // --- Medicine Management APIs (Public & User-Scoped) ---
  app.get('/api/medicines', (req, res) => {
    const userId = getUserIdFromReq(req);
    const db = readDb();
    // Return all medicines for this user plus all shared/public medicines
    const medicines = db.medicines.filter((m: any) => {
      if (!m.userId || m.userId === 'public' || m.userId === 'usr_demo_1') return true;
      return m.userId === userId;
    });
    res.json(medicines);
  });

  app.post('/api/medicines', (req, res) => {
    const userId = getUserIdFromReq(req);
    const {
      name,
      dosage,
      form,
      instructions,
      startDate,
      endDate,
      times,
      frequency,
      daysOfWeek,
      color,
      icon,
      inventory,
      notes
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Medicine name is required' });
    }

    const safeTimes = Array.isArray(times) && times.length > 0
      ? times.sort()
      : (times ? [times] : ['08:00']);

    const db = readDb();
    const newMed = {
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: userId || 'public',
      name: String(name).trim(),
      dosage: (dosage && String(dosage).trim()) || '1 dose',
      form: form || 'tablet',
      instructions: instructions || 'With meal',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || '',
      times: safeTimes,
      frequency: frequency || 'daily',
      daysOfWeek: daysOfWeek && daysOfWeek.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
      color: color || 'teal',
      icon: icon || 'pill',
      inventory: inventory || { count: 30, lowThreshold: 7, unit: 'doses' },
      notes: notes || '',
      active: true,
      createdAt: new Date().toISOString()
    };

    db.medicines.push(newMed);
    writeDb(db);
    return res.status(201).json(newMed);
  });

  app.put('/api/medicines/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const idx = db.medicines.findIndex((m: any) => m.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    db.medicines[idx] = {
      ...db.medicines[idx],
      ...req.body,
      id,
      updatedAt: new Date().toISOString()
    };

    writeDb(db);
    return res.json(db.medicines[idx]);
  });

  app.delete('/api/medicines/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const initialLen = db.medicines.length;
    db.medicines = db.medicines.filter((m: any) => m.id !== id);

    if (db.medicines.length === initialLen) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    writeDb(db);
    return res.json({ success: true, id });
  });

  // --- Medicine History APIs (Public & User-Scoped) ---
  app.get('/api/history', (req, res) => {
    const userId = getUserIdFromReq(req);
    const db = readDb();
    const history = db.history
      .filter((h: any) => {
        if (!h.userId || h.userId === 'public' || h.userId === 'usr_demo_1') return true;
        return h.userId === userId;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(history);
  });

  app.post('/api/history', (req, res) => {
    const userId = getUserIdFromReq(req);
    const { medicineId, medicineName, dosage, scheduledTime, actualTime, status, reason } = req.body;
    if (!medicineName || !status) {
      return res.status(400).json({ error: 'Medicine name and status are required' });
    }

    const db = readDb();
    const newEntry = {
      id: `hist_${Date.now()}`,
      userId: userId || 'public',
      medicineId: medicineId || '',
      medicineName,
      dosage: dosage || '',
      scheduledTime: scheduledTime || new Date().toISOString(),
      actualTime: actualTime || new Date().toISOString(),
      status, // 'taken' | 'snoozed' | 'skipped' | 'missed'
      reason: reason || '',
      createdAt: new Date().toISOString()
    };

    // If medicine exists and was taken, decrement inventory count by 1
    if (medicineId && status === 'taken') {
      const med = db.medicines.find((m: any) => m.id === medicineId);
      if (med && med.inventory && med.inventory.count > 0) {
        med.inventory.count -= 1;
      }
    }

    db.history.unshift(newEntry);
    writeDb(db);
    return res.status(201).json(newEntry);
  });

  app.delete('/api/history/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.history = db.history.filter((h: any) => h.id !== id);
    writeDb(db);
    return res.json({ success: true, id });
  });

  // --- Settings APIs ---
  app.get('/api/settings', (req, res) => {
    const userId = getUserIdFromReq(req);
    const db = readDb();
    const settings = db.settings[userId] || {
      userId,
      alarmSound: 'digital',
      volume: 85,
      snoozeDurationMinutes: 5,
      voiceReadout: true,
      vibration: true,
      highContrast: false,
      largeText: false,
      notificationPermission: 'default'
    };
    return res.json(settings);
  });

  app.put('/api/settings', (req, res) => {
    const userId = getUserIdFromReq(req);
    const db = readDb();
    db.settings[userId] = {
      ...(db.settings[userId] || {}),
      ...req.body,
      userId
    };
    writeDb(db);
    return res.json(db.settings[userId]);
  });

  // --- Reset/Seed API ---
  app.post('/api/reset-demo', (req, res) => {
    const initial = getInitialDb();
    writeDb(initial);
    return res.json({ success: true, message: 'Database reset to demo state' });
  });

  // --- Vite Dev or Production Static Serving ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`MediAlarm full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
