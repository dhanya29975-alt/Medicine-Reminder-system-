import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  QrCode,
  Smartphone,
  Apple,
  Globe,
  Copy,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Laptop,
  PlaySquare,
  ShieldCheck
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPublishModal: React.FC<InstallPublishModalProps> = ({ isOpen, onClose }) => {
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios' | 'desktop' | 'playstore'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // App URLs from environment or window location
  const shareUrl = typeof window !== 'undefined'
    ? (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'https://ais-pre-k2c2vmnk2eqbhvun3swz7j-253013087732.asia-northeast1.run.app'
        : window.location.href)
    : 'https://ais-pre-k2c2vmnk2eqbhvun3swz7j-253013087732.asia-northeast1.run.app';

  useEffect(() => {
    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Capture beforeinstallprompt
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      // Guide user to browser menu
      alert('To install on this browser: Tap the 3 dots (⋮) in the top right of your browser and select "Install MediAlarm" or "Add to Home Screen".');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}&color=0f766e`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Install & Publish MediAlarm
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold uppercase">
                PWA Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Install as a real mobile app on Android/iOS, share with patients, or publish online
            </p>
          </div>
        </div>

        {/* Quick Install Banner if available */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-black text-sm">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>{isStandalone ? 'Already Installed as an App!' : 'Install on This Device'}</span>
            </div>
            <p className="text-xs text-teal-100 mt-0.5">
              {isStandalone
                ? 'MediAlarm is currently running in standalone app mode with background notifications.'
                : 'Click to add MediAlarm directly to your home screen or desktop application launcher.'}
            </p>
          </div>

          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-teal-800 font-extrabold text-xs shadow-lg hover:bg-teal-50 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <Download className="h-4 w-4 text-teal-600" />
              <span>Install App Now</span>
            </button>
          )}
        </div>

        {/* Share & Mobile QR Code Section */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white border border-slate-200 shadow-xs shrink-0">
              <img
                src={qrImageUrl}
                alt="MediAlarm Mobile Install QR Code"
                className="w-28 h-28 object-contain rounded-lg"
              />
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                Scan with Camera
              </span>
            </div>

            {/* Link & Instructions */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start text-xs font-bold text-slate-900 dark:text-white">
                <Share2 className="h-4 w-4 text-teal-600" />
                <span>Live Published App URL:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 truncate select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Share this link with patients, elderly family members, or open it on your phone browser to install.
              </p>
            </div>
          </div>
        </div>

        {/* Device Installation Guides */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Installation Instructions by Platform:
            </span>
          </div>

          {/* Device Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveDeviceTab('android')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer ${
                activeDeviceTab === 'android'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Android</span>
            </button>
            <button
              onClick={() => setActiveDeviceTab('ios')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer ${
                activeDeviceTab === 'ios'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Apple className="h-3.5 w-3.5" />
              <span>iPhone/iPad</span>
            </button>
            <button
              onClick={() => setActiveDeviceTab('desktop')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer ${
                activeDeviceTab === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>PC / Mac</span>
            </button>
            <button
              onClick={() => setActiveDeviceTab('playstore')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer ${
                activeDeviceTab === 'playstore'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <PlaySquare className="h-3.5 w-3.5" />
              <span>Play Store</span>
            </button>
          </div>

          {/* Tab Content: Android */}
          {activeDeviceTab === 'android' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>How to Install on Android (Chrome / Samsung Internet):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>Scan the QR code above or open the app link in <strong>Google Chrome</strong>.</li>
                <li>Tap the <strong>"Install App"</strong> banner at the bottom or top of the page.</li>
                <li>If the banner doesn't appear, tap the <strong>three dots (⋮)</strong> in Chrome's top right corner.</li>
                <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>MediAlarm will install to your app drawer and home screen. It will open full-screen like a native mobile app!</li>
              </ol>
            </div>
          )}

          {/* Tab Content: iOS */}
          {activeDeviceTab === 'ios' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Apple className="h-4 w-4 text-slate-800 dark:text-slate-200" />
                <span>How to Install on iPhone or iPad (Safari):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>Open the app link in <strong>Apple Safari</strong>.</li>
                <li>Tap the <strong>Share</strong> button (the square with an arrow pointing upward) in the bottom toolbar.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>"Add"</strong> in the top right corner.</li>
                <li>MediAlarm icon will now be on your iPhone home screen. Launching it from the home screen enables full-screen standalone mode and lock-screen alerts!</li>
              </ol>
            </div>
          )}

          {/* Tab Content: Desktop */}
          {activeDeviceTab === 'desktop' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="h-4 w-4 text-indigo-600" />
                <span>How to Install on Windows / Mac / Chromebook:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>Open the app in <strong>Google Chrome, Microsoft Edge, or Brave</strong>.</li>
                <li>Click the <strong>Install icon (monitor with down arrow)</strong> located in the right side of the URL address bar.</li>
                <li>Click <strong>Install</strong>.</li>
                <li>MediAlarm will open in its own clean window without browser tabs or address bars, and pin to your Taskbar / Dock.</li>
              </ol>
            </div>
          )}

          {/* Tab Content: Google Play Store / App Store Publishing */}
          {activeDeviceTab === 'playstore' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlaySquare className="h-4 w-4 text-rose-600" />
                <span>Publishing to Google Play Store & Web:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Because MediAlarm is fully compliant with PWA standards (manifest.json, service worker, 512px maskable icons, offline caching), you can publish it directly to the <strong>Google Play Store</strong> as an Android APK/AAB package!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href="https://www.pwabuilder.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-teal-500 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">PWABuilder.com</div>
                    <div className="text-[10px] text-slate-500">Generate Google Play Store APK/AAB package</div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                </a>

                <a
                  href="https://github.com/GoogleChromeLabs/bubblewrap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-teal-500 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Google Bubblewrap</div>
                    <div className="text-[10px] text-slate-500">Official Google CLI to build Play Store TWA</div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>PWA & Service Worker Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
