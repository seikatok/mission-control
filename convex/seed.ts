import { mutation } from "./_generated/server";
import { appendActivity } from "./helpers";

export default mutation({
  args: {},
  handler: async (ctx) => {
    // 既存ユーザーチェック
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      console.log("Seed already run. Skipping.");
      return;
    }

    const now = Date.now();

    // --- User ---
    const userId = await ctx.db.insert("users", {
      displayName: "Default User",
      email: "admin@mission-control.local",
      createdAt: now,
      updatedAt: now,
    });

    // --- Skills ---
    const skillWebSearch = await ctx.db.insert("skills", {
      key: "web_search",
      name: "Web Search",
      description: "Search the web for information",
      category: "tool",
      risk: { canReadSensitive: false, canWrite: false, canExternalSend: true },
      createdAt: now,
      updatedAt: now,
    });

    const skillFileWrite = await ctx.db.insert("skills", {
      key: "file_write",
      name: "File Write",
      description: "Write files to the workspace",
      category: "tool",
      risk: { canReadSensitive: false, canWrite: true, canExternalSend: false },
      createdAt: now,
      updatedAt: now,
    });

    const skillCodeExec = await ctx.db.insert("skills", {
      key: "code_exec",
      name: "Code Execution",
      description: "Execute code in the workspace",
      category: "tool",
      risk: { canReadSensitive: true, canWrite: true, canExternalSend: false },
      createdAt: now,
      updatedAt: now,
    });

    // --- AgentTemplates ---
    const researchTemplateId = await ctx.db.insert("agentTemplates", {
      name: "Research Agent",
      description: "Conducts web research and summarizes findings",
      policy: {
        allowExternalSend: false,
        allowFileWriteOutsideWorkspace: false,
        allowDangerousCommands: false,
        requireApprovalFor: ["external_send", "file_write"],
      },
      allowedSkillIds: [skillWebSearch],
      createdAt: now,
      updatedAt: now,
    });

    const devTemplateId = await ctx.db.insert("agentTemplates", {
      name: "Dev Agent",
      description: "Writes and executes code in the workspace",
      policy: {
        allowExternalSend: false,
        allowFileWriteOutsideWorkspace: false,
        allowDangerousCommands: false,
        requireApprovalFor: ["dangerous_commands", "external_send"],
      },
      allowedSkillIds: [skillFileWrite, skillCodeExec],
      createdAt: now,
      updatedAt: now,
    });

    // --- Gateway ---
    const gatewayId = await ctx.db.insert("gateways", {
      name: "Local Dev Gateway",
      kind: "local",
      workspaceRoot: "/Users/seika/Dev",
      isOnline: true,
      lastHeartbeatAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // --- Agents ---
    const researchAgentId = await ctx.db.insert("agents", {
      name: "Researcher Alpha",
      templateId: researchTemplateId,
      status: "idle",
      gatewayId,
      createdAt: now,
      updatedAt: now,
    });

    const devAgentId = await ctx.db.insert("agents", {
      name: "Dev Bot",
      templateId: devTemplateId,
      status: "running",
      gatewayId,
      createdAt: now,
      updatedAt: now,
    });

    // --- Goals ---
    const goal1Id = await ctx.db.insert("goals", {
      title: "Launch Mission Control MVP",
      description: "Build and ship the first version of Mission Control",
      domain: "work",
      area: "Engineering",
      status: "active",
      priority: "p1",
      ownerUserId: userId,
      timeframe: { startDate: "2026-02-01", endDate: "2026-03-31" },
      successMetrics: [
        { label: "All 9 pages working", target: "9", current: "9" },
        { label: "Seed data loaded", target: "1", current: "1" },
      ],
      tags: ["mvp", "engineering"],
      createdAt: now,
      updatedAt: now,
    });

    const goal1BoardId = await ctx.db.insert("boards", {
      name: "Launch Mission Control MVP Board",
      goalId: goal1Id,
      columns: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const goal2Id = await ctx.db.insert("goals", {
      title: "Improve Agent Observability",
      description: "Make it easier to monitor and debug agent runs",
      domain: "work",
      area: "Product",
      status: "active",
      priority: "p2",
      ownerUserId: userId,
      tags: ["observability"],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("boards", {
      name: "Improve Agent Observability Board",
      goalId: goal2Id,
      columns: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const goal3Id = await ctx.db.insert("goals", {
      title: "Personal: Learn Convex",
      description: "Get comfortable with Convex reactive database",
      domain: "personal",
      area: "Learning",
      status: "active",
      priority: "p2",
      ownerUserId: userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("boards", {
      name: "Personal: Learn Convex Board",
      goalId: goal3Id,
      columns: undefined,
      createdAt: now,
      updatedAt: now,
    });

    // --- Tasks ---
    const task1Id = await ctx.db.insert("tasks", {
      title: "Implement Convex schema",
      goalId: goal1Id,
      boardId: goal1BoardId,
      status: "done",
      priority: "p1",
      stage: null,
      assignee: { type: "agent", agentId: devAgentId },
      createdAt: now,
      updatedAt: now,
    });

    const task2Id = await ctx.db.insert("tasks", {
      title: "Build Dashboard page",
      goalId: goal1Id,
      boardId: goal1BoardId,
      status: "in_progress",
      priority: "p1",
      stage: null,
      assignee: { type: "agent", agentId: devAgentId },
      createdAt: now,
      updatedAt: now,
    });

    const task3Id = await ctx.db.insert("tasks", {
      title: "Write E2E tests",
      goalId: goal1Id,
      boardId: goal1BoardId,
      status: "todo",
      priority: "p2",
      stage: null,
      dueAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      createdAt: now,
      updatedAt: now,
    });

    const task4Id = await ctx.db.insert("tasks", {
      title: "Research competitor products",
      goalId: goal2Id,
      boardId: null,
      status: "todo",
      priority: "p3",
      stage: null,
      assignee: { type: "agent", agentId: researchAgentId },
      createdAt: now,
      updatedAt: now,
    });

    // Overdue task (for dashboard demo)
    const overdueTaskId = await ctx.db.insert("tasks", {
      title: "Update deployment docs",
      goalId: goal1Id,
      boardId: goal1BoardId,
      status: "todo",
      priority: "p2",
      stage: null,
      dueAt: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago (overdue)
      createdAt: now,
      updatedAt: now,
    });

    // --- Run ---
    const runId = await ctx.db.insert("runs", {
      agentId: devAgentId,
      taskId: task2Id,
      goalId: goal1Id,
      gatewayId,
      status: "running",
      objective: "Build the Dashboard page with 4 summary cards",
      startedAt: now - 10 * 60 * 1000, // started 10 min ago
      createdAt: now,
      updatedAt: now,
    });

    const run2Id = await ctx.db.insert("runs", {
      agentId: researchAgentId,
      taskId: task4Id,
      goalId: goal2Id,
      status: "succeeded",
      objective: "Research top 5 AI ops tools",
      startedAt: now - 30 * 60 * 1000,
      finishedAt: now - 5 * 60 * 1000,
      summary: "Found 5 major competitors. Detailed report created.",
      createdAt: now - 30 * 60 * 1000,
      updatedAt: now - 5 * 60 * 1000,
    });

    // --- Decision ---
    const decisionId = await ctx.db.insert("decisions", {
      type: "execution_approval",
      status: "pending",
      title: "Deploy to staging environment",
      description: "Agent requests approval to deploy the latest build to staging.",
      goalId: goal1Id,
      taskId: task2Id,
      agentId: devAgentId,
      options: [
        { key: "deploy_now", label: "Deploy now", details: "Run deployment script immediately", risk: "Low" },
        { key: "delay", label: "Delay 1 hour", details: "Schedule for later", risk: "None" },
      ],
      recommendation: "deploy_now",
      executionPreview: {
        commands: ["pnpm build", "pnpm deploy --env staging"],
        fileWrites: [],
        externalActions: [{ kind: "http_post", note: "POST to staging webhook" }],
      },
      createdAt: now,
      updatedAt: now,
    });

    const decision2Id = await ctx.db.insert("decisions", {
      type: "clarification",
      status: "pending",
      title: "Which database region to use?",
      description: "Need human input on preferred database region for the new service.",
      goalId: goal2Id,
      agentId: researchAgentId,
      options: [
        { key: "us_east", label: "US East", risk: "Low latency for US users" },
        { key: "eu_west", label: "EU West", risk: "GDPR compliant" },
      ],
      createdAt: now - 60 * 60 * 1000,
      updatedAt: now - 60 * 60 * 1000,
    });

    // --- Outputs ---
    await ctx.db.insert("outputs", {
      title: "Competitor Analysis Report",
      type: "research",
      goalId: goal2Id,
      taskId: task4Id,
      summary: "Analyzed 5 major AI ops tools. Mission Control differentiates via approval-first design.",
      artifacts: [
        { kind: "doc", ref: "https://notion.so/competitor-analysis", note: "Full report in Notion" },
      ],
      createdAt: now - 5 * 60 * 1000,
      updatedAt: now - 5 * 60 * 1000,
    });

    await ctx.db.insert("outputs", {
      title: "Schema Design v1",
      type: "architecture",
      goalId: goal1Id,
      taskId: task1Id,
      summary: "15-table Convex schema with full index coverage for Mission Control MVP.",
      createdAt: now - 60 * 60 * 1000,
      updatedAt: now - 60 * 60 * 1000,
    });

    // --- ComplianceEvents ---
    await ctx.db.insert("complianceEvents", {
      severity: "warn",
      message: "Agent attempted to write outside workspace root",
      agentId: devAgentId,
      gatewayId,
      attemptedAction: "file_write: /etc/hosts",
      policyRule: "allowFileWriteOutsideWorkspace = false",
      resolved: false,
      createdAt: now - 2 * 60 * 60 * 1000,
    });

    await ctx.db.insert("complianceEvents", {
      severity: "info",
      message: "Agent requested external HTTP call",
      agentId: researchAgentId,
      attemptedAction: "http_get: https://example.com",
      policyRule: "requireApprovalFor: external_send",
      resolved: true,
      resolvedAt: now - 30 * 60 * 1000,
      resolvedNote: "Approved for research purposes",
      createdAt: now - 3 * 60 * 60 * 1000,
    });

    await appendActivity(ctx, {
      type: "system_seed",
      message: "Seed data initialized",
    });

    console.log("Seed completed successfully.");
  },
});
