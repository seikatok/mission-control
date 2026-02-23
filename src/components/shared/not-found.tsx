import Link from "next/link";
import { SearchX } from "lucide-react";

interface NotFoundProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

export function NotFound({ title, backHref, backLabel }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 gap-4">
      <SearchX className="h-10 w-10 text-slate-600" />
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {backHref && (
        <Link href={backHref} className="text-xs text-blue-400 hover:text-blue-300 underline">
          ← {backLabel ?? "戻る"}
        </Link>
      )}
    </div>
  );
}
