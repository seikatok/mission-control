"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/layout/page-header";
import { GoalForm, GoalFormValues } from "@/components/goals/goal-form";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function EditGoalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const goalId = id as Id<"goals">;

  const goal = useQuery(api.goals.get, { id: goalId });
  const updateGoal = useMutation(api.goals.update);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (goal === undefined) return <div className="p-6 text-sm text-slate-400">Loading...</div>;
  if (goal === null) return <div className="p-6 text-sm text-slate-400">Goal not found</div>;

  async function handleSubmit(values: GoalFormValues) {
    setIsSubmitting(true);
    try {
      const tags = values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined;

      await updateGoal({
        id: goalId,
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
      toast.success("Goal updated");
      router.push(`/goals/${goalId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update goal");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Edit Goal" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <GoalForm
          defaultValues={{
            title: goal.title,
            domain: goal.domain,
            area: goal.area,
            status: goal.status,
            priority: goal.priority,
            description: goal.description,
            tags: goal.tags?.join(", "),
            successMetrics: goal.successMetrics ?? [],
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Update Goal"
        />
      </div>
    </div>
  );
}
