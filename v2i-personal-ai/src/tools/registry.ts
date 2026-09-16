import type { ToolDefinition } from "./types";
import { tasksService } from "@/services/tasksService";
import { projectsService } from "@/services/projectsService";
import { remindersService } from "@/services/remindersService";
import { filesService } from "@/services/filesService";
import { activityService } from "@/services/activityService";
import { webResearchService } from "@/services/webResearchService";
import { memoryService } from "@/memory/memoryService";
import { BeginningWriteService } from "@/services/integrations/BeginningWriteService";
import { YuniverseService } from "@/services/integrations/YuniverseService";

export const tools: ToolDefinition[] = [
  // ---------------- Tasks ----------------
  {
    name: "get_tasks",
    description: "List the user's tasks, optionally filtered by status or category.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
        category: { type: "string" },
      },
    },
    permission: "READ",
    describeAffectedResource: () => "task list",
    execute: async (input, ctx) => tasksService.list(ctx.userId, input),
  },
  {
    name: "create_task",
    description: "Create a new task, optionally with a due date, priority, and project link.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        due_date: { type: "string", description: "ISO 8601 datetime" },
        project_id: { type: "string" },
        category: { type: "string" },
      },
      required: ["title"],
    },
    permission: "AUTO",
    describeAffectedResource: (input: any) => `task "${input.title}"`,
    execute: async (input, ctx) => tasksService.create(ctx.userId, input),
  },
  {
    name: "update_task",
    description: "Update an existing task's fields.",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string" }, patch: { type: "object" } },
      required: ["task_id", "patch"],
    },
    permission: "AUTO",
    describeAffectedResource: (input: any) => `task ${input.task_id}`,
    execute: async (input: any, ctx) => tasksService.update(ctx.userId, input.task_id, input.patch),
  },
  {
    name: "complete_task",
    description: "Mark a task as completed.",
    inputSchema: { type: "object", properties: { task_id: { type: "string" } }, required: ["task_id"] },
    permission: "AUTO",
    describeAffectedResource: (input: any) => `task ${input.task_id}`,
    execute: async (input: any, ctx) => tasksService.complete(ctx.userId, input.task_id),
  },
  {
    name: "delete_task",
    description: "Permanently delete a task. Destructive.",
    inputSchema: { type: "object", properties: { task_id: { type: "string" } }, required: ["task_id"] },
    permission: "CONFIRM",
    describeAffectedResource: (input: any) => `task ${input.task_id}`,
    execute: async (input: any, ctx) => tasksService.remove(ctx.userId, input.task_id),
  },

  // ---------------- Reminders ----------------
  {
    name: "create_reminder",
    description: "Create a reminder at a specific date/time, optionally linked to a task.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        remind_at: { type: "string", description: "ISO 8601 datetime" },
        task_id: { type: "string" },
        recurring_rule: { type: "string" },
      },
      required: ["title", "remind_at"],
    },
    permission: "AUTO",
    describeAffectedResource: (input: any) => `reminder "${input.title}" at ${input.remind_at}`,
    execute: async (input, ctx) => remindersService.create(ctx.userId, input),
  },

  // ---------------- Projects ----------------
  {
    name: "get_projects",
    description: "List the user's projects, optionally filtered by status.",
    inputSchema: { type: "object", properties: { status: { type: "string" } } },
    permission: "READ",
    describeAffectedResource: () => "project list",
    execute: async (input: any, ctx) => projectsService.list(ctx.userId, input.status),
  },
  {
    name: "create_project",
    description: "Create a new project.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        deadline: { type: "string" },
      },
      required: ["name"],
    },
    permission: "AUTO",
    describeAffectedResource: (input: any) => `project "${input.name}"`,
    execute: async (input, ctx) => projectsService.create(ctx.userId, input),
  },
  {
    name: "update_project",
    description: "Update a project's fields (status, priority, deadline, etc).",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string" }, patch: { type: "object" } },
      required: ["project_id", "patch"],
    },
    permission: "AUTO",
    describeAffectedResource: (input: any) => `project ${input.project_id}`,
    execute: async (input: any, ctx) => projectsService.update(ctx.userId, input.project_id, input.patch),
  },
  {
    name: "summarize_project",
    description: "Generate a status summary of a project and its tasks.",
    inputSchema: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] },
    permission: "READ",
    describeAffectedResource: (input: any) => `project ${input.project_id}`,
    execute: async (input: any, ctx) => projectsService.summarize(ctx.userId, input.project_id),
  },

  // ---------------- Files ----------------
  {
    name: "search_files",
    description: "List/search the user's uploaded files, optionally by project.",
    inputSchema: { type: "object", properties: { project_id: { type: "string" } } },
    permission: "READ",
    describeAffectedResource: () => "file list",
    execute: async (input: any, ctx) => filesService.list(ctx.userId, input.project_id),
  },

  // ---------------- Web research ----------------
  {
    name: "search_web",
    description: "Search the web for current information. Reports clearly if unavailable — never invents results.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    permission: "READ",
    describeAffectedResource: (input: any) => `web search: ${input.query}`,
    execute: async (input: any) => webResearchService.search(input.query),
  },

  // ---------------- Memory ----------------
  {
    name: "remember",
    description: "Save an important fact, preference, or instruction to long-term memory.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["PROFILE", "PREFERENCE", "PROJECT", "WORKFLOW", "INSTRUCTION", "CONTEXT"],
        },
        key: { type: "string" },
        value: { type: "string" },
      },
      required: ["category", "key", "value"],
    },
    permission: "AUTO",
    describeAffectedResource: (input: any) => `memory item "${input.key}"`,
    execute: async (input: any, ctx) =>
      memoryService.remember(ctx.userId, input.category, input.key, input.value, "ai_inferred"),
  },

  // ---------------- Activity ----------------
  {
    name: "get_activity",
    description: "Get recent activity log entries.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
    permission: "READ",
    describeAffectedResource: () => "activity log",
    execute: async (input: any, ctx) => activityService.recent(ctx.userId, input.limit ?? 20),
  },

  // ---------------- Beginning Write (music) ----------------
  {
    name: "generate_song_concept",
    description:
      "Generate a song concept, theme, or lyric draft using the AI itself. Pure text generation — does not touch Beginning Write.",
    inputSchema: {
      type: "object",
      properties: { brief: { type: "string" }, language: { type: "string" } },
      required: ["brief"],
    },
    permission: "PREPARE",
    describeAffectedResource: (input: any) => `song concept: ${input.brief}`,
    // Actual generation happens inline in the agent loop (it's a direct LLM
    // completion, not an external call), so this returns the brief for the
    // orchestrator to expand in its next turn.
    execute: async (input: any) => ({ brief: input.brief, note: "Expand this into a full concept in your reply." }),
  },
  {
    name: "update_music_project_status",
    description: "Update the status of a Beginning Write music project (requires Beginning Write to be connected).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        status: { type: "string", enum: ["concept", "writing", "production", "mixing", "released"] },
      },
      required: ["project_id", "status"],
    },
    permission: "CONFIRM",
    describeAffectedResource: (input: any) => `Beginning Write project ${input.project_id}`,
    execute: async (input: any, ctx) =>
      BeginningWriteService.updateProjectStatus(ctx.userId, input.project_id, input.status),
  },

  // ---------------- Yuniverse ----------------
  {
    name: "publish_to_yuniverse",
    description: "Publish a creator project to Yuniverse (requires Yuniverse to be connected). Always requires confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        captions: { type: "string" },
      },
      required: ["project_id"],
    },
    permission: "CONFIRM",
    describeAffectedResource: (input: any) => `Yuniverse project ${input.project_id} (publish)`,
    execute: async (input: any, ctx) =>
      YuniverseService.publish(ctx.userId, input.project_id, {
        title: input.title,
        description: input.description,
        captions: input.captions,
      }),
  },
];

export function getTool(name: string): ToolDefinition | undefined {
  return tools.find((t) => t.name === name);
}
