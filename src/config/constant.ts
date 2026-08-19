import type { CliMode } from "../agent/modes.js";

export const CLI_MODES: CliMode[] = ["agent", "ask", "plan"];

export const MODE_DESCRIPTIONS: Record<CliMode, string> = {
  agent: "Read, edit, and run commands — full agent loop with tools",
  ask: "Read-only exploration — answers without changing files",
  plan: "Explore and propose a plan — no file edits applied",
};

export const SLASH_COMMANDS = [
  { command: "/mode agent|ask|plan", description: "Switch permission mode mid-session" },
  { command: "/help", description: "Show slash commands" },
  { command: "/context", description: "Show context window usage" },
  { command: "/exit", description: "End the chat session" },
] as const;

export const MULTI_SLASH_COMMANDS = [
  { command: "/spawn <role>", description: "Spawn researcher|planner|coder|reviewer" },
  { command: "/agents", description: "List spawned agents and active agent" },
  { command: "/switch <id>", description: "Route messages to a specific agent" },
  { command: "/delegate <role> <task>", description: "One-shot task to a specialist agent" },
] as const;

export const AGENT_ROLE_LIST = "researcher | planner | coder | reviewer";