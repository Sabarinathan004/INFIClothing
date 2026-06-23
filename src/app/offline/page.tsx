"use client"

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[hsl(240,10%,3.9%)] p-4">
      <div className="text-center max-w-md mx-auto space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
            <img
              src="/logo.png"
              alt="INFI Clothings"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Offline Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <WifiOff className="w-12 h-12 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
            It looks like you&apos;ve lost your internet connection. Please check
            your network settings and try again.
          </p>
        </div>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-base shadow-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>

        {/* Subtle hint */}
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Previously visited pages may still be available while offline.
        </p>
      </div>
    </div>
  );
}
