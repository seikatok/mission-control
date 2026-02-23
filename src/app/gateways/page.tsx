"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function GatewaysPage() {
  const router = useRouter();
  const gateways = useQuery(api.gateways.list);
  const heartbeat = useMutation(api.gateways.heartbeat);
  const setOnline = useMutation(api.gateways.setOnline);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Gateways"
        description="エージェント実行環境の管理"
        action={
          <Button onClick={() => router.push("/gateways/new")} className="bg-blue-600 hover:bg-blue-700">
            + New Gateway
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        {!gateways ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : gateways.length === 0 ? (
          <EmptyState title="ゲートウェイはまだありません" action={<Button onClick={() => router.push("/gateways/new")} className="bg-blue-600 hover:bg-blue-700">New Gateway</Button>} />
        ) : (
          <div className="space-y-3">
            {gateways.map((gw) => (
              <div key={gw._id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-100">{gw.name}</h3>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white",
                          gw.isOnline ? "bg-green-600" : "bg-zinc-600",
                        )}
                      >
                        {gw.isOnline ? "Online" : "Offline"}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-800 rounded px-1.5 py-0.5 capitalize">{gw.kind}</span>
                    </div>
                    {gw.endpoint && <p className="text-xs text-slate-500 mt-0.5">{gw.endpoint}</p>}
                    {gw.workspaceRoot && <p className="text-xs text-slate-500">{gw.workspaceRoot}</p>}
                    {gw.lastHeartbeatAt && (
                      <p className="text-xs text-slate-600 mt-1">Last heartbeat: {formatDate(gw.lastHeartbeatAt)}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300 text-xs"
                      onClick={() => heartbeat({ gatewayId: gw._id }).then(() => toast.success("Heartbeat sent")).catch((err) => toast.error(String(err)))}
                    >
                      Heartbeat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("border-slate-700 text-xs", gw.isOnline ? "text-red-400" : "text-green-400")}
                      onClick={() => setOnline({ gatewayId: gw._id, isOnline: !gw.isOnline }).catch((err) => toast.error(String(err)))}
                    >
                      {gw.isOnline ? "Set Offline" : "Set Online"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
