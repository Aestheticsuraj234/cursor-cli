import { Command } from 'commander';
import { printBanner } from './ui/banner.js';

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

    program.command("banner")
    .description("print the banner")
    .action(() => {
        printBanner();
    })

    return program;
}