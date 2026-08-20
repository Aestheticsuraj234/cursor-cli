import type { ReviewContext } from "./review-context.js";

export type ExplainDepth = "beginner" | "detailed";

const DEPTH_INSTRUCTIONS: Record<ExplainDepth, string> = {
    beginner:
        "Explain as if the reader is new to the codebase. Avoid jargon, define terms, use simple analogies.",
    detailed:
        "Explain for an experienced developer. Cover architecture, data flow, edge cases, and design trade-offs.",
};

export function buildExplainPrompt(
    context: ReviewContext,
    options: { depth?: ExplainDepth; question?: string } = {}
): string {
    const { depth = "detailed", question } = options;
    const questionLine = question ? `\nSpecific question: ${question}` : "";

    const targetLabel =
        context.scope === "staged" || context.scope === "unstaged"
            ? "the following git changes"
            : "the following code";

    return [
        "You are a patient technical explainer. Help the reader understand the code clearly.",
        DEPTH_INSTRUCTIONS[depth],
        "Structure your answer with:",
        "1. **Overview** — what this code does in one paragraph",
        "2. **How it works** — key functions, flow, and dependencies",
        "3. **Notable details** — patterns, conventions, or gotchas worth knowing",
        questionLine,
        "",
        `# Explain ${targetLabel}: ${context.summary}`,
        "",
        context.content,
    ].join("\n");
}

export function parseExplainDepth(value: string): ExplainDepth | null {
    if (value === "beginner" || value === "detailed") {
        return value;
    }
    return null;
}
