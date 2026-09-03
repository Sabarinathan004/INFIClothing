"use client"

import { useEffect, useState, useCallback } from "react";
import { X, Download, Share, PlusSquare } from "lucide-react";

// Extend window to include the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function getDismissedTimestamp(): number | null {
  try {
    const val = localStorage.getItem("pwa_install_dismissed");
    return val ? parseInt(val, 10) : null;
  } catch {
    return null;
  }
}

function setDismissedTimestamp(): void {
  try {
    localStorage.setItem("pwa_install_dismissed", Date.now().toString());
  } catch {}
}

const DISMISS_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export function PwaRegistry() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  // Register service worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
          
          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  console.log("New service worker activated");
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    }
  }, []);

  // Check if we should show install banner
  useEffect(() => {
    if (isInStandaloneMode()) return;

    const dismissed = getDismissedTimestamp();
    if (dismissed && Date.now() - dismissed < DISMISS_DURATION_MS) return;

    // Android/Desktop: listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS: show manual instructions after a delay
    if (isIOS()) {
      const timer = setTimeout(() => {
        setShowIOSBanner(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("PWA installed");
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstallBanner(false);
    setShowIOSBanner(false);
    setDismissedTimestamp();
  }, []);

  // Android/Desktop install banner
  if (showInstallBanner) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-slide-up">
        <div className="max-w-lg mx-auto bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              <img
                src="/logo.png"
                alt="INFI Clothings"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Install INFI Billing</p>
              <p className="text-xs text-slate-300 mt-0.5">
                Add to your home screen for quick access
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 py-2.5 px-4 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS install instructions banner
  if (showIOSBanner) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-slide-up">
        <div className="max-w-lg mx-auto bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              <img
                src="/logo.png"
                alt="INFI Clothings"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Install INFI Billing</p>
              <div className="text-xs text-slate-300 mt-1.5 space-y-1.5">
                <p className="flex items-center gap-1.5">
                  <span className="text-base">1.</span> Tap the{" "}
                  <Share className="w-3.5 h-3.5 inline text-blue-400" />{" "}
                  <span className="font-medium text-white">Share</span> button
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-base">2.</span> Tap{" "}
                  <PlusSquare className="w-3.5 h-3.5 inline text-blue-400" />{" "}
                  <span className="font-medium text-white">Add to Home Screen</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {/* Arrow pointing to share button at bottom of Safari */}
          <div className="flex justify-center pb-2">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
