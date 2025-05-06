#!/usr/bin/env node

const { generateTypes, validateEnv } = require("../dist/index.js");
const yargs = require("yargs");

// Parse command-line arguments
const argv = yargs
  .option("env-file", {
    alias: "e",
    type: "string",
    description: "Path to the .env file",
    default: "./.env", // Default path
  })
  .option("dts-file", {
    alias: "d",
    type: "string",
    description: "Path to the env.d.ts file",
    default: "./env.d.ts", // Default path
  })
  .command(
    "generate",
    "Generate TypeScript types from .env file",
    () => {},
    (argv) => {
      generateTypes({ envFilePath: argv.envFile, dtsFilePath: argv.dtsFile });
    }
  )
  .command(
    "validate",
    "Validate environment variables against env.d.ts file",
    () => {},
    (argv) => {
      validateEnv({ envFilePath: argv.envFile, dtsFilePath: argv.dtsFile });
    }
  )
  .help()
  .alias("help", "h").argv;

// If no command is provided, show help
if (!argv._[0]) {
  yargs.showHelp();
}
