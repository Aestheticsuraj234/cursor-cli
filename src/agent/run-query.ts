import { query } from "@anthropic-ai/claude-agent-sdk";
import { handleMessage } from "./message-handler.js";
import { stopSpinner } from "../ui/spinner.js";
import { fmt } from "../ui/format.js";
import { buildModeOptions, type CliMode } from "./modes.js";
import { promptBeforeToolUse } from "./permissions.js";

export type RunQueryOptions = {
    mode?: CliMode;
    verbose?: boolean;
}

export async function runQuery(prompt: string, options: RunQueryOptions = {}) {

    const { mode = "agent", verbose = false } = options;
    try {
        for await (const message of query({
            prompt: prompt,
            options: buildModeOptions(mode),
           
        })) {

            handleMessage(message, { verbose });
        }
    } catch (error) {
        stopSpinner();
        console.error(fmt.error(`Query failed: ${error instanceof Error ? error.message : error}`));
    }
}