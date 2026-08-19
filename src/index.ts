#!/usr/bin/env node
import { createCli } from "./cli.js";

createCli().parse(process.argv);