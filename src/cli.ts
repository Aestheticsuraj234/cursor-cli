import { Command } from 'commander';
import { printBanner } from './ui/banner.js';
import { checkEnvironment, requireApiKey } from './config/env.js';
import { runQuery } from './agent/run-query.js';
import { runMultiAgent } from './agent/run-multi.js';
import { runPipeline } from './agent/run-pipeline.js';
import { CliMode, parseCliMode } from './agent/modes.js';
import { parseAgentRoles } from './agent/roles.js';
import { startChat } from './commands/chat.js';
import { startMultiChat } from './commands/multi-chat.js';
import { runReview } from './commands/review.js';
import { wakeUp } from './commands/wake-up.js';
import { AGENT_ROLE_LIST } from './config/constant.js';


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

    program
        .command("multi")
        .description("Run specialist agents in parallel, then synthesize")
        .argument("<task>", "Task for the agent team")
        .option(
            "-r, --roles <roles>",
            `Comma-separated roles: ${AGENT_ROLE_LIST}`,
            "planner,researcher,coder"
        )
        .option("-v, --verbose", "Show agent loop message types", false)
        .option("--no-synthesize", "Print each agent output without coordinator synthesis")
        .action(async (task: string, opts: { roles: string; verbose: boolean; synthesize: boolean }) => {
            requireApiKey();
            await runMultiAgent(task, {
                roles: parseAgentRoles(opts.roles),
                verbose: opts.verbose,
                synthesize: opts.synthesize,
            });
        });

    program
        .command("multi-chat")
        .description("Interactive chat with spawnable specialist agents")
        .option("-v, --verbose", "Show agent loop message types", false)
        .action(async (opts: { verbose: boolean }) => {
            requireApiKey();
            await startMultiChat({ verbose: opts.verbose });
        });

    program
        .command("pipeline")
        .description("Run agents sequentially, passing context between steps")
        .argument("<task>", "Task to run through the pipeline")
        .option(
            "-r, --roles <roles>",
            `Comma-separated pipeline order: ${AGENT_ROLE_LIST}`,
            "planner,researcher,coder,reviewer"
        )
        .option("-o, --output <file>", "Save transcript markdown (default: .cursor-cli/pipelines/)")
        .option("-v, --verbose", "Show agent loop message types", false)
        .action(async (task: string, opts: { roles: string; output?: string; verbose: boolean }) => {
            requireApiKey();
            await runPipeline(task, {
                roles: parseAgentRoles(opts.roles),
                verbose: opts.verbose,
                output: opts.output,
            });
        });


    program
        .command("review [paths...]")
        .description("Review files or git changes with the reviewer agent")
        .option("--staged", "Review staged git changes")
        .option("--unstaged", "Review unstaged git changes")
        .option("-f, --focus <area>", "Focus review on a specific area (e.g. error-handling)")
        .option("--security", "Run an additional security audit pass")
        .option("-o, --output <file>", "Save review markdown (default: .cursor-cli/reviews/)")
        .option("-v, --verbose", "Show agent loop message types", false)
        .action(async (paths: string[], opts: {
            staged?: boolean;
            unstaged?: boolean;
            focus?: string;
            security?: boolean;
            output?: string;
            verbose: boolean;
        }) => {
            requireApiKey();
            await runReview({
                paths,
                staged: opts.staged,
                unstaged: opts.unstaged,
                focus: opts.focus,
                security: opts.security,
                verbose: opts.verbose,
                output: opts.output,
            });
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