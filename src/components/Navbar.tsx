import React, { useState } from 'react';
import {
  BellRing,
  Pill,
  Clock,
  LayoutDashboard,
  CalendarDays,
  History,
  Settings as SettingsIcon,
  Plus,
  UserCheck,
  ChevronDown,
  LogOut,
  RotateCcw,
  Sparkles,
  Volume2,
  Download,
  Share2,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InstallPublishModal } from './InstallPublishModal';

export const Navbar: React.FC = () => {
  const {
    user,
    currentTime,
    currentTab,
    setCurrentTab,
    triggerAlarmNow,
    scheduleQuickTestAlarm,
    setIsAddEditModalOpen,
    setEditingMedicine,
    setIsAuthModalOpen,
    logout,
    resetToDemo,
    snoozedList
  } = useApp();

  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setIsAddEditModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand & Live Digital Clock */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition transform">
              <Pill className="h-5 w-5 rotate-[-45deg]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Medi<span className="text-teal-600">Alarm</span>
                </span>
                <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  REAL-TIME
                </span>
              </div>
              <p className="hidden xs:block text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                Alarm Clock & Dosing
              </p>
            </div>
          </div>

          {/* Live digital clock pill */}
          <div className="hidden md:flex items-center gap-2 ml-3 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 font-mono text-xs text-slate-700 dark:text-slate-300 shadow-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold tracking-tight text-slate-900 dark:text-white">{formattedTime}</span>
            <span className="text-slate-400">|</span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{formattedDate}</span>
          </div>

          {/* Snooze Alert Indicator if any */}
          {snoozedList.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold animate-pulse">
              <Clock className="h-3.5 w-3.5" />
              <span>{snoozedList.length} Snoozed</span>
            </div>
          )}
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick "Test Alarm" Trigger with direct one-click & dropdown */}
          <div className="relative">
            <div className="flex items-center rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/30 hover:from-rose-600 hover:to-rose-700 transition">
              <button
                onClick={() => triggerAlarmNow()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold active:scale-95 transition cursor-pointer"
                title="Ring continuous alarm sound and display full-screen alarm now"
              >
                <BellRing className="h-4 w-4 animate-bounce" />
                <span>Test Alarm</span>
              </button>
              <button
                onClick={() => setIsTestDropdownOpen(!isTestDropdownOpen)}
                className="px-1.5 py-2 border-l border-white/20 hover:bg-black/10 rounded-r-xl cursor-pointer"
                title="More alarm test options"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {isTestDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-slate-800 z-50 text-xs"
                onClick={() => setIsTestDropdownOpen(false)}
              >
                <div className="px-2 py-1.5 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Real-Time Alarm Simulation
                </div>
                <button
                  onClick={() => triggerAlarmNow()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <BellRing className="h-3.5 w-3.5 text-rose-500" />
                  <span>Ring Alarm Right Now</span>
                </button>
                <button
                  onClick={() => scheduleQuickTestAlarm(5)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Ring in 5 seconds (Countdown)</span>
                </button>
                <button
                  onClick={() => scheduleQuickTestAlarm(15)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Ring in 15 seconds</span>
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  onClick={resetToDemo}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  <span>Reset Default Demo Regimen</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary "Add Medicine" button */}
          <button
            onClick={handleOpenAdd}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-teal-600/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Medicine</span>
          </button>

          {/* Prominent Install & Publish App Button */}
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-teal-600/30 transition active:scale-95 cursor-pointer whitespace-nowrap"
            title="Install MediAlarm as mobile app, scan QR code, or view publish options"
          >
            <Download className="h-4 w-4" />
            <span>Install App</span>
          </button>

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 font-bold text-white text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                {user?.name || 'Jane Doe'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-slate-800 z-50 text-xs"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {user?.name || 'Patient'}
                  </p>
                  <p className="text-slate-500 text-[11px] truncate">
                    {user?.email || 'patient@example.com'}
                  </p>
                  {user?.emergencyContact?.phone && (
                    <p className="mt-1 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      SOS: {user.emergencyContact.name} ({user.emergencyContact.phone})
                    </p>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => setCurrentTab('settings')}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <SettingsIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>Alarm Sound & Audio Settings</span>
                  </button>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>Switch Patient Account / Demo</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <nav className="border-t border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mx-auto flex max-w-7xl items-center justify-start sm:justify-center overflow-x-auto px-3 py-1.5 scrollbar-none gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('schedule')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'schedule'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Today's Doses</span>
          </button>

          <button
            onClick={() => setCurrentTab('medicines')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'medicines'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
          >
            <Pill className="h-4 w-4" />
            <span>Medicine List</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'history'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Dose History</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Settings & Sound</span>
          </button>
        </div>
      </nav>

      {/* Install & Publish Modal */}
      <InstallPublishModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </header>
  );
};
