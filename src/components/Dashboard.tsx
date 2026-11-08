import React, { useMemo, useState } from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  BellRing,
  ArrowRight,
  TrendingUp,
  Volume2,
  ShieldAlert,
  Flame,
  Calendar,
  Sparkles,
  Plus,
  Download,
  Smartphone,
  QrCode
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Medicine } from '../types';
import { formatTo12Hour } from './AddEditMedicineModal';
import { InstallPublishModal } from './InstallPublishModal';

export const Dashboard: React.FC = () => {
  const {
    medicines,
    history,
    settings,
    currentTime,
    setCurrentTab,
    triggerAlarmNow,
    setIsAddEditModalOpen,
    setEditingMedicine,
    handleTaken,
    handleSnooze,
    handleSkip,
    requestNotificationPermission,
    snoozedList
  } = useApp();

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const todayStr = currentTime.toISOString().split('T')[0];
  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;
  const currentDayOfWeek = currentTime.getDay();

  // 1. Compute today's scheduled doses across all active medicines
  const todayDoses = useMemo(() => {
    const list: Array<{
      key: string;
      medicine: Medicine;
      time: string;
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
        // check history for today
        const schedTimeKey = `${todayStr} ${t}`;
        const hist = history.find(
          (h) =>
            h.medicineId === med.id &&
            h.scheduledTime.startsWith(todayStr) &&
            h.scheduledTime.endsWith(t)
        );

        // check if snoozed
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
          status,
          historyItem: hist,
          snoozedItem: snoozed
        });
      });
    });

    // Sort chronologically by time
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [medicines, history, snoozedList, todayStr, currentDayOfWeek, currentTimeString]);

  // 2. Metrics calculation
  const totalMedicines = medicines.length;
  const totalTodayScheduled = todayDoses.length;
  const completedToday = todayDoses.filter((d) => d.status === 'taken').length;
  const skippedToday = todayDoses.filter((d) => d.status === 'skipped').length;
  const overdueToday = todayDoses.filter((d) => d.status === 'overdue').length;
  const upcomingToday = todayDoses.filter((d) => d.status === 'upcoming').length;

  const adherenceRate =
    totalTodayScheduled > 0 ? Math.round((completedToday / totalTodayScheduled) * 100) : 100;

  // 3. Next Upcoming Alarm
  const nextDose = useMemo(() => {
    // If there is an active snooze, prioritize it
    if (snoozedList.length > 0) {
      const firstSnooze = snoozedList[0];
      const snoozeMinutesRemaining = Math.max(1, Math.round((firstSnooze.ringAt - currentTime.getTime()) / 60000));
      return {
        medicine: firstSnooze.medicine,
        time: firstSnooze.originalTime,
        isSnoozed: true,
        diffMinutes: snoozeMinutesRemaining,
        label: `Snoozed dose rings in ${snoozeMinutesRemaining}m`
      };
    }

    const upcoming = todayDoses.find((d) => d.status === 'upcoming' && d.time >= currentTimeString);
    if (upcoming) {
      const [uH, uM] = upcoming.time.split(':').map(Number);
      const diffMin = (uH - Number(currentHours)) * 60 + (uM - Number(currentMinutes));
      return {
        medicine: upcoming.medicine,
        time: upcoming.time,
        isSnoozed: false,
        diffMinutes: diffMin,
        label: `Next alarm in ${diffMin > 0 ? `${diffMin} min` : 'less than a minute'}`
      };
    }
    return null;
  }, [snoozedList, todayDoses, currentTimeString, currentHours, currentMinutes, currentTime]);

  // 4. Low Inventory Warnings
  const lowStockMedicines = medicines.filter(
    (m) => m.inventory && m.inventory.count <= m.inventory.lowThreshold
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Notification Permission Banner if not granted */}
      {settings.notificationPermission !== 'granted' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Enable Real-Time Background Notifications</p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Allow browser notifications so alarms trigger and vibrate reliably even when the tab is in the background or your device screen is locked.
              </p>
            </div>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="whitespace-nowrap px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            Allow Notifications
          </button>
        </div>
      )}

      {/* Hero Alarm Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-teal-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
              Real-Time Alarm System Active
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {nextDose ? (
                <>
                  {nextDose.label}:{' '}
                  <span className="text-teal-400">{nextDose.medicine.name}</span>
                </>
              ) : (
                <>All scheduled doses completed for today!</>
              )}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              {nextDose
                ? `Dosage: ${nextDose.medicine.dosage} (${nextDose.medicine.instructions}). Continuous sound will ring automatically at ${formatTo12Hour(nextDose.time)}.`
                : 'Great job staying on track with your medical regimen. Check your history or schedule new reminders below.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {nextDose && (
              <button
                onClick={() => triggerAlarmNow(nextDose.medicine, nextDose.time)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/30 active:scale-95 transition cursor-pointer"
                title="Preview full-screen ringing alarm clock right now"
              >
                <BellRing className="h-4 w-4 animate-bounce" />
                <span>Simulate Alarm</span>
              </button>
            )}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 font-bold text-sm transition cursor-pointer"
              title="Install MediAlarm as a mobile app, scan QR code, or view publish options"
            >
              <Smartphone className="h-4 w-4 text-teal-300" />
              <span>Install & Publish</span>
            </button>
            <button
              onClick={() => setCurrentTab('schedule')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm transition cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-teal-400" />
              <span>Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Medicines */}
        <div
          onClick={() => setCurrentTab('medicines')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Meds</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition">
              <Pill className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalMedicines}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active prescriptions</p>
        </div>

        {/* Today's Scheduled */}
        <div
          onClick={() => setCurrentTab('schedule')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Doses</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalTodayScheduled}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {upcomingToday} upcoming
          </p>
        </div>

        {/* Completed Doses */}
        <div
          onClick={() => setCurrentTab('history')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {completedToday}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Doses taken on time</p>
        </div>

        {/* Missed / Overdue */}
        <div
          onClick={() => setCurrentTab('schedule')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue / Skipped</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {overdueToday + skippedToday}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {overdueToday} overdue, {skippedToday} skipped
          </p>
        </div>

        {/* Adherence Rate */}
        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/30 shadow-xs">
          <div className="flex items-center justify-between text-teal-800 dark:text-teal-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Compliance</span>
            <div className="p-2 rounded-xl bg-teal-500 text-white">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300">
            {adherenceRate}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${adherenceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockMedicines.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
          <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-300 text-sm mb-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>Low Medication Inventory Alert:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockMedicines.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-medium"
              >
                <strong>{m.name}</strong>: only {m.inventory?.count} {m.inventory?.unit} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Today's Dosage Schedule Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <span>Today's Medicine Schedule</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automatic alarms will ring at the designated minutes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingMedicine(null);
                setIsAddEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Reminder</span>
            </button>
            <button
              onClick={() => setCurrentTab('schedule')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              <span>View Timeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {todayDoses.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 mb-3">
              <Pill className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Medicines Scheduled for Today
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add your daily or weekly prescriptions to begin receiving real-time alarm clock notifications.
            </p>
            <button
              onClick={() => {
                setEditingMedicine(null);
                setIsAddEditModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-500 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Medicine</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {todayDoses.map((dose) => {
              const activeDoseObj = {
                id: `dose_${dose.medicine.id}_${todayStr}_${dose.time}`,
                medicine: dose.medicine,
                scheduledTime: dose.time,
                scheduledDate: todayStr,
                triggeredAt: Date.now()
              };

              return (
                <div
                  key={dose.key}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 rounded-2xl px-3 transition"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Time Badge */}
                    <div className="flex flex-col items-center justify-center min-w-[85px] py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-center border border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {formatTo12Hour(dose.time)}
                      </span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                        {dose.time}
                      </span>
                    </div>

                    {/* Pill Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">
                          {dose.medicine.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-semibold">
                          {dose.medicine.dosage}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="capitalize">{dose.medicine.form}</span>
                        <span>•</span>
                        <span>{dose.medicine.instructions}</span>
                        {dose.medicine.inventory && (
                          <>
                            <span>•</span>
                            <span className={dose.medicine.inventory.count <= dose.medicine.inventory.lowThreshold ? 'text-rose-500 font-bold' : ''}>
                              {dose.medicine.inventory.count} left
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Immediate Action */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {dose.status === 'taken' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Taken</span>
                      </span>
                    )}

                    {dose.status === 'snoozed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold animate-pulse">
                        <Clock className="h-4 w-4" />
                        <span>Snoozed</span>
                      </span>
                    )}

                    {dose.status === 'skipped' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
                        <XCircle className="h-4 w-4" />
                        <span>Skipped</span>
                      </span>
                    )}

                    {dose.status === 'overdue' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Overdue</span>
                      </span>
                    )}

                    {dose.status === 'upcoming' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Scheduled</span>
                      </span>
                    )}

                    {/* Quick Trigger / Action Buttons if not taken */}
                    {dose.status !== 'taken' && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          onClick={() => handleTaken(activeDoseObj)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                          title="Record this dose as taken right now"
                        >
                          Mark Taken
                        </button>
                        <button
                          onClick={() => triggerAlarmNow(dose.medicine, dose.time)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition cursor-pointer"
                          title="Test ring alarm for this medicine"
                        >
                          <BellRing className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Install & Publish Modal */}
      <InstallPublishModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
