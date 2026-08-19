import type { CliMode } from "./modes.js";

export type AgentRole = "researcher" | "planner" | "coder" | "reviewer";

export type RoleConfig = {
    label: string;
    mode: CliMode;
    description: string;
    promptPrefix: string;
};

export const AGENT_ROLES: Record<AgentRole, RoleConfig> = {
    researcher: {
        label: "Researcher",
        mode: "ask",
        description: "Read-only exploration and information gathering",
        promptPrefix:
            "You are a Researcher agent. Explore the codebase and gather facts. Do not modify files.\n\n",
    },
    planner: {
        label: "Planner",
        mode: "plan",
        description: "Analyze requirements and propose an implementation plan",
        promptPrefix:
            "You are a Planner agent. Break down the task and propose a clear plan. Do not edit files.\n\n",
    },
    coder: {
        label: "Coder",
        mode: "agent",
        description: "Implement changes with full read/write/bash access",
        promptPrefix:
            "You are a Coder agent. Implement the requested changes directly in the codebase.\n\n",
    },
    reviewer: {
        label: "Reviewer",
        mode: "ask",
        description: "Review code quality, bugs, and suggest improvements",
        promptPrefix:
            "You are a Reviewer agent. Critically review code for bugs, security, and quality. Do not modify files.\n\n",
    },
};

export const DEFAULT_MULTI_ROLES: AgentRole[] = ["planner", "researcher", "coder"];

export const DEFAULT_PIPELINE_ROLES: AgentRole[] = ["planner", "researcher", "coder", "reviewer"];

export function parseAgentRole(value: string): AgentRole | null {
    if (value in AGENT_ROLES) {
        return value as AgentRole;
    }
    return null;
}

export function parseAgentRoles(value: string): AgentRole[] {
    const roles = value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

    const parsed: AgentRole[] = [];
    for (const role of roles) {
        const agentRole = parseAgentRole(role);
        if (!agentRole) {
            throw new Error(`Unknown agent role "${role}". Use researcher, planner, coder, or reviewer.`);
        }
        if (!parsed.includes(agentRole)) {
            parsed.push(agentRole);
        }
    }

    return parsed.length > 0 ? parsed : [...DEFAULT_MULTI_ROLES];
}

export function buildRolePrompt(role: AgentRole, task: string): string {
    return `${AGENT_ROLES[role].promptPrefix}Task:\n${task}`;
}

export type PipelineStep = {
    role: AgentRole;
    output: string;
};

export function buildPipelinePrompt(
    role: AgentRole,
    task: string,
    priorSteps: PipelineStep[]
): string {
    const priorContext =
        priorSteps.length === 0
            ? ""
            : [
                  "",
                  "# Prior pipeline steps",
                  ...priorSteps.map(
                      (step) => `## ${AGENT_ROLES[step.role].label}\n${step.output || "(no output)"}`
                  ),
              ].join("\n");

    return [
        AGENT_ROLES[role].promptPrefix.trim(),
        "You are a step in a sequential pipeline. Use prior agent outputs as context for your work.",
        "",
        `# Task\n${task}`,
        priorContext,
    ].join("\n");
}
