import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Play,
  Square,
  Clock,
  Mic,
  Vibrate,
  Eye,
  Shield,
  PhoneCall,
  BellRing,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AlarmSoundType } from '../types';
import { audioEngine } from '../services/audioEngine';
import { downloadCalendarICS } from '../services/calendarExport';
import { Calendar, Download, Smartphone, HelpCircle, Share2 } from 'lucide-react';
import { InstallPublishModal } from './InstallPublishModal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    user,
    medicines,
    resetToDemo,
    requestNotificationPermission
  } = useApp();

  const [previewingSound, setPreviewingSound] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [sosName, setSosName] = useState(user?.emergencyContact?.name || '');
  const [sosRelation, setSosRelation] = useState(user?.emergencyContact?.relation || '');
  const [sosPhone, setSosPhone] = useState(user?.emergencyContact?.phone || '');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const ringtones: Array<{ id: AlarmSoundType; label: string; desc: string }> = [
    {
      id: 'digital',
      label: 'Classic Digital Beep',
      desc: 'Crisp 4-beep digital wristwatch pattern. Loud, unmistakable, and attention-grabbing.'
    },
    {
      id: 'chime',
      label: 'Gentle Harmonious Chime',
      desc: 'Soft musical bell chord sequence (E-G#-B-E). Calming yet noticeable.'
    },
    {
      id: 'pulse',
      label: 'Urgent Medical Pulse',
      desc: 'Two-tone rhythmic alarm with pulsing modulation for critical reminders.'
    },
    {
      id: 'marimba',
      label: 'Acoustic Marimba Arpeggio',
      desc: 'Bright wooden acoustic tones ascending smoothly. Upbeat and clear.'
    },
    {
      id: 'hospital',
      label: 'Hospital Monitor Alert',
      desc: 'Professional dual-harmonic clinical alert tone designed for healthcare environments.'
    }
  ];

  const handleTestSound = (soundType: AlarmSoundType) => {
    if (previewingSound === soundType) {
      audioEngine.stopAlarm();
      setPreviewingSound(null);
    } else {
      setPreviewingSound(soundType);
      audioEngine.previewSound(soundType, settings.volume);
      setTimeout(() => {
        setPreviewingSound(null);
      }, 2500);
    }
  };

  const handleVolumeChange = (vol: number) => {
    updateSettings({ volume: vol });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.id || 'usr_demo_1'}`
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          emergencyContact: {
            name: sosName,
            relation: sosRelation,
            phone: sosPhone
          }
        })
      });
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-teal-600" />
          <span>Alarm Sound & System Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your real-time alarm sounds, volume, snooze intervals, notifications, and emergency contacts
        </p>
      </div>

      {isSavedToast && (
        <div className="p-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Settings and contact details saved successfully!</span>
        </div>
      )}

      {/* 1. Alarm Sound Studio */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Alarm Clock Sound Selection
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose the continuous sound that rings when medicine time arrives
            </p>
          </div>
        </div>

        {/* Sound Options List */}
        <div className="space-y-3 mb-6">
          {ringtones.map((tone) => {
            const isSelected = settings.alarmSound === tone.id;
            const isPlaying = previewingSound === tone.id;

            return (
              <div
                key={tone.id}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => updateSettings({ alarmSound: tone.id })}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                      {tone.label}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold uppercase">
                        Active Sound
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tone.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Test Preview Sound */}
                  <button
                    onClick={() => handleTestSound(tone.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isPlaying
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                    title="Listen to preview sound"
                  >
                    {isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-teal-600" />}
                    <span>{isPlaying ? 'Playing...' : 'Test Sound'}</span>
                  </button>

                  <button
                    onClick={() => updateSettings({ alarmSound: tone.id })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Volume Slider */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Alarm Volume: {settings.volume}%
            </span>
            <span className="text-xs text-slate-500">
              {settings.volume > 70 ? 'High' : settings.volume > 30 ? 'Medium' : 'Low'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <VolumeX className="h-4 w-4 text-slate-400" />
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={settings.volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <Volume2 className="h-4 w-4 text-teal-600" />
          </div>
        </div>
      </div>

      {/* 2. Snooze & Notification Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Snooze Interval Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Snooze Duration
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            How long the alarm should pause before ringing again when you press SNOOZE.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 15].map((mins) => (
              <button
                key={mins}
                onClick={() => updateSettings({ snoozeDurationMinutes: mins })}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settings.snoozeDurationMinutes === mins
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Background Notifications */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="h-5 w-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Device Notifications
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Allows the alarm to trigger with vibration and banner notifications when your phone is locked or browser is minimized.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
              Status: <span className="text-teal-600">{settings.notificationPermission}</span>
            </span>
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Request Permission
            </button>
          </div>
        </div>
      </div>

      {/* 3. Accessibility & Speech Assistant */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Mic className="h-5 w-5 text-teal-600" />
          <span>Patient Accessibility & Voice Assistance</span>
        </h3>

        <div className="space-y-4">
          {/* Spoken Voice Readout */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Spoken Voice Alarm Assistant
              </p>
              <p className="text-xs text-slate-500">
                Speaks medicine name, dosage, and food instructions aloud when the alarm triggers.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.voiceReadout}
                onChange={(e) => updateSettings({ voiceReadout: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Mobile Vibration */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Vibration Haptics
              </p>
              <p className="text-xs text-slate-500">
                Pulses physical mobile motor continuously during alarms (on supported phones).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vibration}
                onChange={(e) => updateSettings({ vibration: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* High Contrast Mode for Elderly */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                High Contrast Accessibility
              </p>
              <p className="text-xs text-slate-500">
                Boosts visual contrast and element borders for senior vision support.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Emergency Caregiver / SOS Contact */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <PhoneCall className="h-5 w-5 text-red-500" />
          <span>Patient Profile & Emergency Caregiver SOS</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Shown on the ringing alarm screen so the patient or caregiver can immediately place a call in case of emergency.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Patient Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Patient Phone Number
              </label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={sosName}
                onChange={(e) => setSosName(e.target.value)}
                placeholder="e.g. Robert Doe"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={sosRelation}
                onChange={(e) => setSosRelation(e.target.value)}
                placeholder="e.g. Spouse / Caregiver / Daughter"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Phone Number
              </label>
              <input
                type="tel"
                value={sosPhone}
                onChange={(e) => setSosPhone(e.target.value)}
                placeholder="+1 (555) 987-6543"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            Save Emergency Information
          </button>
        </form>
      </div>

      {/* 5. Closed Website & Background Alarms Guide */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-50/50 via-teal-50/40 to-slate-50 dark:from-indigo-950/20 dark:via-teal-950/20 dark:to-slate-900 border border-teal-500/30 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-teal-600 text-white">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Will Alarms Ring When Website is Closed? (How It Works)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Understanding browser security restrictions and how to enable background reminders
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>1. Tab Open & Active</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Full continuous alarm loop rings loudly through device speakers with animated takeover screen and spoken voice readout.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-teal-600 dark:text-teal-400 mb-1">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span>2. Tab Minimized / Background</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              If the tab is kept open in the background or screen is locked, system notifications trigger with alert sounds and mobile vibrations.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>3. Website Completely Closed</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Due to OS security policies, completely closed web pages cannot play continuous speaker audio. Use the two solutions below!
            </p>
          </div>
        </div>

        {/* Action Solutions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-teal-600" />
              <span>Sync All Alarms to Your Phone's Native Calendar & Alarm Clock</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exports your exact recurring medicine timings as standard alarm events to Google Calendar, Apple Calendar, or Samsung Clock.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/70 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold text-xs whitespace-nowrap transition cursor-pointer"
            >
              <Smartphone className="h-4 w-4 text-teal-600" />
              <span>Install & Publish App</span>
            </button>

            <button
              type="button"
              onClick={() => downloadCalendarICS(medicines)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 whitespace-nowrap transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export to Phone Alarms (.ics)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Demo Regimen Reset */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Restore Sample Medicine Regimen
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Resets demo prescriptions (Metformin, Lisinopril, Vitamin D3, Atorvastatin) with upcoming alarms for testing.
          </p>
        </div>
        <button
          onClick={resetToDemo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 text-slate-500" />
          <span>Reset Sample Regimen</span>
        </button>
      </div>

      {/* Install & Publish Modal */}
      <InstallPublishModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
