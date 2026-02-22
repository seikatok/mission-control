import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const goalDomain = v.union(v.literal("work"), v.literal("personal"));
const goalStatus = v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("archived"));
const taskStatus = v.union(v.literal("todo"), v.literal("in_progress"), v.literal("blocked"), v.literal("waiting_decision"), v.literal("done"), v.literal("canceled"));
const taskPriority = v.union(v.literal("p1"), v.literal("p2"), v.literal("p3"));
const assigneeType = v.union(v.literal("human"), v.literal("agent"));
const decisionType = v.union(v.literal("execution_approval"), v.literal("decision_needed"), v.literal("clarification"), v.literal("risk_exception"), v.literal("merge_review"));
const decisionStatus = v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("changes_requested"), v.literal("canceled"));
const runStatus = v.union(v.literal("queued"), v.literal("running"), v.literal("waiting_decision"), v.literal("succeeded"), v.literal("failed"), v.literal("canceled"));
const agentStatus = v.union(v.literal("idle"), v.literal("running"), v.literal("waiting_decision"), v.literal("blocked"), v.literal("error"), v.literal("offline"), v.literal("paused"));
const outputType = v.union(v.literal("research"), v.literal("doc"), v.literal("code_diff"), v.literal("summary"), v.literal("linkset"), v.literal("image"), v.literal("video"), v.literal("architecture"), v.literal("decision"), v.literal("other"));
const complianceSeverity = v.union(v.literal("info"), v.literal("warn"), v.literal("high"), v.literal("critical"));
const activityType = v.union(
  v.literal("goal_created"),
  v.literal("goal_updated"),
  v.literal("task_created"),
  v.literal("task_updated"),
  v.literal("task_moved"),
  v.literal("decision_created"),
  v.literal("decision_resolved"),
  v.literal("agent_created"),
  v.literal("agent_status_changed"),
  v.literal("run_created"),
  v.literal("run_status_changed"),
  v.literal("output_created"),
  v.literal("compliance_created"),
  v.literal("gateway_heartbeat"),
  v.literal("system_seed"),
);

export default defineSchema({
  users: defineTable({
    displayName: v.string(),
    email: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  goals: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    domain: goalDomain,
    area: v.optional(v.string()),
    status: goalStatus,
    priority: taskPriority,
    ownerUserId: v.optional(v.id("users")),
    timeframe: v.optional(v.object({
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
    })),
    successMetrics: v.optional(v.array(v.object({
      label: v.string(),
      target: v.optional(v.string()),
      current: v.optional(v.string()),
    }))),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_domain_area_status", ["domain", "area", "status"])
    .index("by_status_priority", ["status", "priority"])
    .index("by_updatedAt", ["updatedAt"]),

  boards: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    goalId: v.optional(v.id("goals")),
    kind: v.optional(v.union(
      v.literal("generic"),
      v.literal("content_pipeline"),
      v.literal("software_pipeline"),
      v.literal("custom"),
    )),
    columns: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_goal_createdAt", ["goalId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    goalId: v.id("goals"),
    boardId: v.union(v.id("boards"), v.null()),
    status: taskStatus,
    priority: taskPriority,
    stage: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    assignee: v.optional(v.object({
      type: assigneeType,
      userId: v.optional(v.id("users")),
      agentId: v.optional(v.id("agents")),
    })),
    latestRunId: v.optional(v.id("runs")),
    latestDecisionId: v.optional(v.id("decisions")),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_goal_status", ["goalId", "status"])
    .index("by_status_priority", ["status", "priority"])
    .index("by_board_stage", ["boardId", "stage"])
    .index("by_dueAt", ["dueAt"])
    .index("by_board_createdAt", ["boardId", "createdAt"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_goal_updatedAt", ["goalId", "updatedAt"]),

  agentTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    policy: v.object({
      allowExternalSend: v.boolean(),
      allowFileWriteOutsideWorkspace: v.boolean(),
      allowDangerousCommands: v.boolean(),
      requireApprovalFor: v.array(v.string()),
    }),
    allowedSkillIds: v.array(v.id("skills")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  agents: defineTable({
    name: v.string(),
    templateId: v.id("agentTemplates"),
    status: agentStatus,
    gatewayId: v.optional(v.id("gateways")),
    lastHeartbeatAt: v.optional(v.number()),
    currentTaskId: v.optional(v.id("tasks")),
    currentRunId: v.optional(v.id("runs")),
    avatar: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_gateway", ["gatewayId"])
    .index("by_template", ["templateId"]),

  gateways: defineTable({
    name: v.string(),
    kind: v.union(v.literal("local"), v.literal("remote")),
    endpoint: v.optional(v.string()),
    workspaceRoot: v.optional(v.string()),
    policySummary: v.optional(v.object({
      allowedCommands: v.array(v.string()),
      allowedPathPrefixes: v.array(v.string()),
      networkAllowlist: v.array(v.string()),
    })),
    lastHeartbeatAt: v.optional(v.number()),
    isOnline: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_online", ["isOnline"]),

  skills: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.union(v.literal("tool"), v.literal("connector"), v.literal("agent_action")),
    risk: v.object({
      canReadSensitive: v.boolean(),
      canWrite: v.boolean(),
      canExternalSend: v.boolean(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  runs: defineTable({
    taskId: v.optional(v.id("tasks")),
    goalId: v.optional(v.id("goals")),
    agentId: v.id("agents"),
    gatewayId: v.optional(v.id("gateways")),
    status: runStatus,
    objective: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    relatedDecisionId: v.optional(v.id("decisions")),
    contextPackId: v.optional(v.id("contextPacks")),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_agent_status", ["agentId", "status"])
    .index("by_status", ["status"])
    .index("by_goal", ["goalId"])
    .index("by_createdAt", ["createdAt"]),

  decisions: defineTable({
    type: decisionType,
    status: decisionStatus,
    title: v.string(),
    description: v.optional(v.string()),
    goalId: v.optional(v.id("goals")),
    taskId: v.optional(v.id("tasks")),
    runId: v.optional(v.id("runs")),
    agentId: v.optional(v.id("agents")),
    options: v.optional(v.array(v.object({
      key: v.string(),
      label: v.string(),
      details: v.optional(v.string()),
      risk: v.optional(v.string()),
    }))),
    recommendation: v.optional(v.string()),
    executionPreview: v.optional(v.object({
      commands: v.optional(v.array(v.string())),
      fileWrites: v.optional(v.array(v.object({
        path: v.string(),
        note: v.optional(v.string()),
      }))),
      externalActions: v.optional(v.array(v.object({
        kind: v.string(),
        note: v.optional(v.string()),
      }))),
    })),
    resolvedByUserId: v.optional(v.id("users")),
    resolutionNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_goal_status", ["goalId", "status"])
    .index("by_task_status", ["taskId", "status"])
    .index("by_type_status", ["type", "status"])
    .index("by_status_createdAt", ["status", "createdAt"]),

  outputs: defineTable({
    title: v.string(),
    type: outputType,
    goalId: v.optional(v.id("goals")),
    taskId: v.optional(v.id("tasks")),
    runId: v.optional(v.id("runs")),
    agentId: v.optional(v.id("agents")),
    summary: v.optional(v.string()),
    artifacts: v.optional(v.array(v.object({
      kind: v.string(),
      ref: v.string(),
      note: v.optional(v.string()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_goal_createdAt", ["goalId", "createdAt"])
    .index("by_task_createdAt", ["taskId", "createdAt"])
    .index("by_type_createdAt", ["type", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  complianceEvents: defineTable({
    severity: complianceSeverity,
    message: v.string(),
    goalId: v.optional(v.id("goals")),
    taskId: v.optional(v.id("tasks")),
    runId: v.optional(v.id("runs")),
    agentId: v.optional(v.id("agents")),
    gatewayId: v.optional(v.id("gateways")),
    attemptedAction: v.optional(v.string()),
    policyRule: v.optional(v.string()),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolvedNote: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_severity_createdAt", ["severity", "createdAt"])
    .index("by_agent_createdAt", ["agentId", "createdAt"])
    .index("by_resolved_createdAt", ["resolved", "createdAt"]),

  activityEvents: defineTable({
    type: activityType,
    goalId: v.optional(v.id("goals")),
    taskId: v.optional(v.id("tasks")),
    decisionId: v.optional(v.id("decisions")),
    runId: v.optional(v.id("runs")),
    outputId: v.optional(v.id("outputs")),
    agentId: v.optional(v.id("agents")),
    gatewayId: v.optional(v.id("gateways")),
    message: v.optional(v.string()),
    data: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_goal_createdAt", ["goalId", "createdAt"])
    .index("by_task_createdAt", ["taskId", "createdAt"]),

  sources: defineTable({
    key: v.string(),
    name: v.string(),
    enabled: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    lastSyncStatus: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  contextPacks: defineTable({
    goalId: v.optional(v.id("goals")),
    taskId: v.optional(v.id("tasks")),
    runId: v.optional(v.id("runs")),
    decisionId: v.optional(v.id("decisions")),
    title: v.optional(v.string()),
    items: v.array(v.object({
      sourceKey: v.string(),
      ref: v.string(),
      snippet: v.string(),
      meta: v.optional(v.object({
        title: v.optional(v.string()),
        timestamp: v.optional(v.number()),
      })),
    })),
    createdAt: v.number(),
  })
    .index("by_task_createdAt", ["taskId", "createdAt"])
    .index("by_goal_createdAt", ["goalId", "createdAt"]),
});
