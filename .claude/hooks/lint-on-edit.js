#!/usr/bin/env node
// PostToolUse hook: lints a file right after Claude edits it.
//
// - .ts/.tsx/.js/.jsx/.mjs/.cjs -> ESLint (from the nearest node_modules)
// - .py                         -> Ruff (from the nearest .venv)
//
// If the linter isn't installed yet (e.g. before the Next.js app exists), the
// hook does nothing. On lint errors it exits 2, so Claude sees the errors and
// fixes them straight away. It only reports and never auto-fixes, so the file
// doesn't change behind Claude's back.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const isWin = process.platform === "win32";
const JS_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

// Walk up from the edited file towards the project root to find a binary.
function findUp(startDir, relCandidates, stopDir) {
  let dir = startDir;
  while (true) {
    for (const rel of relCandidates) {
      const p = path.join(dir, rel);
      if (fs.existsSync(p)) return { bin: p, cwd: dir };
    }
    const parent = path.dirname(dir);
    if (dir === stopDir || parent === dir) return null;
    dir = parent;
  }
}

function run(bin, args, cwd) {
  // .cmd shims on Windows need a shell, so quote every argument.
  const q = (s) => `"${s}"`;
  return spawnSync([q(bin), ...args.map(q)].join(" "), {
    cwd,
    shell: true,
    encoding: "utf8",
    timeout: 50_000,
  });
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const file = input.tool_input && input.tool_input.file_path;
  if (!file || !fs.existsSync(file)) process.exit(0);

  const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
  const abs = path.resolve(file);
  if (abs.split(path.sep).includes("node_modules")) process.exit(0);
  const ext = path.extname(abs).toLowerCase();
  let found, result, name;

  if (JS_EXT.has(ext)) {
    name = "ESLint";
    found = findUp(path.dirname(abs), [path.join("node_modules", ".bin", isWin ? "eslint.cmd" : "eslint")], root);
    if (!found) process.exit(0); // ESLint not installed yet
    result = run(found.bin, ["--no-warn-ignored", abs], found.cwd);
  } else if (ext === ".py") {
    name = "Ruff";
    found = findUp(
      path.dirname(abs),
      [path.join(".venv", isWin ? "Scripts" : "bin", isWin ? "ruff.exe" : "ruff")],
      root
    );
    if (!found) process.exit(0); // Ruff not installed yet
    result = run(found.bin, ["check", abs], found.cwd);
  } else {
    process.exit(0);
  }

  if (result.error || result.status === null) process.exit(0); // timeout or spawn issue: don't block work
  if (result.status !== 0) {
    const out = `${result.stdout || ""}${result.stderr || ""}`.trim().slice(0, 4000);
    process.stderr.write(`${name} found problems in ${path.relative(root, abs)}. Please fix them:\n${out}\n`);
    process.exit(2);
  }
  process.exit(0);
});
