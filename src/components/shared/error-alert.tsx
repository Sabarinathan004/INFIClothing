"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorAlertProps {
  error: string;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg flex items-start gap-3 border border-yellow-200 dark:border-yellow-900 relative">
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="pr-6">
        <h3 className="font-semibold text-sm">Database Error</h3>
        <p className="text-sm opacity-90 mt-1">{error} - Please ensure you have run the Supabase migrations.</p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 text-yellow-800/70 hover:text-yellow-800 dark:text-yellow-200/70 dark:hover:text-yellow-200 transition-colors"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}
