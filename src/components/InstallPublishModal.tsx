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
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { downloadCalendarICS } from '../services/calendarExport';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPublishModal: React.FC<InstallPublishModalProps> = ({ isOpen, onClose }) => {
  const { medicines } = useApp();
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios' | 'desktop' | 'downloads' | 'playstore'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // The permanent public shared URL accessible from any mobile phone or browser
  const publicPublishedUrl = 'https://ais-pre-k2c2vmnk2eqbhvun3swz7j-253013087732.asia-northeast1.run.app';

  useEffect(() => {
    // Check if running inside an iframe (like AI Studio preview)
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    setIsInIframe(inIframe);

    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Detect device environment
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const mobile = /android|iphone|ipad|ipod|windows phone/i.test(ua);
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);
    // Detect in-app browsers (Google Lens, QR Scanner Webview, WhatsApp, Instagram, FB)
    const inApp = /(fban|fbav|instagram|line|whatsapp|gsa|snapchat|micromessenger|wv|version\/[0-9.]*\s+chrome)/i.test(ua);

    setIsMobileDevice(mobile);
    setIsIOSDevice(ios);
    setIsAndroidDevice(android);
    setIsInAppBrowser(inApp);

    if (ios) {
      setActiveDeviceTab('ios');
    } else if (android) {
      setActiveDeviceTab('android');
    } else {
      setActiveDeviceTab('desktop');
    }

    // Capture beforeinstallprompt event if fired
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
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsStandalone(true);
        }
      } catch (e) {
        // Fall back to device instructions tab
      }
    } else {
      // Direct user to the specific tab for their OS
      if (isIOSDevice) {
        setActiveDeviceTab('ios');
      } else if (isAndroidDevice) {
        setActiveDeviceTab('android');
      } else {
        setActiveDeviceTab('desktop');
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicPublishedUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadICS = () => {
    downloadCalendarICS(medicines);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(publicPublishedUrl)}&color=0f766e&margin=8`;
  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(publicPublishedUrl)}`;
  const androidChromeIntent = `intent://${publicPublishedUrl.replace('https://', '')}#Intent;scheme=https;package=com.android.chrome;end`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
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
                Install MediAlarm on Your Phone
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold uppercase">
                PWA & Offline Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isMobileDevice
                ? 'Detected Mobile Phone: Complete installation or download native alarms'
                : 'Install as a mobile app on Android/iPhone or use on Desktop'}
            </p>
          </div>
        </div>

        {/* In-App Scanner / Webview Warning (Crucial for QR code scanners) */}
        {isInAppBrowser && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-950 dark:text-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-2 flex-1">
                <p className="text-xs font-black">
                  ⚠️ QR Scanner / In-App Browser Detected!
                </p>
                <p className="text-[11px] leading-relaxed">
                  QR scanner cameras open links in a <strong>restricted preview viewer</strong> that blocks app installation. To install MediAlarm, you must open it in real <strong>Google Chrome</strong> or <strong>Safari</strong>.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {isAndroidDevice && (
                    <a
                      href={androidChromeIntent}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition"
                    >
                      <span>Tap to Open in Google Chrome</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{isCopied ? 'Link Copied!' : 'Copy Link for Chrome / Safari'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Iframe Notice & Direct "Open Full Tab" Trigger */}
        {isInIframe && !isStandalone && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-bold">
                  You are currently inside the AI Studio development preview frame
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Web browsers (Chrome & Safari) <strong>block app installation inside preview frames</strong>. To install MediAlarm on your computer or phone, open the full app link in a new browser tab.
                </p>
                <a
                  href={publicPublishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition mt-1"
                >
                  <span>Open Full App in New Tab to Install</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Action Hero Banner */}
        <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-black text-sm sm:text-base">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>{isStandalone ? 'MediAlarm is Installed!' : 'Add to Phone Home Screen'}</span>
            </div>
            <p className="text-xs text-teal-100 mt-1 max-w-md">
              {isStandalone
                ? 'MediAlarm is currently running as an installed standalone app with background alarms enabled.'
                : 'Installs directly to your phone screen without Play Store downloads. Works offline and rings even when locked.'}
            </p>
          </div>

          {!isStandalone && (
            isInIframe && !deferredPrompt ? (
              <a
                href={publicPublishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-800 font-black text-xs shadow-lg hover:bg-teal-50 active:scale-95 transition whitespace-nowrap"
              >
                <ExternalLink className="h-4 w-4 text-teal-600" />
                <span>Open in Full Tab to Install</span>
              </a>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg hover:bg-amber-300 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <Download className="h-4 w-4 text-slate-950" />
                <span>1-Tap Install Now</span>
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-800 font-black text-xs shadow-lg hover:bg-teal-50 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <Smartphone className="h-4 w-4 text-teal-600" />
                <span>See 2-Tap Steps Below</span>
              </button>
            )
          )}
        </div>

        {/* Direct Download Option (Immediate .ics phone alarm download) */}
        <div className="mt-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
                    Want an Instant Download? Download Phone Alarms (.ics)
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 text-[9px] font-black uppercase">
                    1-Click
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-1 max-w-md leading-relaxed">
                  Downloads an alarm schedule file for your phone. When opened, it automatically adds all <strong>{medicines.length} medicine reminders</strong> into your phone's native Calendar and Clock alarms so they ring even when locked!
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadICS}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span>Alarms Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Alarms (.ics)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Why didn't clicking download an APK automatically? Educational Explainer */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Why doesn't the button start an .exe or .apk download?</strong>
              <br />
              Modern Progressive Web Apps install <em>directly</em> to your phone's home screen without downloading risky 50MB files. For security, mobile browsers require <strong>you</strong> to tap the browser menu option to confirm installation. Follow the 2 simple steps below:
            </div>
          </div>
        </div>

        {/* Device Selection Tabs */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
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
              <span>iPhone</span>
            </button>
            <button
              onClick={() => setActiveDeviceTab('downloads')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer ${
                activeDeviceTab === 'downloads'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>APK & Files</span>
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
              <span className="hidden sm:inline">Desktop</span>
              <span className="sm:hidden">PC</span>
            </button>
            <button
              onClick={() => setActiveDeviceTab('playstore')}
              className={`hidden sm:flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer ${
                activeDeviceTab === 'playstore'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <PlaySquare className="h-3.5 w-3.5" />
              <span>Play Store</span>
            </button>
          </div>

          {/* Android Steps (Illustrated) */}
          {activeDeviceTab === 'android' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/20 space-y-3 text-xs">
              <div className="font-black text-slate-900 dark:text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-teal-600" />
                  <span>On Android Phone (Google Chrome / Samsung Internet):</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] font-black">
                  Recommended
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white font-black text-xs">1</span>
                    <span className="text-[10px] text-slate-400 font-bold">Top Right</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Tap Chrome's 3 Dots (⋮)</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Look at the top-right corner of Chrome next to the URL bar and tap the vertical dots <strong>⋮</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white font-black text-xs">2</span>
                    <span className="text-[10px] text-slate-400 font-bold">Select Menu Item</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Tap "Install app"</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> from the menu list.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-xs">3</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Done!</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Tap "Install" to Confirm</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    MediAlarm is added directly to your home screen with the app icon and full alarm sounds!
                  </p>
                </div>
              </div>

              {isAndroidDevice && (
                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href={androidChromeIntent}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition"
                  >
                    <span>Launch in Chrome Browser</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* iPhone Steps (Illustrated) */}
          {activeDeviceTab === 'ios' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 text-xs">
              <div className="font-black text-slate-900 dark:text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4 text-slate-800 dark:text-slate-200" />
                  <span>On iPhone or iPad (Apple Safari):</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-black">
                  iOS Safari
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-700 text-white font-black text-xs">1</span>
                    <span className="text-[10px] text-slate-400 font-bold">Bottom Bar</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Tap Safari Share Button</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tap the <strong>Share</strong> button (the square with an arrow pointing upward ⎋) in Safari's bottom toolbar.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-700 text-white font-black text-xs">2</span>
                    <span className="text-[10px] text-slate-400 font-bold">Scroll Down</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Tap "Add to Home Screen"</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Scroll down through the share options and tap the <strong>"Add to Home Screen"</strong> option with the ➕ plus icon.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-xs">3</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Top Right</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Tap "Add" in Top Right</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tap <strong>"Add"</strong> in the top-right corner. The official MediAlarm icon appears on your home screen!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Direct File Downloads / APK Package */}
          {activeDeviceTab === 'downloads' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs">
              <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-teal-600" />
                <span>Direct File Downloads & Android APK Packaging:</span>
              </div>

              <div className="space-y-2.5">
                {/* 1. Calendar Alarms File */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span>Phone Alarm Timetable (.ics file)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Imports recurring daily alarms into Google Calendar, Samsung Calendar, or Apple Calendar.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadICS}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-center"
                  >
                    Download .ics File
                  </button>
                </div>

                {/* 2. PWABuilder APK Generator */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <PlaySquare className="h-4 w-4 text-emerald-600" />
                      <span>Build & Download Android APK (PWABuilder)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Uses Microsoft's verified tool to compile this web app into a signed Android APK installer for your phone.
                    </p>
                  </div>
                  <a
                    href={pwabuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition active:scale-95 whitespace-nowrap self-start sm:self-center"
                  >
                    <span>Package APK</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Steps */}
          {activeDeviceTab === 'desktop' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs">
              <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="h-4 w-4 text-indigo-600" />
                <span>On PC, Mac, or Chromebook (Chrome / Edge):</span>
              </div>
              <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold shrink-0">1</span>
                  <span>Open the link in a dedicated browser tab (outside the preview frame).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold shrink-0">2</span>
                  <span>Look at the right side of your browser URL bar for the <strong>Install App icon (monitor with down arrow ⤓)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold shrink-0">3</span>
                  <span>Click <strong>"Install"</strong> to add it to your Windows Start Menu, Taskbar, or macOS Applications.</span>
                </div>
              </div>
            </div>
          )}

          {/* Google Play Store Tab */}
          {activeDeviceTab === 'playstore' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs">
              <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PlaySquare className="h-4 w-4 text-rose-600" />
                <span>Publishing to Google Play Store:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                MediAlarm includes full PWA compliance (Service Worker, Web App Manifest, 512px maskable icons, and HTTPS). You can package it into an <strong>Android APK or AAB</strong> file for free using:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href={pwabuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-teal-500 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">PWABuilder.com</div>
                    <div className="text-[10px] text-slate-500">Auto-configured package for MediAlarm</div>
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
                    <div className="text-[10px] text-slate-500">Official Google CLI to build Play Store package</div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* QR Code & Live Link for Desktop / Caregiver Sharing */}
        {!isMobileDevice && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* High Resolution QR Code */}
              <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0">
                <img
                  src={qrImageUrl}
                  alt="Scan to open MediAlarm on Mobile Phone"
                  className="w-28 h-28 object-contain rounded-xl"
                />
                <span className="text-[10px] text-teal-800 font-bold mt-1.5 flex items-center gap-1">
                  <QrCode className="h-3 w-3" />
                  <span>Scan with Phone Camera</span>
                </span>
              </div>

              {/* Link & Instructions */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start text-xs font-bold text-slate-900 dark:text-white">
                  <Share2 className="h-4 w-4 text-teal-600" />
                  <span>Permanent Live App URL:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicPublishedUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer shrink-0 shadow-xs"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                  <a
                    href={publicPublishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
                  >
                    <span>Open link in new window</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
