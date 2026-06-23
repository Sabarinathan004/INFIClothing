"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  invoices: "Invoices",
  customers: "Customers",
  bundles: "Bundles",
  settings: "Settings",
  new: "New Invoice",
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const isLast = index === segments.length - 1;

      // Skip UUID-like segments for the label but still include them as a crumb
      const isId = segment.length > 8 && /^[a-f0-9-]+$/i.test(segment);
      const label = isId
        ? "Details"
        : ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      items.push({ label, href, isLast });
    });

    return items;
  }, [pathname]);

  // Don't show breadcrumbs on root-level dashboard
  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-muted-foreground mb-4 -mt-1 overflow-x-auto scrollbar-none"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 shrink-0 hover:text-foreground transition-colors duration-150"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {crumbs.map((crumb) => (
        <Fragment key={crumb.href}>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="shrink-0 hover:text-foreground transition-colors duration-150 truncate max-w-[160px]"
            >
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
