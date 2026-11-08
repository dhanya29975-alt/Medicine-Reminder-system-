import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BellRing,
  Pill,
  Sun,
  Sunset,
  Moon,
  Filter,
  Plus,
  Edit2,
  Calendar,
  X,
  Check,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Medicine } from '../types';
import { formatTo12Hour, convert12To24 } from './AddEditMedicineModal';

export const MedicineSchedule: React.FC = () => {
  const {
    medicines,
    history,
    snoozedList,
    currentTime,
    handleTaken,
    handleSnooze,
    handleSkip,
    triggerAlarmNow,
    setIsAddEditModalOpen,
    setEditingMedicine,
    saveMedicine
  } = useApp();

  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Reschedule Dialog State
  const [reschedulingItem, setReschedulingItem] = useState<{
    medicine: Medicine;
    oldTime: string;
  } | null>(null);
  const [rescheduleHour, setRescheduleHour] = useState<number>(8);
  const [rescheduleMinute, setRescheduleMinute] = useState<number>(0);
  const [reschedulePeriod, setReschedulePeriod] = useState<'AM' | 'PM'>('AM');

  const todayStr = currentTime.toISOString().split('T')[0];
  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;
  const currentDayOfWeek = currentTime.getDay();

  // Compute all doses for today
  const scheduleItems = useMemo(() => {
    const list: Array<{
      key: string;
      medicine: Medicine;
      time: string;
      period: 'morning' | 'afternoon' | 'evening';
      status: 'taken' | 'snoozed' | 'skipped' | 'upcoming' | 'overdue';
      historyItem?: any;
      snoozedItem?: any;
    }> = [];

    medicines.forEach((med) => {
      if (!med.active) return;
      if (med.startDate && todayStr < med.startDate) return;
      if (med.endDate && todayStr > med.endDate) return;

      if (med.frequency === 'weekly' || med.frequency === 'custom') {
        if (!med.daysOfWeek || !med.daysOfWeek.includes(currentDayOfWeek)) return;
      }

      med.times.forEach((t) => {
        const hour = parseInt(t.split(':')[0], 10);
        let period: 'morning' | 'afternoon' | 'evening' = 'morning';
        if (hour >= 12 && hour < 17) period = 'afternoon';
        else if (hour >= 17) period = 'evening';

        const hist = history.find(
          (h) =>
            h.medicineId === med.id &&
            h.scheduledTime.startsWith(todayStr) &&
            h.scheduledTime.endsWith(t)
        );

        const snoozed = snoozedList.find((s) => s.medicine.id === med.id && s.originalTime === t);

        let status: 'taken' | 'snoozed' | 'skipped' | 'upcoming' | 'overdue' = 'upcoming';
        if (hist) {
          if (hist.status === 'taken') status = 'taken';
          else if (hist.status === 'skipped') status = 'skipped';
        } else if (snoozed) {
          status = 'snoozed';
        } else if (t < currentTimeString) {
          status = 'overdue';
        }

        list.push({
          key: `${med.id}_${t}`,
          medicine: med,
          time: t,
          period,
          status,
          historyItem: hist,
          snoozedItem: snoozed
        });
      });
    });

    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [medicines, history, snoozedList, todayStr, currentDayOfWeek, currentTimeString]);

  const filteredItems = scheduleItems.filter((item) => {
    if (periodFilter === 'all') return true;
    return item.period === periodFilter;
  });

  const handleOpenReschedule = (med: Medicine, oldTime: string) => {
    setReschedulingItem({ medicine: med, oldTime });
    const [h, m] = oldTime.split(':').map(Number);
    setReschedulePeriod(h >= 12 ? 'PM' : 'AM');
    const h12 = h % 12 === 0 ? 12 : h % 12;
    setRescheduleHour(h12);
    setRescheduleMinute(m);
  };

  const handleSaveRescheduledTime = async (newTime24: string) => {
    if (!reschedulingItem) return;
    const { medicine, oldTime } = reschedulingItem;
    // Replace oldTime with newTime24 in medicine.times
    const updatedTimes = medicine.times
      .filter((t) => t !== oldTime)
      .concat(newTime24)
      .sort();
    await saveMedicine({
      ...medicine,
      times: Array.from(new Set(updatedTimes))
    });
    setReschedulingItem(null);
  };

  const handleShiftMinutes = (minutesToAdd: number) => {
    const target = new Date(Date.now() + minutesToAdd * 60000);
    const h = String(target.getHours()).padStart(2, '0');
    const m = String(target.getMinutes()).padStart(2, '0');
    handleSaveRescheduledTime(`${h}:${m}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-7 w-7 text-teal-600" />
            <span>Today's Medicine Schedule</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time alarms ring continuously at your designated convenient timings
          </p>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Doses ({scheduleItems.length})
          </button>
          <button
            onClick={() => setPeriodFilter('morning')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodFilter === 'morning'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Morning</span>
          </button>
          <button
            onClick={() => setPeriodFilter('afternoon')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodFilter === 'afternoon'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sunset className="h-3.5 w-3.5 text-orange-500" />
            <span>Afternoon</span>
          </button>
          <button
            onClick={() => setPeriodFilter('evening')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodFilter === 'evening'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Moon className="h-3.5 w-3.5 text-indigo-500" />
            <span>Evening</span>
          </button>
        </div>
      </div>

      {/* Schedule Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Doses Found for this Filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Try switching to 'All Doses' or add a new medicine reminder for this period.
          </p>
          <button
            onClick={() => {
              setEditingMedicine(null);
              setIsAddEditModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Medicine Reminder</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const activeDoseObj = {
              id: `sched_${item.medicine.id}_${todayStr}_${item.time}`,
              medicine: item.medicine,
              scheduledTime: item.time,
              scheduledDate: todayStr,
              triggeredAt: Date.now()
            };

            return (
              <div
                key={item.key}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-xs ${
                  item.status === 'taken'
                    ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20'
                    : item.status === 'overdue'
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 ring-1 ring-rose-500/30'
                    : item.status === 'snoozed'
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-500/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Time & Medicine Details */}
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Big Digital Clock Box with 12-Hour format */}
                    <div className="flex flex-col items-center justify-center min-w-[95px] py-3 px-3 rounded-2xl bg-slate-900 text-white font-mono text-center shadow-sm">
                      <span className="text-base sm:text-lg font-black tracking-tight">
                        {formatTo12Hour(item.time)}
                      </span>
                      <span className="text-[10px] text-teal-400 font-bold tracking-widest uppercase">
                        {item.time} 24H
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {item.medicine.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold">
                          {item.medicine.dosage}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase">
                          {item.medicine.form}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                          {item.medicine.instructions}
                        </span>
                        {item.medicine.notes && (
                          <span className="italic max-w-sm truncate text-slate-400">
                            "{item.medicine.notes}"
                          </span>
                        )}
                        {item.medicine.inventory && (
                          <span>
                            Inventory: {item.medicine.inventory.count} {item.medicine.inventory.unit} remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    {/* Status Badge */}
                    {item.status === 'taken' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Taken ({formatTo12Hour(item.historyItem?.actualTime?.split(' ')[1] || item.time)})</span>
                      </span>
                    )}

                    {item.status === 'snoozed' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-xs animate-pulse">
                        <Clock className="h-4 w-4" />
                        <span>Snoozed (Will Ring Soon)</span>
                      </span>
                    )}

                    {item.status === 'skipped' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                        <XCircle className="h-4 w-4" />
                        <span>Skipped ({item.historyItem?.reason || 'User choice'})</span>
                      </span>
                    )}

                    {item.status === 'overdue' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-xs animate-pulse">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Overdue</span>
                      </span>
                    )}

                    {/* Operational Actions */}
                    {item.status !== 'taken' && (
                      <>
                        <button
                          onClick={() => handleTaken(activeDoseObj)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Mark Taken</span>
                        </button>

                        <button
                          onClick={() => handleSnooze(activeDoseObj)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition cursor-pointer"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Snooze</span>
                        </button>

                        {/* Adjust / Shift Timing as per user convenience */}
                        <button
                          onClick={() => handleOpenReschedule(item.medicine, item.time)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                          title="Change or shift timing as per your convenience"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Change Time</span>
                        </button>

                        <button
                          onClick={() => handleSkip(activeDoseObj, 'Skipped from schedule')}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                        >
                          Skip
                        </button>
                      </>
                    )}

                    {/* Simulate Ring Button */}
                    <button
                      onClick={() => triggerAlarmNow(item.medicine, item.time)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                      title="Test alarm clock sound for this medicine right now"
                    >
                      <BellRing className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Convenient Reschedule / Timing Adjustment Modal */}
      {reschedulingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Change Timing to Your Convenience
                </h3>
              </div>
              <button
                onClick={() => setReschedulingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Rescheduling <strong>{reschedulingItem.medicine.name}</strong> from{' '}
              <span className="font-mono text-teal-600 font-bold">
                {formatTo12Hour(reschedulingItem.oldTime)}
              </span>
              :
            </p>

            {/* Quick Shift Presets */}
            <div className="mb-4 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Shift Options:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleShiftMinutes(15)}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500 cursor-pointer"
                >
                  +15 Minutes
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftMinutes(30)}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500 cursor-pointer"
                >
                  +30 Minutes
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftMinutes(60)}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500 cursor-pointer"
                >
                  +1 Hour
                </button>
              </div>
            </div>

            {/* Custom 12-Hour Picker */}
            <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 mb-4 space-y-2">
              <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                Or Pick Exact Convenient Time:
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={rescheduleHour}
                  onChange={(e) => setRescheduleHour(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  value={rescheduleMinute}
                  onChange={(e) => setRescheduleMinute(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white font-mono"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>

                <div className="flex rounded-xl p-0.5 bg-slate-200 dark:bg-slate-800 ml-auto">
                  <button
                    type="button"
                    onClick={() => setReschedulePeriod('AM')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      reschedulePeriod === 'AM'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setReschedulePeriod('PM')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      reschedulePeriod === 'PM'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const t24 = convert12To24(rescheduleHour, rescheduleMinute, reschedulePeriod);
                  handleSaveRescheduledTime(t24);
                }}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30"
              >
                Set New Timing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
