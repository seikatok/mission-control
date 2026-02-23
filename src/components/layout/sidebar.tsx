// Server Component - "use client" なし
// アクティブ判定が必要な nav 部分だけ SidebarNav (Client) に委譲している
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-slate-800 bg-slate-950">
      {/* ロゴ: 静的テキストのみ → Server で生成 */}
      <div className="flex h-14 items-center border-b border-slate-800 px-4">
        <span className="text-sm font-bold tracking-wide text-slate-100">Mission Control</span>
      </div>
      {/* nav: usePathname が必要なため Client Component */}
      <SidebarNav />
      <div className="border-t border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-600">AI Management OS</p>
      </div>
    </aside>
  );
}
