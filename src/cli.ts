import { Command } from 'commander';
import { printBanner } from './ui/banner.js';
import { checkEnvironment, requireApiKey } from './config/env.js';
import { runQuery } from './agent/run-query.js';
import { CliMode, parseCliMode } from './agent/modes.js';
import { startChat } from './commands/chat.js';
import { wakeUp } from './commands/wake-up.js';


function parseMode(value: string): CliMode {
    const mode = parseCliMode(value);
    if (!mode) {
        throw new Error(`Invalid mode "${value}". Use agent, ask, or plan.`);
    }
    return mode;
}

export function createCli() {
    const program = new Command()
        .name("cursor-cli")
        .description("A CLI for Cursor")
        .version("0.1.0");




    program.command("run")
        .description("Send a one-shot prompt to the agent")
        .argument("<prompt>", "What to ask Claude")
        .option("-m, --mode <mode>", "agent | ask | plan", "agent")
        .option("-v, --verbose", "Show agent loop message types", false)
        .action(async (prompt: string, opts: { mode: string; verbose: boolean }) => {
            requireApiKey();
            await runQuery(prompt, { mode: parseMode(opts.mode), verbose: opts.verbose });
        })


    program
        .command("talk")
        .description("Alias for run")
        .argument("<prompt>", "What to ask Claude")
        .option("-m, --mode <mode>", "agent | ask | plan", "agent")
        .option("-v, --verbose", "Show agent loop message types", false)
        .action(async (prompt: string, opts: { mode: string; verbose: boolean }) => {
            requireApiKey();
            await runQuery(prompt, { mode: parseMode(opts.mode), verbose: opts.verbose });
        });

    program
        .command("wake-up")
        .description("Banner, preflight, mode picker, then chat")
        .action(async () => {
            await wakeUp();
        });

    program
        .command("chat")
        .description("Interactive streaming chat session")
        .option("-m, --mode <mode>", "agent | ask | plan", "agent")
        .option("-v, --verbose", "Show agent loop message types", false)
        .action(async (opts: { mode: string; verbose: boolean }) => {
            requireApiKey();
            await startChat({ mode: parseMode(opts.mode), verbose: opts.verbose });
        });


    program.command("banner")
        .description("print the banner")
        .action(() => {
            printBanner();
        })

    program.command("doctor")
        .description("check the environment")
        .action(async () => {
            await checkEnvironment();
        })

    program.action(() => {
        program.help();
    });



    return program;
}