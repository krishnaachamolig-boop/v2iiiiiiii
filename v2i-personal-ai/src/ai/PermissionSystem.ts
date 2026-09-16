import type { PermissionLevel, PendingAction } from "@/types";

/**
 * Central permission gate. Every tool declares a PermissionLevel (see
 * src/tools/registry.ts). This module is the ONLY place that decides whether
 * a tool call may run immediately or must wait for user approval.
 *
 * READ    — safe, read-only, runs immediately, no logging prompt needed beyond activity log.
 * PREPARE — AI may draft/compose content but must not persist or send it.
 * CONFIRM — requires an explicit user approval via the confirmation card before executing.
 * AUTO    — safe, repeatable, side-effecting actions (e.g. create a task) — runs immediately
 *           but is always logged, and the user can downgrade any AUTO tool to CONFIRM in Settings.
 */

export interface PermissionDecision {
  canExecuteImmediately: boolean;
  requiresConfirmation: boolean;
  reason: string;
}

export interface UserPermissionOverrides {
  /** Tool names the user has forced into CONFIRM mode regardless of default. */
  forceConfirm: Set<string>;
  /** Tool names the user has disabled entirely. */
  disabled: Set<string>;
}

export function evaluatePermission(
  toolName: string,
  level: PermissionLevel,
  overrides: UserPermissionOverrides
): PermissionDecision {
  if (overrides.disabled.has(toolName)) {
    return {
      canExecuteImmediately: false,
      requiresConfirmation: false,
      reason: `Tool "${toolName}" is disabled in Settings.`,
    };
  }

  if (overrides.forceConfirm.has(toolName)) {
    return {
      canExecuteImmediately: false,
      requiresConfirmation: true,
      reason: `User has set "${toolName}" to always require confirmation.`,
    };
  }

  switch (level) {
    case "READ":
      return { canExecuteImmediately: true, requiresConfirmation: false, reason: "Read-only action." };
    case "PREPARE":
      return {
        canExecuteImmediately: true,
        requiresConfirmation: false,
        reason: "Drafting/preparation only — nothing is persisted or sent.",
      };
    case "CONFIRM":
      return {
        canExecuteImmediately: false,
        requiresConfirmation: true,
        reason: "This action has side effects and requires explicit approval.",
      };
    case "AUTO":
      return {
        canExecuteImmediately: true,
        requiresConfirmation: false,
        reason: "Safe, repeatable action — auto-approved, still logged.",
      };
  }
}

/** Builds the data shown on the confirmation card. Never skip this for CONFIRM-level tools. */
export function buildPendingAction(
  toolName: string,
  input: Record<string, unknown>,
  reason: string,
  affectedResource: string
): PendingAction {
  return {
    id: crypto.randomUUID(),
    tool: toolName,
    reason,
    affectedResource,
    input,
    createdAt: new Date().toISOString(),
  };
}
