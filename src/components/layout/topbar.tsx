"use client"

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Image as ImageIcon, Settings, LogOut } from "lucide-react";
import { updateSettings } from "@/actions/settings";

export function Topbar() {
  const [user, setUser] = useState<User | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Load saved logo from local storage
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, [supabase.auth]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setLogoUrl(result);
        localStorage.setItem("app_logo", result);
        try {
          await updateSettings({ logo_url: result });
        } catch (error) {
          console.error("Failed to update logo in database:", error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerLogoUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="hidden lg:flex h-16 items-center justify-between border-b bg-white dark:bg-card px-6 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          INFI Clothings
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium leading-none">
                  {user?.email?.split('@')[0] || 'Admin'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {user?.email}
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden border border-border/50 shadow-sm">
                <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-cover" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
                triggerLogoUpload();
              }} 
              className="cursor-pointer"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Change Logo</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLogoUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </header>
  );
}
