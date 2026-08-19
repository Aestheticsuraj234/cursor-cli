import chalk from "chalk";
import type { AgentRole } from "../agent/roles.js";

const AGENT_COLORS: Record<AgentRole, (text: string) => string> = {
    researcher: chalk.blue,
    planner: chalk.magenta,
    coder: chalk.green,
    reviewer: chalk.yellow,
};

export const fmt = {
  system: (text: string) => chalk.gray(text),
  assistant: (text: string) => chalk.cyan(text),
  tool: (text: string) => chalk.yellow(text),
  toolResult: (text: string) => chalk.dim.green(text),
  success: (text: string) => chalk.green(text),
  error: (text: string) => chalk.red(text),
  dim: (text: string) => chalk.dim(text),
  label: (text: string) => chalk.bold.white(text),
  mode: (text: string) => chalk.magenta(text),
  multi: (text: string) => chalk.bold.cyan(text),
  pipeline: (text: string) => chalk.bold.blue(text),
  review: (text: string) => chalk.bold.yellow(text),
  agent: (role: AgentRole, text: string) => AGENT_COLORS[role](text),
  agentTag: (label: string, text: string) => chalk.bold(`[${label}]`) + " " + text,
};

export function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
