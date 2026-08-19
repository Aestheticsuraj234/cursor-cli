import chalk from "chalk";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { execa } from "execa";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function loadEnvFiles(): void {
    const envPaths = [
        join(packageRoot, ".env"),
        join(homedir(), ".cursor-cli", ".env"),
        join(process.cwd(), ".env"),
    ];

    for (const path of envPaths) {
        if (existsSync(path)) {
            dotenv.config({ path });
        }
    }
}

loadEnvFiles();

export function requireApiKey(): string {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
        throw new Error(
            "Missing ANTHROPIC_API_KEY. Set it in your environment, ~/.cursor-cli/.env, or the CLI package .env file."
        );
    }
    return key;
}

export async function checkEnvironment(): Promise<void> {
    const { stdout } = await execa("node", ["-v"]);
    const nodeVersion = stdout.trim();

    if (nodeVersion < "18.0.0") {
        throw new Error("Node.js version 18 or higher is required.");
    }

    requireApiKey();
    console.log(chalk.green("✓ Node.js is >= 18"));
    console.log(chalk.green("✓ ANTHROPIC_API_KEY is set"));
}
