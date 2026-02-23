"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AGENT_STATUS_LABELS, AGENT_STATUS_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function TeamPage() {
  const [tab, setTab] = useState("agents");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);

  const agents = useQuery(api.agents.list);
  const templates = useQuery(api.agentTemplates.list);
  const gateways = useQuery(api.gateways.list);
  const createTemplate = useMutation(api.agentTemplates.create);
  const createAgent = useMutation(api.agents.create);
  const setAgentStatus = useMutation(api.agents.setStatus);

  // Template form state
  const [tName, setTName] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tAllowExternal, setTAllowExternal] = useState(false);
  const [tAllowFileWrite, setTAllowFileWrite] = useState(false);
  const [tAllowDangerous, setTAllowDangerous] = useState(false);
  const [tSubmitting, setTSubmitting] = useState(false);

  // Agent form state
  const [aName, setAName] = useState("");
  const [aTemplateId, setATemplateId] = useState("");
  const [aGatewayId, setAGatewayId] = useState("_none");
  const [aSubmitting, setASubmitting] = useState(false);

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    setTSubmitting(true);
    try {
      await createTemplate({
        name: tName,
        description: tDesc || undefined,
        policy: {
          allowExternalSend: tAllowExternal,
          allowFileWriteOutsideWorkspace: tAllowFileWrite,
          allowDangerousCommands: tAllowDangerous,
          requireApprovalFor: [],
        },
        allowedSkillIds: [],
      });
      toast.success("テンプレートを作成しました");
      setShowTemplateDialog(false);
      setTName(""); setTDesc("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setTSubmitting(false);
    }
  }

  async function handleCreateAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!aTemplateId) { toast.error("Select a template"); return; }
    setASubmitting(true);
    try {
      await createAgent({
        name: aName,
        templateId: aTemplateId as Id<"agentTemplates">,
        gatewayId: aGatewayId !== "_none" ? aGatewayId as Id<"gateways"> : undefined,
      });
      toast.success("エージェントを作成しました");
      setShowAgentDialog(false);
      setAName(""); setATemplateId(""); setAGatewayId("_none");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setASubmitting(false);
    }
  }

  const agentStatuses: Array<"idle" | "running" | "waiting_decision" | "blocked" | "error" | "offline" | "paused"> = [
    "idle", "running", "waiting_decision", "blocked", "error", "offline", "paused"
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Team"
        description="エージェントテンプレートと稼働エージェント"
        action={
          tab === "templates" ? (
            <Button onClick={() => setShowTemplateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              + New Template
            </Button>
          ) : (
            <Button onClick={() => setShowAgentDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              + New Agent
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-6 mt-4 bg-slate-900 border border-slate-800 w-fit">
          <TabsTrigger value="agents" className="data-[state=active]:bg-slate-700">Agents</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-slate-700">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="flex-1 overflow-y-auto p-6 mt-0">
          {!agents ? (
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
          ) : agents.length === 0 ? (
            <EmptyState title="エージェントはまだありません" action={<Button onClick={() => setShowAgentDialog(true)} className="bg-blue-600 hover:bg-blue-700">New Agent</Button>} />
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => {
                const template = templates?.find((t) => t._id === agent.templateId);
                const gateway = gateways?.find((g) => g._id === agent.gatewayId);
                return (
                  <div key={agent._id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-100">{agent.name}</span>
                        <StatusBadge
                          label={AGENT_STATUS_LABELS[agent.status] ?? agent.status}
                          colorClass={AGENT_STATUS_COLORS[agent.status] ?? "bg-slate-500"}
                        />
                      </div>
                      <div className="mt-0.5 flex gap-3 text-xs text-slate-500">
                        <span>Template: {template?.name ?? "(deleted)"}</span>
                        {gateway && <span>· Gateway: {gateway.name}</span>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 border border-slate-700">
                          Set Status <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-900 border-slate-700">
                        {agentStatuses.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            disabled={s === agent.status}
                            onClick={() => setAgentStatus({ agentId: agent._id, status: s }).catch((err) => toast.error(String(err)))}
                            className="text-slate-200 focus:bg-slate-800 cursor-pointer"
                          >
                            {AGENT_STATUS_LABELS[s]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="flex-1 overflow-y-auto p-6 mt-0">
          {!templates ? (
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
          ) : templates.length === 0 ? (
            <EmptyState title="テンプレートはまだありません" action={<Button onClick={() => setShowTemplateDialog(true)} className="bg-blue-600 hover:bg-blue-700">New Template</Button>} />
          ) : (
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <div key={tmpl._id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                  <p className="font-medium text-slate-100">{tmpl.name}</p>
                  {tmpl.description && <p className="text-sm text-slate-400 mt-0.5">{tmpl.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {tmpl.policy.allowExternalSend && <span className="bg-orange-700 text-orange-100 rounded px-1.5 py-0.5">External Send</span>}
                    {tmpl.policy.allowFileWriteOutsideWorkspace && <span className="bg-red-700 text-red-100 rounded px-1.5 py-0.5">File Write Outside</span>}
                    {tmpl.policy.allowDangerousCommands && <span className="bg-red-800 text-red-100 rounded px-1.5 py-0.5">Dangerous Cmds</span>}
                    {!tmpl.policy.allowExternalSend && !tmpl.policy.allowFileWriteOutsideWorkspace && !tmpl.policy.allowDangerousCommands && (
                      <span className="bg-green-800 text-green-100 rounded px-1.5 py-0.5">Safe policy</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-slate-100">新規テンプレート</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTemplate} className="space-y-3">
            <div><Label>名前 *</Label><Input value={tName} onChange={(e) => setTName(e.target.value)} required className="mt-1 bg-slate-800 border-slate-700" /></div>
            <div><Label>説明</Label><Textarea value={tDesc} onChange={(e) => setTDesc(e.target.value)} rows={2} className="mt-1 bg-slate-800 border-slate-700" /></div>
            <div className="space-y-2">
              <Label>ポリシー</Label>
              {[
                { label: "外部送信を許可", value: tAllowExternal, setter: setTAllowExternal },
                { label: "ワークスペース外への書き込みを許可", value: tAllowFileWrite, setter: setTAllowFileWrite },
                { label: "危険なコマンドを許可", value: tAllowDangerous, setter: setTAllowDangerous },
              ].map(({ label, value, setter }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-300">{label}</span>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowTemplateDialog(false)} className="text-slate-400">キャンセル</Button>
              <Button type="submit" disabled={tSubmitting} className="bg-blue-600 hover:bg-blue-700">{tSubmitting ? "作成中..." : "作成"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Agent Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-slate-100">新規エージェント</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateAgent} className="space-y-3">
            <div><Label>名前 *</Label><Input value={aName} onChange={(e) => setAName(e.target.value)} required className="mt-1 bg-slate-800 border-slate-700" /></div>
            <div>
              <Label>テンプレート *</Label>
              <Select value={aTemplateId} onValueChange={setATemplateId}>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue placeholder="Select template..." /></SelectTrigger>
                <SelectContent>{templates?.map((t) => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>ゲートウェイ</Label>
              <Select value={aGatewayId} onValueChange={setAGatewayId}>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— None —</SelectItem>
                  {gateways?.map((g) => <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowAgentDialog(false)} className="text-slate-400">キャンセル</Button>
              <Button type="submit" disabled={aSubmitting} className="bg-blue-600 hover:bg-blue-700">{aSubmitting ? "作成中..." : "作成"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
