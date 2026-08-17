import chalk from "chalk";
import boxen from "boxen";
import figlet from "figlet";


export function printBanner() {
    const title = figlet.textSync("Cursor", { font: "Standard" });
    const panel = boxen(
        chalk.cyan("Learn the claude agent sdk\n") +
        chalk.dim("a cli for learning the claude agent sdk"),
        { padding: 1, borderColor: "cyan", borderStyle: "round" }
    );

    console.log(title);
    console.log(panel);
}