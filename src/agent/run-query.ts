import { query } from "@anthropic-ai/claude-agent-sdk";

export async function runQuery(prompt: string) {
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
            if (message.type === "result" && message.subtype === "success") {
                console.log(message.result);
            }
        }
    } catch (error) {
        console.error("Query failed:", error);
    }
}