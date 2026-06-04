import { spawn } from "node:child_process";

const commands = [
  ["npm", ["run", "ingest:worldbank"]],
  ["npm", ["run", "ingest:ember"]],
  ["npm", ["run", "ingest:eia"]],
  ["npm", ["run", "ingest:ppac"]],
  ["npm", ["run", "ingest:who-gho"]],
  ["npm", ["run", "ingest:owid"]],
  ["npm", ["run", "ingest:waqi"]],
  ["npm", ["run", "ingest:open-meteo"]],
  ["npm", ["run", "ingest:un-population"]]
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

for (const [command, args] of commands) {
  await run(command, args);
}
