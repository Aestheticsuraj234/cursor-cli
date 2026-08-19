import { query } from "@anthropic-ai/claude-agent-sdk";
import { handleMessage } from "./message-handler.js";
import { stopSpinner } from "../ui/spinner.js";
import { fmt } from "../ui/format.js";
import { buildModeOptions, type CliMode } from "./modes.js";

export type RunQueryOptions = {
    mode?: CliMode;
    verbose?: boolean;
    agentLabel?: string;
};

export async function runQueryCollect(
    prompt: string,
    options: RunQueryOptions = {}
): Promise<string> {
    const { mode = "agent", verbose = false, agentLabel } = options;

    let result = "";
    for await (const message of query({
        prompt,
        options: buildModeOptions(mode),
    })) {
        handleMessage(message, { verbose, agentLabel });
        if (message.type === "result" && message.subtype === "success") {
            result = message.result ?? "";
        }
    }

    return result;
}

export async function runQuery(prompt: string, options: RunQueryOptions = {}) {
    const { mode = "agent", verbose = false, agentLabel } = options;
    try {
        for await (const message of query({
            prompt,
            options: buildModeOptions(mode),
        })) {
            handleMessage(message, { verbose, agentLabel });
        }
    } catch (error) {
        stopSpinner();
        console.error(fmt.error(`Query failed: ${error instanceof Error ? error.message : error}`));
    }
}