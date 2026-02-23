"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SuccessMetric {
  label: string;
  target?: string;
  current?: string;
}

export interface GoalFormValues {
  title: string;
  domain: "work" | "personal";
  area: string;
  status: "active" | "paused" | "completed" | "archived";
  priority: "p1" | "p2" | "p3";
  description: string;
  tags: string;
  successMetrics: SuccessMetric[];
}

interface GoalFormProps {
  defaultValues?: Partial<GoalFormValues>;
  onSubmit: (values: GoalFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function GoalForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "保存" }: GoalFormProps) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [domain, setDomain] = useState<"work" | "personal">(defaultValues?.domain ?? "work");
  const [area, setArea] = useState(defaultValues?.area ?? "");
  const [status, setStatus] = useState<GoalFormValues["status"]>(defaultValues?.status ?? "active");
  const [priority, setPriority] = useState<GoalFormValues["priority"]>(defaultValues?.priority ?? "p2");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [tags, setTags] = useState(defaultValues?.tags ?? "");
  const [metrics, setMetrics] = useState<SuccessMetric[]>(defaultValues?.successMetrics ?? []);

  function addMetric() {
    setMetrics((m) => [...m, { label: "", target: "", current: "" }]);
  }

  function updateMetric(index: number, field: keyof SuccessMetric, value: string) {
    setMetrics((m) => m.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function removeMetric(index: number) {
    setMetrics((m) => m.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ title, domain, area, status, priority, description, tags, successMetrics: metrics });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">タイトル *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 bg-slate-900 border-slate-700" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>ドメイン</Label>
          <Select value={domain} onValueChange={(v) => setDomain(v as "work" | "personal")}>
            <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">仕事</SelectItem>
              <SelectItem value="personal">個人</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="area">エリア</Label>
          <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 bg-slate-900 border-slate-700" placeholder="エンジニアリング, マーケティング..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>ステータス</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as GoalFormValues["status"])}>
            <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">アクティブ</SelectItem>
              <SelectItem value="paused">一時停止</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
              <SelectItem value="archived">アーカイブ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>優先度</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as GoalFormValues["priority"])}>
            <SelectTrigger className="mt-1 bg-slate-900 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p1">P1 (最高)</SelectItem>
              <SelectItem value="p2">P2</SelectItem>
              <SelectItem value="p3">P3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="description">説明</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 bg-slate-900 border-slate-700" />
      </div>
      <div>
        <Label htmlFor="tags">タグ（カンマ区切り）</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 bg-slate-900 border-slate-700" placeholder="mvp, q1, エンジニアリング" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>成功指標</Label>
          <Button type="button" variant="outline" size="sm" onClick={addMetric} className="border-slate-700 text-slate-300">
            + 指標を追加
          </Button>
        </div>
        {metrics.map((m, i) => (
          <div key={i} className="mt-2 flex gap-2 items-start">
            <Input value={m.label} onChange={(e) => updateMetric(i, "label", e.target.value)} placeholder="ラベル" className="bg-slate-900 border-slate-700 flex-1" />
            <Input value={m.target ?? ""} onChange={(e) => updateMetric(i, "target", e.target.value)} placeholder="目標" className="bg-slate-900 border-slate-700 w-24" />
            <Input value={m.current ?? ""} onChange={(e) => updateMetric(i, "current", e.target.value)} placeholder="現在値" className="bg-slate-900 border-slate-700 w-24" />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeMetric(i)} className="text-red-400 hover:text-red-300">×</Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? "保存中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
