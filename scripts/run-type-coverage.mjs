#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const configPath = resolve(repoRoot, "type-coverage.json");

/**
 * Reads ignore file patterns from the shared JSON config and converts them to CLI args.
 */
function buildIgnoreArgs() {
  if (!existsSync(configPath)) {
    return [];
  }

  const raw = readFileSync(configPath, "utf8");
  const config = JSON.parse(raw);
  const patterns = Array.isArray(config.ignoreFiles) ? config.ignoreFiles : [];
  return patterns.flatMap((pattern) => ["--ignore-files", pattern]);
}

const userArgs = process.argv.slice(2);
const ignoreArgs = buildIgnoreArgs();

const binPath = resolve(repoRoot, "node_modules", "type-coverage", "bin", "type-coverage");
const result = spawnSync(process.execPath, [binPath, ...ignoreArgs, ...userArgs], {
  stdio: "inherit",
});

const code = result.status ?? 1;
process.exit(code);

