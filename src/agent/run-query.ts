import { query } from "@anthropic-ai/claude-agent-sdk";
import { handleMessage } from "./message-handler.js";
import { stopSpinner } from "../ui/spinner.js";
import { fmt } from "../ui/format.js";


export type RunQueryOptions = {
   verbose?: boolean;
}

export async function runQuery(prompt: string , options: RunQueryOptions = {}) {

    const { verbose = false } = options;
    try {
        for await (const message of query({
            prompt: prompt,
            options: {
                model: "claude-haiku-4-5",
                maxTurns: 5,
                allowedTools: ["Read", "Glob", "Grep"],
                permissionMode: "acceptEdits"
            }
        })) {
            
            handleMessage(message , { verbose });
        }
    } catch (error) {
        stopSpinner();
        console.error(fmt.error(`Query failed: ${error instanceof Error ? error.message : error}`));
    }
}