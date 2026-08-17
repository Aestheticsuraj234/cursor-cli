import { Command } from 'commander';

export function createCli() {
    const program = new Command()
        .name("cursor-cli")
        .description("A CLI for Cursor")
        .version("0.1.0");

    program.command("hello")
        .description("print a greeting")
        .action(() => {
            console.log("Hello from the CLI");
        })

    return program;
}