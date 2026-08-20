import type { ReviewContext } from "./review-context.js";
import { AGENT_ROLES } from "./roles.js";

export function buildFixPrompt(context: ReviewContext, issue?: string): string {
    const issueLine = issue ? `\nSpecific fix request: ${issue}` : "";

    const targetHint =
        context.scope === "staged" || context.scope === "unstaged"
            ? "The diff below shows what changed. Fix bugs and issues in the affected files."
            : "Fix bugs and issues in the following files.";

    return [
        AGENT_ROLES.coder.promptPrefix.trim(),
        targetHint,
        "Apply minimal, focused fixes directly in the codebase.",
        "Do not refactor unrelated code. After fixing, summarize what you changed.",
        issueLine,
        "",
        `# Fix target: ${context.summary}`,
        "",
        context.content,
    ].join("\n");
}
