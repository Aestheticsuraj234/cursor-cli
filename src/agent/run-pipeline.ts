import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { runQueryCollect } from "./run-query.js";
import {
    AGENT_ROLES,
    buildPipelinePrompt,
    DEFAULT_PIPELINE_ROLES,
    type AgentRole,
    type PipelineStep,
} from "./roles.js";
import { fmt } from "../ui/format.js";

export type RunPipelineOptions = {
    roles?: AgentRole[];
    verbose?: boolean;
    output?: string;
};

function buildTranscript(task: string, steps: PipelineStep[]): string {
    const sections = steps
        .map(
            (step) =>
                `## ${AGENT_ROLES[step.role].label}\n\n${step.output.trim() || "_(no output)_"}`
        )
        .join("\n\n---\n\n");

    return [`# Pipeline transcript`, "", `**Task:** ${task}`, "", sections].join("\n");
}

async function saveTranscript(path: string, content: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
}

function defaultOutputPath(): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return join(process.cwd(), ".cursor-cli", "pipelines", `${stamp}.md`);
}

export async function runPipeline(
    task: string,
    options: RunPipelineOptions = {}
): Promise<void> {
    const { roles = DEFAULT_PIPELINE_ROLES, verbose = false, output } = options;
    const steps: PipelineStep[] = [];

    console.log(fmt.pipeline(`Pipeline · ${roles.join(" → ")}`));
    console.log(fmt.dim(`Task: ${task}\n`));

    for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        const stepNum = i + 1;

        console.log(fmt.agent(role, `Step ${stepNum}/${roles.length} · ${AGENT_ROLES[role].label}`));

        const prompt = buildPipelinePrompt(role, task, steps);
        const result = await runQueryCollect(prompt, {
            mode: AGENT_ROLES[role].mode,
            verbose,
            agentLabel: AGENT_ROLES[role].label,
        });

        steps.push({ role, output: result });

        if (i < roles.length - 1) {
            console.log(fmt.dim(`Handoff → ${AGENT_ROLES[roles[i + 1]].label}\n`));
        }
    }

    const finalStep = steps.at(-1);
    if (finalStep?.output.trim()) {
        console.log(fmt.label("\nPipeline result:"));
        console.log(fmt.success(finalStep.output.trim()));
    }

    const transcript = buildTranscript(task, steps);
    const outputPath = output ?? defaultOutputPath();

    await saveTranscript(outputPath, transcript);
    console.log(fmt.dim(`\nTranscript saved → ${outputPath}`));
}
