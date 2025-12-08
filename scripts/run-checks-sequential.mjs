#!/usr/bin/env node
/**
 * Führt npm-Scripts sequenziell aus
 * Umgeht Probleme mit && Verkettung auf Windows/PowerShell bei langen Befehlszeilen
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Bestimme ob Read-Only Modus (keine schreibenden Befehle)
const isReadOnly = process.argv.includes('--read-only');

// Checks für Read-Only Modus (ohne remove:bom und format, stattdessen format:check)
const readOnlyChecks = [
  'format:check',
  'lint',
  'css-lint',
  'check:encoding',
  'type-check',
  'svelte-check',
  'type-coverage',
  'test:coverage',
  'check:no-ignores',
  'check:domain-boundaries',
  'analyze:circular',
];

// Checks für normalen Modus (mit schreibenden Befehlen)
const writeChecks = [
  'remove:bom',
  'format',
  'lint',
  'css-lint',
  'check:encoding',
  'type-check',
  'svelte-check',
  'type-coverage',
  'test:coverage',
  'check:no-ignores',
  'check:domain-boundaries',
  'analyze:circular',
];

const checks = isReadOnly ? readOnlyChecks : writeChecks;

/**
 * Formatiert Sekunden in h:m:s Format
 * @param {number} seconds - Sekunden als Zahl
 * @returns {string} Formatierte Zeit als "h:m:s" oder "m:s" oder "s"
 */
function formatDuration(seconds) {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  } else {
    return `${secs}s`;
  }
}

function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n[RUNNING] npm run ${scriptName}`);
    console.log('─'.repeat(70));

    const startTime = Date.now();
    const npmProcess = spawn('npm', ['run', scriptName], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    npmProcess.on('close', (code) => {
      const durationSeconds = (Date.now() - startTime) / 1000;
      const durationFormatted = formatDuration(durationSeconds);

      if (code === 0) {
        console.log(`\n✅ ${scriptName} completed in ${durationFormatted}`);
        resolve();
      } else {
        console.error(`\n❌ ${scriptName} failed with exit code ${code} (${durationFormatted})`);
        reject(new Error(`Script ${scriptName} failed with exit code ${code}`));
      }
    });

    npmProcess.on('error', (error) => {
      console.error(`\n❌ Failed to start ${scriptName}:`, error.message);
      reject(error);
    });
  });
}

async function runAllChecks() {
  console.log('='.repeat(70));
  console.log(`🔍 Running Checks Sequentially${isReadOnly ? ' (Read-Only Mode)' : ''}`);
  console.log('='.repeat(70));
  console.log(`Mode: ${isReadOnly ? 'Read-Only (no file modifications)' : 'Full (includes file modifications)'}`);
  console.log(`Total checks: ${checks.length}`);
  console.log('='.repeat(70));

  const startTime = Date.now();
  let successCount = 0;
  let failedChecks = [];

  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    console.log(`\n[${i + 1}/${checks.length}] ${check}`);

    try {
      await runNpmScript(check);
      successCount++;
    } catch (error) {
      failedChecks.push({ check, error: error.message });
      console.error(`\n⚠️  Continuing despite failure in ${check}...`);
      // Entscheide hier, ob bei Fehler gestoppt werden soll
      // Für jetzt: weiterlaufen lassen
    }
  }

  const totalDurationSeconds = (Date.now() - startTime) / 1000;
  const totalDurationFormatted = formatDuration(totalDurationSeconds);

  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));
  console.log(`Total: ${checks.length} checks`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failedChecks.length}`);
  console.log(`⏱️  Total duration: ${totalDurationFormatted}`);

  if (failedChecks.length > 0) {
    console.log('\nFailed checks:');
    failedChecks.forEach(({ check, error }) => {
      console.log(`  - ${check}: ${error}`);
    });
  }

  console.log('='.repeat(70));

  if (failedChecks.length > 0) {
    console.log('❌ Some checks failed');
    process.exit(1);
  } else {
    console.log('✅ All checks passed!');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Process interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Process terminated');
  process.exit(143);
});

runAllChecks().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

