// ============================================================
// Core domain types shared across the app
// ============================================================

export type PermissionLevel = "READ" | "PREPARE" | "CONFIRM" | "AUTO";

export type MemoryCategory =
  | "PROFILE"
  | "PREFERENCE"
  | "PROJECT"
  | "WORKFLOW"
  | "INSTRUCTION"
  | "CONTEXT";

export interface Profile {
  id: string;
  v2i_id: string | null;
  name: string;
  avatar_url: string | null;
  preferred_language: "hindi" | "english" | "hinglish";
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ToolCallRecord {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: "pending" | "approved" | "denied" | "executed" | "failed";
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_calls?: ToolCallRecord[];
  created_at: string;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  recurring_rule: string | null; // e.g. "FREQ=DAILY" (RFC5545-lite)
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  remind_at: string;
  recurring_rule: string | null;
  status: "scheduled" | "fired" | "dismissed" | "cancelled";
  created_at: string;
}

export type ProjectStatus = "planning" | "active" | "paused" | "completed" | "archived";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: TaskPriority;
  deadline: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  project_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  summary: string | null;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  tool: string | null;
  status: "success" | "failure" | "pending";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  user_id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  source: "user_explicit" | "ai_inferred";
  created_at: string;
}

export interface ConnectedApp {
  id: string;
  user_id: string;
  app: "v2i_id" | "v2i_voice" | "beginning_write" | "yuniverse";
  status: "connected" | "not_configured" | "error";
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface PendingAction {
  id: string;
  tool: string;
  reason: string;
  affectedResource: string;
  input: Record<string, unknown>;
  createdAt: string;
}
