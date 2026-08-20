import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { buildExplainPrompt, type ExplainDepth } from "../agent/explain-context.js";
import { buildReviewContext } from "../agent/review-context.js";
import { runQueryCollect } from "../agent/run-query.js";
import { fmt } from "../ui/format.js";

export type ExplainOptions = {
    paths?: string[];
    staged?: boolean;
    unstaged?: boolean;
    depth?: ExplainDepth;
    question?: string;
    verbose?: boolean;
    output?: string;
};

function defaultOutputPath(scope: string): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return join(process.cwd(), ".cursor-cli", "explanations", `${scope}-${stamp}.md`);
}

async function saveExplanation(path: string, content: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
}

export async function runExplain(options: ExplainOptions = {}): Promise<void> {
    const { depth = "detailed", question, verbose = false, output } = options;

    if (options.staged && options.unstaged) {
        throw new Error("Use either --staged or --unstaged, not both.");
    }

    const context = await buildReviewContext(options);

    console.log(fmt.explain(`Explain · ${context.summary}`));
    console.log(fmt.dim(`Depth: ${depth}`));
    if (question) {
        console.log(fmt.dim(`Question: ${question}`));
    }
    console.log();

    const explanation = await runQueryCollect(
        buildExplainPrompt(context, { depth, question }),
        {
            mode: "ask",
            verbose,
            agentLabel: "Explainer",
        }
    );

    const report = `# Code Explanation\n\n**Target:** ${context.summary}\n**Depth:** ${depth}\n\n${explanation.trim()}`;

    console.log(fmt.label("\nExplanation:"));
    console.log(fmt.success(explanation.trim()));

    const outputPath = output ?? defaultOutputPath(context.scope);
    await saveExplanation(outputPath, report);
    console.log(fmt.dim(`\nSaved → ${outputPath}`));
}
