import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { execa } from "execa";

export type ReviewScope = "files" | "staged" | "unstaged";

export type ReviewContext = {
    scope: ReviewScope;
    summary: string;
    content: string;
};

async function readGitDiff(args: string[]): Promise<string> {
    const { stdout } = await execa("git", args, { reject: false });
    return stdout.trim();
}

async function isGitRepo(): Promise<boolean> {
    const { exitCode } = await execa("git", ["rev-parse", "--is-inside-work-tree"], {
        reject: false,
    });
    return exitCode === 0;
}

async function readFileContext(paths: string[]): Promise<string> {
    const sections: string[] = [];

    for (const filePath of paths) {
        const absolute = resolve(process.cwd(), filePath);
        const content = await readFile(absolute, "utf8");
        sections.push(
            [`### ${relative(process.cwd(), absolute)}`, "```", content, "```"].join("\n")
        );
    }

    return sections.join("\n\n");
}

export async function buildReviewContext(options: {
    paths?: string[];
    staged?: boolean;
    unstaged?: boolean;
}): Promise<ReviewContext> {
    const { paths = [], staged = false, unstaged = false } = options;

    if (staged) {
        if (!(await isGitRepo())) {
            throw new Error("Not a git repository. Review staged changes from a git repo.");
        }

        const diff = await readGitDiff(["diff", "--staged"]);
        if (!diff) {
            throw new Error("No staged changes to review.");
        }

        return {
            scope: "staged",
            summary: "staged git changes",
            content: ["```diff", diff, "```"].join("\n"),
        };
    }

    if (unstaged) {
        if (!(await isGitRepo())) {
            throw new Error("Not a git repository. Review unstaged changes from a git repo.");
        }

        const diff = await readGitDiff(["diff"]);
        if (!diff) {
            throw new Error("No unstaged changes to review.");
        }

        return {
            scope: "unstaged",
            summary: "unstaged git changes",
            content: ["```diff", diff, "```"].join("\n"),
        };
    }

    if (paths.length === 0) {
        throw new Error("Provide file paths or use --staged / --unstaged.");
    }

    return {
        scope: "files",
        summary: paths.join(", "),
        content: await readFileContext(paths),
    };
}

export function buildReviewPrompt(context: ReviewContext, focus?: string): string {
    const focusLine = focus ? `\nFocus area: ${focus}` : "";

    return [
        "You are a senior code reviewer. Review the following code critically.",
        "Report findings grouped by severity: Critical, Warning, Suggestion.",
        "For each finding include: location, issue, and recommended fix.",
        "End with a brief overall verdict (approve / approve with changes / needs work).",
        focusLine,
        "",
        `# Review target: ${context.summary}`,
        "",
        context.content,
    ].join("\n");
}
