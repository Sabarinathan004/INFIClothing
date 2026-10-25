import { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-8">
      <Breadcrumbs />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
