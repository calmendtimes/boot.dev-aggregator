import { setUser, readConfig } from './config.js';
import * as commands from './commands.js';

async function main() {
  
  const startCommand = process.argv[2];
  const startParameters = process.argv.slice(3);
  if (startCommand) {
    await commands.runCommand(commands.registry, startCommand, ...startParameters);
  } else {
    console.log("Missing command");
    process.exit(1)
  }
  
  const config = readConfig();
  process.exit(0);
}

await main();


