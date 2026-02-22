"use client";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between border-b border-slate-800 px-6 py-4", className)}>
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
