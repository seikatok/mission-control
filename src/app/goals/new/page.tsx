"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { GoalForm, GoalFormValues } from "@/components/goals/goal-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewGoalPage() {
  const router = useRouter();
  const createGoal = useMutation(api.goals.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: GoalFormValues) {
    setIsSubmitting(true);
    try {
      const tags = values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined;

      await createGoal({
        title: values.title,
        domain: values.domain,
        area: values.area || undefined,
        status: values.status,
        priority: values.priority,
        description: values.description || undefined,
        successMetrics: values.successMetrics.filter((m) => m.label).map((m) => ({
          label: m.label,
          target: m.target || undefined,
          current: m.current || undefined,
        })),
        tags: tags && tags.length > 0 ? tags : undefined,
      });
      toast.success("ゴールを作成しました");
      router.push("/goals");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="新規ゴール" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <GoalForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="ゴールを作成" />
      </div>
    </div>
  );
}
