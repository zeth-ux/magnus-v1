#!/usr/bin/env node
// PreToolUse hook: stops Claude from reading, editing or committing .env files.
//
// How hooks work: Claude Code sends the tool call as JSON on stdin.
// Exit 0 lets the tool run. Exit 2 blocks it, and the message on stderr
// goes back to Claude so it knows why and can adjust.
//
// Allowed: .env.example / .env.sample / .env.template (placeholder files
// with no real secrets, so they are safe to read and commit).

const path = require("path");

const SAFE_SUFFIXES = new Set(["example", "sample", "template"]);

// Is this file name a real secrets file such as .env, .env.local or .env.production?
function isSecretEnvFile(name) {
  // win32.basename splits on both "\" and "/", so it works for any path style.
  const base = path.win32.basename(String(name)).toLowerCase();
  const m = base.match(/^\.env(?:\.([\w.-]+))?$/);
  if (!m) return false;
  if (!m[1]) return true; // plain ".env"
  return !m[1].split(".").some((part) => SAFE_SUFFIXES.has(part));
}

// Find .env-like tokens inside a shell command, e.g. `cat .env.local`,
// `git add ./web/.env`. `process.env.X` does not match because ".env" must
// start a path segment.
function commandTouchesSecretEnv(cmd) {
  const re = /(?:^|[\s"'`\/\\=<>|;&(])(\.env(?:\.[\w.-]+)?)(?=$|[\s"'`\/\\;|&)<>])/g;
  let m;
  while ((m = re.exec(cmd)) !== null) {
    if (isSecretEnvFile(m[1])) return m[1];
  }
  return null;
}

function block(reason) {
  process.stderr.write(
    `Blocked by .claude/hooks/protect-secrets.js: ${reason}\n` +
      "Secrets are managed by Zarith manually. Use .env.example for placeholder " +
      "variable names, and ask Zarith if a real value needs to change.\n"
  );
  process.exit(2);
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // never break Claude because of a hook parse problem
  }
  const tool = input.tool_name;
  const args = input.tool_input || {};

  if (["Read", "Edit", "Write", "MultiEdit"].includes(tool)) {
    const file = args.file_path || "";
    if (isSecretEnvFile(file)) block(`${tool} on secrets file "${file}".`);
  }

  if (tool === "Bash") {
    const hit = commandTouchesSecretEnv(args.command || "");
    if (hit) block(`shell command references secrets file "${hit}".`);
  }

  process.exit(0);
});
