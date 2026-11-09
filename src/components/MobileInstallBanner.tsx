import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, ExternalLink } from 'lucide-react';
import { InstallPublishModal } from './InstallPublishModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const MobileInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Check if dismissed before in session
    const dismissed = sessionStorage.getItem('medialarm_install_banner_dismissed');
    if (dismissed) setIsDismissed(true);

    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Detect mobile device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|windows phone/i.test(userAgent);
    setIsMobileDevice(isMobile);

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('medialarm_install_banner_dismissed', 'true');
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsStandalone(true);
          setDeferredPrompt(null);
          return;
        }
      } catch (e) {}
    }
    setShowModal(true);
  };

  if (isStandalone || isDismissed) return null;

  return (
    <>
      <div className="sticky top-0 z-50 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white px-3 py-2 text-xs shadow-md border-b border-teal-500/30 animate-in slide-in-from-top duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500 text-white shrink-0">
              <Smartphone className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold truncate text-[11px] sm:text-xs">
              Install MediAlarm on this phone for real mobile alarms & offline access
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] sm:text-xs transition shadow-xs cursor-pointer active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-teal-200 hover:text-white transition cursor-pointer"
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <InstallPublishModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
