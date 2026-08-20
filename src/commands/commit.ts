import { writeFile } from "node:fs/promises";
import { execa } from "execa";
import { buildCommitContext, buildCommitPrompt } from "../agent/commit-context.js";
import { runQueryCollect } from "../agent/run-query.js";
import { fmt } from "../ui/format.js";

export type CommitOptions = {
    staged?: boolean;
    unstaged?: boolean;
    hint?: string;
    apply?: boolean;
    output?: string;
    verbose?: boolean;
};

function stripFences(text: string): string {
    return text
        .replace(/^```[\w]*\n?/m, "")
        .replace(/\n?```$/m, "")
        .trim();
}

export async function runCommit(options: CommitOptions = {}): Promise<void> {
    const { hint, apply = false, output, verbose = false } = options;

    const context = await buildCommitContext(options);

    console.log(fmt.commit(`Commit message · ${context.scope} changes`));
    if (hint) {
        console.log(fmt.dim(`Hint: ${hint}`));
    }
    console.log();

    const message = stripFences(
        await runQueryCollect(buildCommitPrompt(context, hint), {
            mode: "ask",
            verbose,
            agentLabel: "Commit",
        })
    );

    console.log(fmt.label("\nSuggested commit message:"));
    console.log(fmt.success(message));

    if (output) {
        await writeFile(output, message + "\n", "utf8");
        console.log(fmt.dim(`\nSaved → ${output}`));
    }

    if (apply) {
        if (context.scope === "unstaged") {
            throw new Error("Cannot --apply with unstaged changes. Stage files first or use --staged.");
        }

        await execa("git", ["commit", "-m", message], { stdio: "inherit" });
        console.log(fmt.commit("\nCommitted."));
    } else {
        console.log(fmt.dim("\nRun with --apply to commit, or copy the message above."));
    }
}
