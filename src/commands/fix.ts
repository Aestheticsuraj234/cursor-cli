import { buildFixPrompt } from "../agent/fix-context.js";
import { buildReviewContext } from "../agent/review-context.js";
import { runQuery } from "../agent/run-query.js";
import { fmt } from "../ui/format.js";

export type FixOptions = {
    paths?: string[];
    staged?: boolean;
    unstaged?: boolean;
    issue?: string;
    dryRun?: boolean;
    verbose?: boolean;
};

export async function runFix(options: FixOptions = {}): Promise<void> {
    const { issue, dryRun = false, verbose = false } = options;

    if (options.staged && options.unstaged) {
        throw new Error("Use either --staged or --unstaged, not both.");
    }

    const context = await buildReviewContext(options);

    console.log(fmt.fix(`Fix · ${context.summary}`));
    if (issue) {
        console.log(fmt.dim(`Issue: ${issue}`));
    }
    if (dryRun) {
        console.log(fmt.dim("Dry run — plan only, no file edits"));
    }
    console.log();

    await runQuery(buildFixPrompt(context, issue), {
        mode: dryRun ? "plan" : "agent",
        verbose,
        agentLabel: "Fixer",
    });
}
