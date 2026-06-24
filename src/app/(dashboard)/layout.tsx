import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex overflow-hidden overscroll-none bg-slate-50 dark:bg-background print:relative print:h-auto print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <MobileNav />
          <Topbar />
        </div>
        <main className="flex-1 overflow-y-auto overscroll-none bg-slate-50/50 dark:bg-background/95 print:overflow-visible print:bg-white">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-[1600px] print:p-0 print:max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
