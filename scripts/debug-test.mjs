#!/usr/bin/env node

/**
 * Intelligente Test-Debugging-Script
 *
 * Erkennt automatisch, ob es ein Vitest- oder Playwright-Test ist
 * und startet den entsprechenden Debugger.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, relative } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, '..');

// Dateipfad aus Argumenten
const testFile = process.argv[2];

if (!testFile) {
  console.error('❌ Keine Test-Datei angegeben');
  console.log('Verwendung: node scripts/debug-test.mjs <test-file>');
  process.exit(1);
}

// Normalisiere Pfad
const normalizedPath = resolve(workspaceRoot, testFile);

if (!existsSync(normalizedPath)) {
  console.error(`❌ Datei nicht gefunden: ${normalizedPath}`);
  process.exit(1);
}

// Relativer Pfad für npm scripts
const relativePath = relative(workspaceRoot, normalizedPath);

// Prüfe ob es ein E2E-Test ist (in tests/e2e/)
const isE2ETest = relativePath.startsWith('tests/e2e/') || relativePath.includes('tests\\e2e\\');

if (isE2ETest) {
  console.log('🎭 Playwright E2E-Test erkannt');
  console.log(`📁 Datei: ${relativePath}`);
  console.log('🚀 Starte Playwright Debug-Modus...\n');

  // Playwright Debug-Modus
  const playwright = spawn('npm', ['run', 'test:e2e:debug', '--', relativePath], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: true,
  });

  playwright.on('close', (code) => {
    process.exit(code || 0);
  });

  playwright.on('error', (error) => {
    console.error('❌ Fehler beim Starten von Playwright:', error);
    process.exit(1);
  });
} else {
  console.log('⚡ Vitest-Test erkannt');
  console.log(`📁 Datei: ${relativePath}`);
  console.log('🚀 Starte Vitest Debug-Modus...\n');

  // Vitest Debug-Modus
  const vitest = spawn('npm', ['test', '--', '--inspect-brk', '--no-coverage', relativePath], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  vitest.on('close', (code) => {
    process.exit(code || 0);
  });

  vitest.on('error', (error) => {
    console.error('❌ Fehler beim Starten von Vitest:', error);
    process.exit(1);
  });
}

