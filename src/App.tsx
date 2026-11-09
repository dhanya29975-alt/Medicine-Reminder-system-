import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MobileInstallBanner } from './components/MobileInstallBanner';
import { Dashboard } from './components/Dashboard';
import { MedicineSchedule } from './components/MedicineSchedule';
import { MedicineList } from './components/MedicineList';
import { MedicineHistory } from './components/MedicineHistory';
import { SettingsView } from './components/SettingsView';
import { AlarmModal } from './components/AlarmModal';
import { AddEditMedicineModal } from './components/AddEditMedicineModal';
import { AuthModal } from './components/AuthModal';
import { BellRing, Plus, WifiOff } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentTab,
    activeAlarm,
    triggerAlarmNow,
    setIsAddEditModalOpen,
    setEditingMedicine,
    settings
  } = useApp();

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors ${settings.largeText ? 'text-base' : ''}`}>
      {/* Mobile Install Top Banner */}
      <MobileInstallBanner />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'schedule' && <MedicineSchedule />}
        {currentTab === 'medicines' && <MedicineList />}
        {currentTab === 'history' && <MedicineHistory />}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Floating Action Quick Access (Mobile / Tablet) */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2.5">
        <button
          onClick={() => triggerAlarmNow()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 text-xs font-black tracking-wide uppercase active:scale-95 transition cursor-pointer border border-rose-400/40"
          title="Simulate immediate ringing alarm clock right now"
        >
          <BellRing className="h-4 w-4 animate-bounce" />
          <span>Test Alarm</span>
        </button>
      </div>

      {/* Real-Time Alarm Modal: Displays full-screen when alarm triggers */}
      {activeAlarm && <AlarmModal dose={activeAlarm} />}

      {/* Modals */}
      <AddEditMedicineModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
