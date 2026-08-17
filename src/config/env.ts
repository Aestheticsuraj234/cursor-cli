import chalk from "chalk";
import "dotenv/config";
import { execa } from "execa";

export function requireApiKey(): string {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
        throw new Error(
            "Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key."
        );
    }
    return key;
}

export async function checkEnvironment():Promise<void>{
    const {stdout} = await execa("node", ["-v"]);
    const nodeVersion = stdout.trim();

    if(nodeVersion < "18.0.0"){
        throw new Error("Node.js version 18 or higher is required.");
    }

    requireApiKey();
    console.log(chalk.green("✓ Node.js is >= 18"));
    console.log(chalk.green("✓ ANTHROPIC_API_KEY is set"));
}