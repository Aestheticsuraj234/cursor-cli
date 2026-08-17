import { Command } from 'commander';
import { printBanner } from './ui/banner.js';
import { checkEnvironment, requireApiKey } from './config/env.js';
import { runQuery } from './agent/run-query.js';

export function createCli() {
    const program = new Command()
        .name("cursor-cli")
        .description("A CLI for Cursor")
        .version("0.1.0");

    program.command("talk")
        .description("Send a one-shot prompt to the agent")
        .argument("<prompt>", "The prompt to send to the agent")
        .option("-v, --verbose", "Show verbose output")
        .action(async (prompt: string, options: { verbose?: boolean }) => {
            requireApiKey();
            await runQuery(prompt, { verbose: options.verbose });
        })




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