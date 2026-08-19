import { AgentOrchestrator } from "./orchestrator.js";
import { runQuery } from "./run-query.js";
import { DEFAULT_MULTI_ROLES, type AgentRole } from "./roles.js";
import { fmt } from "../ui/format.js";

export type RunMultiOptions = {
    roles?: AgentRole[];
    verbose?: boolean;
    synthesize?: boolean;
};

export async function runMultiAgent(
    task: string,
    options: RunMultiOptions = {}
): Promise<void> {
    const {
        roles = DEFAULT_MULTI_ROLES,
        verbose = false,
        synthesize = true,
    } = options;

    const orchestrator = new AgentOrchestrator();

    console.log(fmt.multi(`Multi-agent run · ${roles.join(", ")}`));
    console.log(fmt.dim(`Task: ${task}\n`));

    const results = await orchestrator.runParallel(task, roles, verbose);

    if (!synthesize) {
        console.log(fmt.label("\nAgent outputs:"));
        for (const role of roles) {
            console.log(fmt.agent(role, `\n--- ${role} ---`));
            console.log(results.get(role)?.trim() || fmt.dim("(no output)"));
        }
        return;
    }

    const synthesisPrompt = orchestrator.buildSynthesisPrompt(task, results);
    console.log(fmt.multi("\nCoordinator synthesizing results…\n"));
    await runQuery(synthesisPrompt, {
        mode: "agent",
        verbose,
        agentLabel: "Coordinator",
    });
}
