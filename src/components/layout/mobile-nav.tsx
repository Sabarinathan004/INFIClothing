"use client"

import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Plus,
  FileText,
  Users,
  Package,
  Settings,
  Menu,
  LogOut,
  Image as ImageIcon,
} from "lucide-react";
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

const BOTTOM_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/invoices", label: "Bills", icon: FileText },
  { href: "/invoices/new", label: "New Bill", icon: Plus, isCta: true },
  { href: "/customers", label: "Parties", icon: Users },
  { href: "/bundles", label: "Bundles", icon: Package },
];

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

  // Automatically hide bottom nav on billing creation/edit screen so invoice action dock has full control
  const isInvoiceFormScreen =
    pathname === "/invoices/new" || (pathname.startsWith("/invoices/") && pathname.endsWith("/edit"));

  return (
    <>
      {/* Top Mobile Bar */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 pl-[max(env(safe-area-inset-left),0.875rem)] pr-[max(env(safe-area-inset-right),0.875rem)] pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b bg-white dark:bg-card lg:hidden sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md overflow-hidden bg-black shrink-0">
            <img src={logoUrl || "/logo.png"} alt="INFI Clothings" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-base sm:text-lg text-foreground tracking-tight whitespace-nowrap">INFI Clothings</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -mr-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-accent rounded-md">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] flex flex-col"
            >
              <SheetHeader className="p-6 text-left border-b border-border/50 shrink-0">
                <SheetTitle className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md overflow-hidden bg-black flex-shrink-0">
                    <img src={logoUrl || "/logo.png"} alt="INFI Clothings" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-xl truncate">INFI Clothings</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col justify-between flex-1 overflow-y-auto p-4">
                <nav className="space-y-1.5">
                  {NAV_ITEMS.map((item) => {
                    const Icon = iconMap[item.icon as keyof typeof iconMap];
                    const isActive =
                      pathname.startsWith(item.href) &&
                      (item.href !== "/dashboard" || pathname === "/dashboard");

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

      {/* Fixed Bottom 5-Tab Thumb Navigation Dock (Hidden on Invoice Creation/Edit) */}
      {!isInvoiceFormScreen && (
        <nav className="fixed bottom-0 inset-x-0 w-full max-w-full z-40 bg-white/95 dark:bg-card/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden grid grid-cols-5 items-end px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-lg print:hidden box-border">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(tab.href);

            if (tab.isCta) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="col-span-1 flex flex-col items-center justify-center -mt-5 group w-full min-w-0"
                >
                  <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ring-4 ring-white dark:ring-card shrink-0">
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 whitespace-nowrap leading-none text-center">
                    New Bill
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "col-span-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[10px] font-semibold transition-colors w-full text-center min-w-0 overflow-hidden",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-0.5 shrink-0", isActive && "stroke-[2.5]")} />
                <span className="truncate w-full block text-center leading-tight">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
