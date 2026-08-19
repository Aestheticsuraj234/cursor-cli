import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { buildReviewContext, buildReviewPrompt } from "../agent/review-context.js";
import { runQueryCollect } from "../agent/run-query.js";
import { fmt } from "../ui/format.js";

export type ReviewOptions = {
    paths?: string[];
    staged?: boolean;
    unstaged?: boolean;
    focus?: string;
    security?: boolean;
    verbose?: boolean;
    output?: string;
};

function defaultOutputPath(scope: string): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return join(process.cwd(), ".cursor-cli", "reviews", `${scope}-${stamp}.md`);
}

async function saveReview(path: string, content: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
}

export async function runReview(options: ReviewOptions = {}): Promise<void> {
    const { focus, security = false, verbose = false, output } = options;

    if (options.staged && options.unstaged) {
        throw new Error("Use either --staged or --unstaged, not both.");
    }

    const context = await buildReviewContext(options);

    console.log(fmt.review(`Code review · ${context.summary}`));
    if (focus) {
        console.log(fmt.dim(`Focus: ${focus}`));
    }
    console.log();

    const reviewPrompt = buildReviewPrompt(context, focus);
    const review = await runQueryCollect(reviewPrompt, {
        mode: "ask",
        verbose,
        agentLabel: "Reviewer",
    });

    let finalReport = `# Code Review\n\n**Target:** ${context.summary}\n\n${review.trim()}`;

    if (security) {
        console.log(fmt.review("Security pass…\n"));
        const securityPrompt = [
            "You are a security auditor. Review the same code strictly for security vulnerabilities.",
            "Report: Critical vulnerabilities, data exposure risks, injection vectors, auth flaws.",
            "Be specific about exploit scenarios and fixes.",
            "",
            `# Target: ${context.summary}`,
            "",
            context.content,
        ].join("\n");

        const securityReview = await runQueryCollect(securityPrompt, {
            mode: "ask",
            verbose,
            agentLabel: "Security",
        });

        finalReport += `\n\n---\n\n# Security Review\n\n${securityReview.trim()}`;
    }

    console.log(fmt.label("\nReview complete:"));
    console.log(fmt.success(review.trim()));

    const outputPath = output ?? defaultOutputPath(context.scope);
    await saveReview(outputPath, finalReport);
    console.log(fmt.dim(`\nReport saved → ${outputPath}`));
}
