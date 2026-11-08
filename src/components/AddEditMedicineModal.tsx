import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Pill,
  Sparkles,
  Info,
  Check,
  Package,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Utensils,
  Zap,
  Repeat,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FoodInstruction, Medicine, MedicineForm, ReminderFrequency } from '../types';

// Convert "14:30" to "2:30 PM"
export function formatTo12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr.padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

// Convert 12h parts to "HH:mm" 24h string
export function convert12To24(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h = hour12;
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export const AddEditMedicineModal: React.FC = () => {
  const {
    isAddEditModalOpen,
    setIsAddEditModalOpen,
    editingMedicine,
    setEditingMedicine,
    saveMedicine,
    currentTime
  } = useApp();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState<MedicineForm>('tablet');
  const [instructions, setInstructions] = useState<FoodInstruction>('With meal');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isOngoing, setIsOngoing] = useState(true);

  // Timings management
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  // Custom convenient time builder (12h format)
  const [pickerHour, setPickerHour] = useState<number>(8);
  const [pickerMinute, setPickerMinute] = useState<number>(0);
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>('AM');
  const [nativeTimeInput, setNativeTimeInput] = useState<string>('08:00');
  const [showIntervalWizard, setShowIntervalWizard] = useState(false);
  const [intervalFrequency, setIntervalFrequency] = useState<number>(2); // 1, 2, 3, or 4 times daily
  const [intervalStartHour, setIntervalStartHour] = useState<number>(8); // 8 AM

  const [frequency, setFrequency] = useState<ReminderFrequency>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState('teal');
  const [inventoryCount, setInventoryCount] = useState<number>(30);
  const [lowThreshold, setLowThreshold] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingMedicine) {
      setName(editingMedicine.name);
      setDosage(editingMedicine.dosage);
      setForm(editingMedicine.form);
      setInstructions(editingMedicine.instructions);
      setStartDate(editingMedicine.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(editingMedicine.endDate || '');
      setIsOngoing(!editingMedicine.endDate);
      const medTimes = editingMedicine.times?.length ? [...editingMedicine.times].sort() : ['08:00'];
      setTimes(medTimes);
      setFrequency(editingMedicine.frequency || 'daily');
      setDaysOfWeek(editingMedicine.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
      setColor(editingMedicine.color || 'teal');
      setInventoryCount(editingMedicine.inventory?.count ?? 30);
      setLowThreshold(editingMedicine.inventory?.lowThreshold ?? 7);
      setNotes(editingMedicine.notes || '');

      // initialize picker from first time
      if (medTimes[0]) {
        const [h, m] = medTimes[0].split(':').map(Number);
        setPickerPeriod(h >= 12 ? 'PM' : 'AM');
        const h12 = h % 12 === 0 ? 12 : h % 12;
        setPickerHour(h12);
        setPickerMinute(m);
        setNativeTimeInput(medTimes[0]);
      }
    } else {
      setName('');
      setDosage('');
      setForm('tablet');
      setInstructions('With meal');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setIsOngoing(true);
      
      // Default to next round hour
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      const defaultTime = `${String(d.getHours()).padStart(2, '0')}:00`;
      setTimes([defaultTime]);
      setFrequency('daily');
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      setColor('teal');
      setInventoryCount(30);
      setLowThreshold(7);
      setNotes('');

      const [h, m] = defaultTime.split(':').map(Number);
      setPickerPeriod(h >= 12 ? 'PM' : 'AM');
      const h12 = h % 12 === 0 ? 12 : h % 12;
      setPickerHour(h12);
      setPickerMinute(m);
      setNativeTimeInput(defaultTime);
    }
    setEditingTimeIndex(null);
  }, [editingMedicine, isAddEditModalOpen]);

  if (!isAddEditModalOpen) return null;

  const handleClose = () => {
    setIsAddEditModalOpen(false);
    setEditingMedicine(null);
  };

  // Add timing from 12h picker
  const handleAddFrom12hPicker = () => {
    const time24 = convert12To24(pickerHour, pickerMinute, pickerPeriod);
    if (editingTimeIndex !== null) {
      // update existing
      const updated = [...times];
      updated[editingTimeIndex] = time24;
      setTimes(Array.from(new Set(updated)).sort());
      setEditingTimeIndex(null);
    } else {
      if (!times.includes(time24)) {
        setTimes([...times, time24].sort());
      }
    }
  };

  // Add specific 24h string
  const handleAddDirectTime = (t24: string) => {
    if (!t24) return;
    if (!times.includes(t24)) {
      setTimes([...times, t24].sort());
    }
  };

  // Remove time
  const handleRemoveTime = (timeToRemove: string) => {
    if (times.length <= 1) {
      alert('Your medicine must have at least one alarm time.');
      return;
    }
    setTimes(times.filter((t) => t !== timeToRemove));
    if (editingTimeIndex !== null) setEditingTimeIndex(null);
  };

  // Load a timing into the picker for editing
  const handleSelectTimeForEdit = (timeStr: string, idx: number) => {
    setEditingTimeIndex(idx);
    const [h, m] = timeStr.split(':').map(Number);
    setPickerPeriod(h >= 12 ? 'PM' : 'AM');
    const h12 = h % 12 === 0 ? 12 : h % 12;
    setPickerHour(h12);
    setPickerMinute(m);
    setNativeTimeInput(timeStr);
  };

  // Quick In X Minutes convenient button
  const handleAddInMinutes = (mins: number) => {
    const target = new Date(Date.now() + mins * 60000);
    const h = String(target.getHours()).padStart(2, '0');
    const m = String(target.getMinutes()).padStart(2, '0');
    const t24 = `${h}:${m}`;
    handleAddDirectTime(t24);
  };

  // Generate convenient interval dosing (e.g. 2 times daily at 8am and 8pm)
  const handleApplyIntervalDosing = (timesPerDay: number, startH: number) => {
    const newTimes: string[] = [];
    const intervalHours = 24 / timesPerDay;
    for (let i = 0; i < timesPerDay; i++) {
      const h = (startH + Math.round(i * intervalHours)) % 24;
      newTimes.push(`${String(h).padStart(2, '0')}:00`);
    }
    setTimes(newTimes.sort());
    setShowIntervalWizard(false);
  };

  const toggleDay = (dayIndex: number) => {
    if (daysOfWeek.includes(dayIndex)) {
      if (daysOfWeek.length <= 1) return;
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayIndex));
    } else {
      setDaysOfWeek([...daysOfWeek, dayIndex].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter medicine name');
      return;
    }
    if (!dosage.trim()) {
      alert('Please enter dosage');
      return;
    }
    if (times.length === 0) {
      alert('Please add at least one convenient alarm time');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMedicine({
        name: name.trim(),
        dosage: dosage.trim(),
        form,
        instructions,
        startDate,
        endDate: isOngoing ? '' : endDate,
        times: times.sort(),
        frequency,
        daysOfWeek,
        color,
        inventory: {
          count: Number(inventoryCount) || 0,
          lowThreshold: Number(lowThreshold) || 5,
          unit: form === 'syrup' || form === 'drops' ? 'ml' : 'doses'
        },
        notes: notes.trim(),
        active: true
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const convenientRoutinePresets = [
    { label: 'Morning (8:00 AM)', time: '08:00', icon: Sun },
    { label: 'Breakfast (9:00 AM)', time: '09:00', icon: Coffee },
    { label: 'Lunch (1:00 PM)', time: '13:00', icon: Utensils },
    { label: 'Evening Tea (5:00 PM)', time: '17:00', icon: Sunset },
    { label: 'Dinner (8:00 PM)', time: '20:00', icon: Utensils },
    { label: 'Bedtime (10:00 PM)', time: '22:00', icon: Moon }
  ];

  const popularMedSuggestions = [
    { name: 'Metformin', dosage: '500 mg', form: 'tablet' as MedicineForm, instructions: 'With meal' as FoodInstruction },
    { name: 'Lisinopril', dosage: '10 mg', form: 'tablet' as MedicineForm, instructions: 'Before meal' as FoodInstruction },
    { name: 'Atorvastatin', dosage: '20 mg', form: 'tablet' as MedicineForm, instructions: 'At bedtime' as FoodInstruction },
    { name: 'Amoxicillin', dosage: '500 mg', form: 'capsule' as MedicineForm, instructions: 'With meal' as FoodInstruction },
    { name: 'Vitamin D3', dosage: '2000 IU', form: 'capsule' as MedicineForm, instructions: 'After meal' as FoodInstruction },
    { name: 'Omeprazole', dosage: '20 mg', form: 'capsule' as MedicineForm, instructions: 'Empty stomach' as FoodInstruction }
  ];

  const applySuggestion = (s: typeof popularMedSuggestions[0]) => {
    setName(s.name);
    setDosage(s.dosage);
    setForm(s.form);
    setInstructions(s.instructions);
  };

  const daysLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
              <Pill className="h-5 w-5 rotate-[-45deg]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {editingMedicine ? 'Edit Medicine & Convenient Timings' : 'Add Medicine & Convenient Timings'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose convenient times, routine presets, or custom intervals
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills for New Medicine */}
        {!editingMedicine && (
          <div className="mt-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              <span>Quick Medicine Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {popularMedSuggestions.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-medium hover:bg-teal-100 transition cursor-pointer"
                >
                  + {s.name} ({s.dosage})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Row 1: Name and Dosage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Metformin, Lisinopril"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Dosage *
              </label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500 mg, 1 tablet, 10 ml"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Row 2: Form & Food Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Form / Type
              </label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value as MedicineForm)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              >
                <option value="tablet">Tablet / Pill</option>
                <option value="capsule">Capsule</option>
                <option value="syrup">Syrup / Liquid</option>
                <option value="drops">Drops (Eye/Ear)</option>
                <option value="inhaler">Inhaler / Spray</option>
                <option value="injection">Injection / Pen</option>
                <option value="cream">Cream / Ointment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Food Instructions
              </label>
              <select
                value={instructions}
                onChange={(e) => setInstructions(e.target.value as FoodInstruction)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              >
                <option value="With meal">With meal</option>
                <option value="Before meal">Before meal (30 min prior)</option>
                <option value="After meal">After meal</option>
                <option value="Empty stomach">Empty stomach</option>
                <option value="At bedtime">At bedtime</option>
                <option value="As needed">As needed (PRN)</option>
              </select>
            </div>
          </div>

          {/* Row 3: CONVENIENT TIMINGS BUILDER (Key Feature) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                    Alarm Timings (Add as per your convenience)
                  </h3>
                  <p className="text-[11px] text-teal-700 dark:text-teal-300">
                    Add multiple alarm times, pick routine presets, or set custom 12-hour AM/PM times.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowIntervalWizard(!showIntervalWizard)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 transition cursor-pointer"
                >
                  <Repeat className="h-3.5 w-3.5" />
                  <span>Dose Interval Wizard</span>
                </button>
              </div>
            </div>

            {/* Interval Dosing Wizard Drawer if toggled */}
            {showIntervalWizard && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    Automatic Interval Dosing Schedule:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowIntervalWizard(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyIntervalDosing(1, intervalStartHour)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-left hover:border-teal-500 bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">1x Daily</div>
                    <div className="text-[10px] text-slate-500">Every 24 hours</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyIntervalDosing(2, intervalStartHour)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-left hover:border-teal-500 bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">2x Daily</div>
                    <div className="text-[10px] text-slate-500">Every 12 hours (8am, 8pm)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyIntervalDosing(3, intervalStartHour)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-left hover:border-teal-500 bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">3x Daily</div>
                    <div className="text-[10px] text-slate-500">Every 8 hours (8am, 4pm, 12am)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyIntervalDosing(4, intervalStartHour)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-left hover:border-teal-500 bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">4x Daily</div>
                    <div className="text-[10px] text-slate-500">Every 6 hours (6am, 12pm, 6pm, 12am)</div>
                  </button>
                </div>
              </div>
            )}

            {/* Currently Configured Timings List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Configured Alarms ({times.length} daily):
                </span>
                <span className="text-[11px] text-slate-500">
                  Click any timing to edit or remove
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {times.map((t, idx) => {
                  const isBeingEdited = editingTimeIndex === idx;
                  return (
                    <div
                      key={t}
                      className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border font-mono text-xs font-bold transition shadow-xs ${
                        isBeingEdited
                          ? 'bg-teal-600 text-white border-teal-700 ring-2 ring-teal-400'
                          : 'bg-white dark:bg-slate-900 border-teal-300 dark:border-teal-800 text-slate-900 dark:text-white hover:border-teal-500'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectTimeForEdit(t, idx)}
                        className="flex items-center gap-1.5 cursor-pointer text-left"
                        title="Click to edit this alarm time"
                      >
                        <span className="text-sm font-black">{formatTo12Hour(t)}</span>
                        <span className="text-[10px] opacity-70">({t})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(t)}
                        className={`p-1 rounded-md transition cursor-pointer ${
                          isBeingEdited
                            ? 'text-white/80 hover:text-white hover:bg-teal-700'
                            : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Remove alarm time"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive 12-Hour AM/PM Time Builder */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5 text-teal-600" />
                  <span>
                    {editingTimeIndex !== null ? 'Modify Selected Timing' : 'Set Your Convenient Timing'}
                  </span>
                </span>
                {editingTimeIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setEditingTimeIndex(null)}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {/* Time Stepper Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Hour Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Hour:</span>
                  <select
                    value={pickerHour}
                    onChange={(e) => setPickerHour(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minute Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Min:</span>
                  <select
                    value={pickerMinute}
                    onChange={(e) => setPickerMinute(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white font-mono"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AM / PM Toggle */}
                <div className="flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPickerPeriod('AM')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      pickerPeriod === 'AM'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerPeriod('PM')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      pickerPeriod === 'PM'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    PM
                  </button>
                </div>

                {/* Confirm Add / Update Button */}
                <button
                  type="button"
                  onClick={handleAddFrom12hPicker}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition cursor-pointer ml-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {editingTimeIndex !== null ? 'Update Timing' : 'Add This Timing'}
                  </span>
                </button>
              </div>

              {/* Quick Minutes from Now for Immediate Testing */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Quick test timings:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddInMinutes(1)}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-100 transition cursor-pointer"
                >
                  + In 1 minute
                </button>
                <button
                  type="button"
                  onClick={() => handleAddInMinutes(2)}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-100 transition cursor-pointer"
                >
                  + In 2 minutes
                </button>
                <button
                  type="button"
                  onClick={() => handleAddInMinutes(5)}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-100 transition cursor-pointer"
                >
                  + In 5 minutes
                </button>
              </div>
            </div>

            {/* Daily Routine Presets */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Convenient Daily Routine Times (One-Tap Add):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {convenientRoutinePresets.map((preset) => {
                  const Icon = preset.icon;
                  const isAdded = times.includes(preset.time);
                  return (
                    <button
                      key={preset.time}
                      type="button"
                      onClick={() => handleAddDirectTime(preset.time)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                        isAdded
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isAdded ? 'text-teal-600' : 'text-slate-400'}`} />
                      <div className="truncate">
                        <div className="font-semibold text-[11px]">{preset.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatTo12Hour(preset.time)}
                        </div>
                      </div>
                      {isAdded && <Check className="h-3 w-3 text-teal-600 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 4: Frequency & Days of Week */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ReminderFrequency)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              >
                <option value="daily">Every Day (Daily)</option>
                <option value="weekly">Specific Days of Week</option>
                <option value="custom">Custom Schedule</option>
              </select>
            </div>

            {/* Days selector if weekly/custom */}
            {(frequency === 'weekly' || frequency === 'custom') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Days of Week
                </label>
                <div className="flex gap-1 justify-between">
                  {daysLabel.map((day, idx) => {
                    const isSelected = daysOfWeek.includes(idx);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {day[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row 5: Start & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  End Date
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOngoing}
                    onChange={(e) => setIsOngoing(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Ongoing Prescriptions</span>
                </label>
              </div>
              <input
                type="date"
                disabled={isOngoing}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Row 6: Inventory Count & Low Stock Alert */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              <Package className="h-4 w-4 text-teal-600" />
              <span>Inventory & Refill Warning</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Current Doses in Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={inventoryCount}
                  onChange={(e) => setInventoryCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowThreshold}
                  onChange={(e) => setLowThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Doctor's Advice or Patient Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Take with a full glass of water. Do not lie down for 30 minutes."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : editingMedicine ? 'Save Convenient Timings' : 'Save Medicine & Timings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
