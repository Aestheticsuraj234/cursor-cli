import { execa } from "execa";

export type CommitScope = "staged" | "unstaged";

export type CommitContext = {
    scope: CommitScope;
    diff: string;
    status: string;
};

async function isGitRepo(): Promise<boolean> {
    const { exitCode } = await execa("git", ["rev-parse", "--is-inside-work-tree"], {
        reject: false,
    });
    return exitCode === 0;
}

async function readGit(args: string[]): Promise<string> {
    const { stdout } = await execa("git", args, { reject: false });
    return stdout.trim();
}

export async function buildCommitContext(options: {
    staged?: boolean;
    unstaged?: boolean;
}): Promise<CommitContext> {
    const staged = options.staged ?? !options.unstaged;
    const unstaged = options.unstaged ?? false;

    if (staged && unstaged) {
        throw new Error("Use either --staged or --unstaged, not both.");
    }

    if (!(await isGitRepo())) {
        throw new Error("Not a git repository.");
    }

    const diffArgs = staged ? ["diff", "--staged"] : ["diff"];
    const diff = await readGit(diffArgs);

    if (!diff) {
        throw new Error(staged ? "No staged changes to commit." : "No unstaged changes.");
    }

    const status = await readGit(["status", "--short"]);

    return {
        scope: staged ? "staged" : "unstaged",
        diff,
        status,
    };
}

export function buildCommitPrompt(context: CommitContext, hint?: string): string {
    const hintLine = hint ? `\nAuthor hint: ${hint}` : "";

    return [
        "You are a git commit message writer. Analyze the diff and write a commit message.",
        "Use conventional commits when appropriate (feat:, fix:, refactor:, docs:, test:, chore:).",
        "Output ONLY the commit message — no preamble, no markdown fences.",
        "Format: a subject line (max 72 chars), blank line, then an optional body with bullet points for notable changes.",
        hintLine,
        "",
        "# Git status",
        "```",
        context.status,
        "```",
        "",
        "# Diff",
        "```diff",
        context.diff,
        "```",
    ].join("\n");
}
