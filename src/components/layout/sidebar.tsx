"use client";

import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Receipt, LayoutDashboard, Plus, FileText, Users, Package, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const iconMap = {
  LayoutDashboard,
  Plus,
  FileText,
  Users,
  Package,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load saved logo from local storage
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
    
    // Optional: listen for storage changes so it updates instantly when topbar changes it
    const handleStorageChange = () => {
      const updatedLogo = localStorage.getItem("app_logo");
      setLogoUrl(updatedLogo);
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Also poll occasionally in case it was changed in the same tab
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white dark:bg-card px-4 py-6 justify-between h-screen sticky top-0">
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-md overflow-hidden bg-black flex-shrink-0">
            <img src={logoUrl || "/logo.png"} alt="INFI Clothings Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground line-clamp-1">
            INFI Clothings
          </span>
        </div>

        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
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
      </div>

      <div className="pt-6 border-t">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
