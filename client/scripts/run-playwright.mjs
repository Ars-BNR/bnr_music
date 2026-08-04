import { spawn } from "node:child_process";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const testArguments = ["./node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)];

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });

const waitForServer = async () => {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseURL);
      if (response.status < 500) return;
    } catch {
      // The development server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for Playwright web server at ${baseURL}`);
};

const stopServerTree = (server) => {
  if (server.exitCode !== null || server.pid === undefined) return;

  if (process.platform !== "win32") {
    server.kill("SIGTERM");
    return;
  }

  const killer = spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
    detached: true,
    stdio: "ignore",
  });
  killer.unref();
};

const runTests = (environment) => run(process.execPath, testArguments, {
  cwd: process.cwd(),
  env: { ...process.env, ...environment, PLAYWRIGHT_HTML_OPEN: "never" },
  stdio: "inherit",
});

let exitCode = 1;

try {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    exitCode = await runTests({ PLAYWRIGHT_BASE_URL: baseURL });
  } else {
    const server = spawn(
      process.execPath,
      ["./node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", port],
      { cwd: process.cwd(), env: process.env, stdio: "inherit" },
    );

    try {
      await waitForServer();
      exitCode = await runTests({ PLAYWRIGHT_BASE_URL: baseURL });
    } finally {
      stopServerTree(server);
    }
  }
} catch (error) {
  console.error(error);
} finally {
  process.exit(exitCode);
}
