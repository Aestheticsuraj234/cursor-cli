import { createSession, type AgentSession } from "./create-session.js";
import { handleMessage } from "./message-handler.js";
import { runQueryCollect } from "./run-query.js";
import {
    AGENT_ROLES,
    buildRolePrompt,
    type AgentRole,
} from "./roles.js";
import { fmt } from "../ui/format.js";

export type ManagedAgent = {
    id: string;
    role: AgentRole;
    label: string;
    session: AgentSession;
    status: "idle" | "running" | "done" | "error";
    background?: Promise<void>;
};

export class AgentOrchestrator {
    private agents = new Map<string, ManagedAgent>();
    private activeId: string | null = null;
    private counter = 0;

    spawn(role: AgentRole): ManagedAgent {
        const id = `${role}-${++this.counter}`;
        const { mode } = AGENT_ROLES[role];
        const session = createSession(mode);
        const agent: ManagedAgent = {
            id,
            role,
            label: AGENT_ROLES[role].label,
            session,
            status: "idle",
        };

        this.agents.set(id, agent);
        if (!this.activeId) {
            this.activeId = id;
        }

        return agent;
    }

    startBackground(agentId: string, verbose = false): void {
        const agent = this.getAgent(agentId);
        if (agent.background) return;

        agent.background = (async () => {
            agent.status = "running";
            try {
                for await (const message of agent.session.query) {
                    handleMessage(message, { verbose, agentLabel: agent.label });
                }
                agent.status = "done";
            } catch (error) {
                agent.status = "error";
                console.error(
                    fmt.error(
                        `[${agent.label}] Session error: ${error instanceof Error ? error.message : error}`
                    )
                );
            }
        })();
    }

    getAgent(id: string): ManagedAgent {
        const agent = this.agents.get(id);
        if (!agent) {
            throw new Error(`Unknown agent "${id}". Use /agents to list active agents.`);
        }
        return agent;
    }

    getActiveAgent(): ManagedAgent | null {
        return this.activeId ? this.agents.get(this.activeId) ?? null : null;
    }

    switchAgent(id: string): ManagedAgent {
        const agent = this.getAgent(id);
        this.activeId = id;
        return agent;
    }

    listAgents(): ManagedAgent[] {
        return [...this.agents.values()];
    }

    pushToActive(content: string): void {
        const agent = this.getActiveAgent();
        if (!agent) {
            throw new Error("No active agent. Spawn one with /spawn <role>.");
        }
        agent.session.inputQueue.push(content);
    }

    async delegate(role: AgentRole, task: string, verbose = false): Promise<string> {
        console.log(fmt.agent(role, `Delegating to ${AGENT_ROLES[role].label}…`));
        return runQueryCollect(buildRolePrompt(role, task), {
            mode: AGENT_ROLES[role].mode,
            verbose,
            agentLabel: AGENT_ROLES[role].label,
        });
    }

    async runParallel(
        task: string,
        roles: AgentRole[],
        verbose = false
    ): Promise<Map<AgentRole, string>> {
        const results = new Map<AgentRole, string>();

        await Promise.all(
            roles.map(async (role) => {
                console.log(fmt.agent(role, `${AGENT_ROLES[role].label} starting…`));
                const result = await runQueryCollect(buildRolePrompt(role, task), {
                    mode: AGENT_ROLES[role].mode,
                    verbose,
                    agentLabel: AGENT_ROLES[role].label,
                });
                results.set(role, result);
            })
        );

        return results;
    }

    buildSynthesisPrompt(task: string, results: Map<AgentRole, string>): string {
        const sections = [...results.entries()]
            .map(([role, output]) => `## ${AGENT_ROLES[role].label}\n${output || "(no output)"}`)
            .join("\n\n");

        return [
            "You are the Coordinator agent. Multiple specialist agents worked on the same task.",
            "Synthesize their outputs into one clear, actionable final answer.",
            "Call out disagreements, gaps, and a recommended next step.",
            "",
            `# Original task\n${task}`,
            "",
            `# Agent outputs\n${sections}`,
        ].join("\n");
    }

    async closeAll(): Promise<void> {
        for (const agent of this.agents.values()) {
            agent.session.inputQueue.close();
            agent.session.query.close();
        }

        await Promise.all(
            [...this.agents.values()]
                .map((agent) => agent.background)
                .filter((background): background is Promise<void> => Boolean(background))
        );

        this.agents.clear();
        this.activeId = null;
    }
}