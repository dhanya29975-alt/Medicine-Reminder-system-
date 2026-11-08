import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  Volume2,
  VolumeX,
  PhoneCall,
  AlertTriangle,
  Info,
  Pill,
  Sparkles
} from 'lucide-react';
import { ActiveAlarmDose } from '../types';
import { useApp } from '../context/AppContext';
import { audioEngine } from '../services/audioEngine';
import { formatTo12Hour } from './AddEditMedicineModal';

interface AlarmModalProps {
  dose: ActiveAlarmDose;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({ dose }) => {
  const {
    handleTaken,
    handleSnooze,
    handleSkip,
    user,
    settings,
    currentTime
  } = useApp();

  const [isMuted, setIsMuted] = useState(false);
  const [showSkipReason, setShowSkipReason] = useState(false);
  const [skipReason, setSkipReason] = useState('Skipped by user');
  const [customReason, setCustomReason] = useState('');
  const [secondsRinging, setSecondsRinging] = useState(0);

  // Track ringing duration
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRinging((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    if (isMuted) {
      audioEngine.startAlarm(settings.alarmSound, settings.volume, settings.vibration);
      setIsMuted(false);
    } else {
      audioEngine.stopAlarm();
      setIsMuted(true);
    }
  };

  const formattedCurrentTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleConfirmSkip = () => {
    const finalReason = customReason.trim() ? customReason : skipReason;
    handleSkip(dose, finalReason);
  };

  const commonSkipReasons = [
    'Not feeling well / Nauseous',
    'Ran out of medication',
    'Doctor advised to pause',
    'Already took earlier',
    'Away from home / Forgot dose'
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto bg-slate-950/95 text-white backdrop-blur-md transition-all select-none"
    >
      {/* Background pulsing radar aura */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-teal-500/10 animate-ping duration-1000" />
        <div className="w-[700px] h-[700px] rounded-full bg-rose-500/10 animate-pulse duration-700" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/50 animate-bounce">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-rose-400 uppercase">
                {dose.isSnoozed ? `Snooze Alert #${dose.snoozeCount}` : 'Medicine Alarm Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ringing for {secondsRinging}s • Sound: {settings.alarmSound}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Unmute audio button */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              isMuted
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute alarm sound' : 'Mute sound temporarily'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-amber-400" /> : <Volume2 className="h-4 w-4 text-teal-400" />}
            <span>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          {/* Emergency Contact Quick Call if available */}
          {user?.emergencyContact?.phone && (
            <a
              href={`tel:${user.emergencyContact.phone}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600/30 border border-red-500/40 text-red-200 text-xs sm:text-sm hover:bg-red-600/50 transition"
              title={`Call emergency contact: ${user.emergencyContact.name}`}
            >
              <PhoneCall className="h-4 w-4" />
              <span className="hidden sm:inline">SOS Contact</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full">
        {/* Live Digital Clock */}
        <div className="mb-2 font-mono text-3xl sm:text-5xl font-black tracking-tight text-white/90 drop-shadow">
          {formattedCurrentTime}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-xs sm:text-sm text-slate-300 mb-6">
          <Clock className="h-4 w-4 text-teal-400" />
          <span>Scheduled Time: <strong>{formatTo12Hour(dose.scheduledTime)}</strong> ({dose.scheduledTime})</span>
        </div>

        {/* Pulsing Pill Icon Visual */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-teal-500 to-rose-500 opacity-30 blur-xl animate-pulse" />
          <div className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 text-white shadow-2xl shadow-teal-500/40 ring-4 ring-white/20">
            <Pill className="h-16 w-16 sm:h-20 sm:w-20 rotate-[-45deg] animate-pulse" />
          </div>
        </div>

        {/* Alarm Alert Message */}
        <div className="inline-block px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-sm sm:text-base tracking-wide uppercase mb-3 animate-pulse">
          It's time to take your medicine!
        </div>

        {/* Medicine Name & Dosage */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
          {dose.medicine.name}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 font-semibold text-base sm:text-lg">
            {dose.medicine.dosage}
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-slate-200 font-medium text-sm sm:text-base">
            {dose.medicine.form.toUpperCase()}
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 font-medium text-sm sm:text-base flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            {dose.medicine.instructions}
          </span>
        </div>

        {/* Notes if any */}
        {dose.medicine.notes && (
          <p className="text-xs sm:text-sm text-slate-300 max-w-md bg-white/5 rounded-xl p-3 border border-white/10 italic">
            "{dose.medicine.notes}"
          </p>
        )}
      </div>

      {/* Action Buttons Container */}
      <div className="relative z-10 p-4 sm:p-8 bg-slate-900/80 border-t border-white/10 backdrop-blur-lg">
        <div className="max-w-xl mx-auto w-full">
          {!showSkipReason ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* 1. TAKEN BUTTON (Dominant Green) */}
              <button
                onClick={() => handleTaken(dose)}
                className="flex-1 flex items-center justify-center gap-3 py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-lg sm:text-xl shadow-xl shadow-emerald-500/30 active:scale-98 transition transform cursor-pointer border border-emerald-400/30"
              >
                <CheckCircle2 className="h-7 w-7" />
                <span>TAKEN</span>
              </button>

              {/* 2. SNOOZE BUTTON (Amber) */}
              <button
                onClick={() => handleSnooze(dose)}
                className="flex-1 flex items-center justify-center gap-2 py-4 sm:py-5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base sm:text-lg shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                <Clock className="h-6 w-6" />
                <span>SNOOZE ({settings.snoozeDurationMinutes}m)</span>
              </button>

              {/* 3. SKIP BUTTON (Slate/Rose) */}
              <button
                onClick={() => setShowSkipReason(true)}
                className="flex-1 flex items-center justify-center gap-2 py-4 sm:py-5 px-5 rounded-2xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-white/15 text-slate-300 font-semibold text-base sm:text-lg active:scale-98 transition cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
                <span>SKIP</span>
              </button>
            </div>
          ) : (
            /* Skip Reason Drawer */
            <div className="bg-slate-900 rounded-2xl p-4 border border-rose-500/30 animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Select reason for skipping this dose:</span>
                </div>
                <button
                  onClick={() => setShowSkipReason(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {commonSkipReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setSkipReason(reason);
                      setCustomReason('');
                    }}
                    className={`text-left text-xs p-2.5 rounded-xl border transition ${
                      skipReason === reason && !customReason
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Or type a custom note..."
                className="w-full mb-3 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleConfirmSkip}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow transition"
                >
                  Confirm Skip
                </button>
                <button
                  onClick={() => setShowSkipReason(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 text-sm transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
