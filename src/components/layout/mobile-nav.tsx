"use client"

import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Plus, FileText, Users, Package, Settings, Menu, LogOut, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { updateSettings } from "@/actions/settings";

const iconMap = {
  LayoutDashboard,
  Plus,
  FileText,
  Users,
  Package,
  Settings,
};

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  useEffect(() => {
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }

    const handleStorageChange = () => {
      const updatedLogo = localStorage.getItem("app_logo");
      setLogoUrl(updatedLogo);
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-card lg:hidden sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md overflow-hidden bg-black flex-shrink-0">
            <img src={logoUrl || "/logo.png"} alt="INFI Clothings" className="w-full h-full object-cover" />
          </div>
        <span className="font-bold text-lg text-foreground line-clamp-1">INFI Clothings</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -mr-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-accent rounded-md">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-6 text-left border-b border-border/50">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-black flex-shrink-0">
                  <img src={logoUrl || "/logo.png"} alt="INFI Clothings" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-xl line-clamp-1">INFI Clothings</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col justify-between h-[calc(100vh-89px)] p-4">
              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-6 border-t border-border/50 space-y-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    triggerLogoUpload();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                  Change Logo
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLogoUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
