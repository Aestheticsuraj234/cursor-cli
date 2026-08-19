import { input } from "@inquirer/prompts";
import { AgentOrchestrator } from "../agent/orchestrator.js";
import { handleMessage } from "../agent/message-handler.js";
import {
    AGENT_ROLES,
    parseAgentRole,
} from "../agent/roles.js";
import { MULTI_SLASH_COMMANDS, SLASH_COMMANDS } from "../config/constant.js";
import { fmt } from "../ui/format.js";
import { startSpinner, stopSpinner } from "../ui/spinner.js";

export type MultiChatOptions = {
    verbose?: boolean;
};

function printSlashHelp(): void {
    console.log(fmt.label("\nSlash commands:"));
    for (const { command, description } of [...SLASH_COMMANDS, ...MULTI_SLASH_COMMANDS]) {
        console.log(fmt.dim(`  ${command.padEnd(28)} ${description}`));
    }
    console.log();
}

function printAgents(orchestrator: AgentOrchestrator): void {
    const agents = orchestrator.listAgents();
    const active = orchestrator.getActiveAgent();

    console.log(fmt.label("\nActive agents:"));
    if (agents.length === 0) {
        console.log(fmt.dim("  (none — use /spawn <role> to add one)"));
        return;
    }

    for (const agent of agents) {
        const marker = active?.id === agent.id ? "→ " : "  ";
        console.log(
            fmt.dim(
                `${marker}${agent.id.padEnd(14)} ${agent.label.padEnd(12)} ${agent.status} · ${AGENT_ROLES[agent.role].description}`
            )
        );
    }
    console.log();
}

async function handleMultiSlashCommand(
    line: string,
    orchestrator: AgentOrchestrator,
    verbose: boolean
): Promise<{ handled: boolean; shouldExit?: boolean }> {
    const trimmed = line.trim();

    if (trimmed === "/help") {
        printSlashHelp();
        return { handled: true };
    }

    if (trimmed === "/exit") {
        return { handled: true, shouldExit: true };
    }

    if (trimmed === "/agents") {
        printAgents(orchestrator);
        return { handled: true };
    }

    if (trimmed.startsWith("/spawn")) {
        const roleArg = trimmed.split(/\s+/)[1];
        if (!roleArg) {
            console.log(fmt.error("Usage: /spawn researcher|planner|coder|reviewer"));
            return { handled: true };
        }

        const role = parseAgentRole(roleArg);
        if (!role) {
            console.log(fmt.error(`Unknown role: ${roleArg}`));
            return { handled: true };
        }

        const agent = orchestrator.spawn(role);
        orchestrator.startBackground(agent.id, verbose);
        orchestrator.switchAgent(agent.id);
        console.log(fmt.agent(role, `Spawned ${agent.label} (${agent.id})`));
        return { handled: true };
    }

    if (trimmed.startsWith("/switch")) {
        const id = trimmed.split(/\s+/)[1];
        if (!id) {
            printAgents(orchestrator);
            return { handled: true };
        }

        try {
            const agent = orchestrator.switchAgent(id);
            console.log(fmt.mode(`Switched to ${agent.label} (${agent.id})`));
        } catch (error) {
            console.log(fmt.error(error instanceof Error ? error.message : String(error)));
        }
        return { handled: true };
    }

    if (trimmed.startsWith("/delegate")) {
        const parts = trimmed.split(/\s+/);
        const roleArg = parts[1];
        const task = parts.slice(2).join(" ").trim();

        if (!roleArg || !task) {
            console.log(fmt.error("Usage: /delegate <role> <task>"));
            return { handled: true };
        }

        const role = parseAgentRole(roleArg);
        if (!role) {
            console.log(fmt.error(`Unknown role: ${roleArg}`));
            return { handled: true };
        }

        startSpinner(`${AGENT_ROLES[role].label} working…`);
        try {
            const result = await orchestrator.delegate(role, task, verbose);
            stopSpinner();
            console.log(fmt.agent(role, result.trim() || "(no output)"));
        } catch (error) {
            stopSpinner();
            console.log(fmt.error(error instanceof Error ? error.message : String(error)));
        }
        return { handled: true };
    }

    return { handled: false };
}

export async function startMultiChat(options: MultiChatOptions = {}): Promise<void> {
    const { verbose = false } = options;
    const orchestrator = new AgentOrchestrator();

    const lead = orchestrator.spawn("coder");
    orchestrator.startBackground(lead.id, verbose);

    console.log(fmt.multi("Multi-agent chat started"));
    console.log(fmt.dim(`Lead agent: ${lead.label} (${lead.id})`));
    console.log(fmt.dim("Type /help for commands, /spawn to add agents, /exit to quit.\n"));
    printSlashHelp();

    let running = true;

    while (running) {
        const active = orchestrator.getActiveAgent();
        const promptLabel = active ? fmt.label(`You → ${active.label}:`) : fmt.label("You:");
        const line = await input({ message: promptLabel });
        const trimmed = line.trim();

        if (trimmed === "/exit") {
            running = false;
            break;
        }

        const slash = await handleMultiSlashCommand(trimmed, orchestrator, verbose);
        if (slash.handled) {
            if (slash.shouldExit) running = false;
            continue;
        }

        startSpinner(`${active?.label ?? "Agent"} working...`);
        orchestrator.pushToActive(trimmed);
    }

    await orchestrator.closeAll();
    stopSpinner();
    console.log(fmt.dim("Multi-agent session ended."));
}
