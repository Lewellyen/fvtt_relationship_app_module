#!/usr/bin/env node
/**
 * ESLint Wrapper mit Progress-Anzeige
 * Zeigt Fortschritt während ESLint läuft, auch wenn keine Fehler gefunden werden
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const args = process.argv.slice(2);
const eslintArgs = [
  '--config', 'eslint.config.mjs',
  '--no-ignore',
  'src/**/*.{ts,js,svelte}',
  '--fix',
  '--cache',
  '--cache-location', '.eslintcache',
  '--max-warnings', '0',
  '--concurrency', '4',
  '--format', 'compact',
  ...args
];

console.log('🔍 Starte ESLint (dies kann einige Minuten dauern bei 482 Dateien)...\n');

const startTime = Date.now();
let hasOutput = false;

const eslint = spawn('npx', ['eslint', ...eslintArgs], {
  cwd: projectRoot,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  // Deaktiviere Pufferung für sofortige Ausgabe
  env: { ...process.env, NODE_NO_WARNINGS: '1' }
});

// Heartbeat alle 10 Sekunden (in stderr, damit es nicht von ESLint stdout blockiert wird)
const heartbeat = setInterval(() => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  // Verwende console.error für zuverlässige Ausgabe
  console.error(`⏳ ESLint läuft noch... (${elapsed}s)`);
}, 10000);

eslint.stdout.on('data', (data) => {
  hasOutput = true;
  clearInterval(heartbeat);
  // Schreibe sofort ohne Pufferung
  process.stdout.write(data);
  process.stdout.flush && process.stdout.flush();
});

eslint.stderr.on('data', (data) => {
  hasOutput = true;
  clearInterval(heartbeat);
  // Schreibe sofort ohne Pufferung
  process.stderr.write(data);
  process.stderr.flush && process.stderr.flush();
});

eslint.on('close', (code) => {
  clearInterval(heartbeat);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log('📊 ESLint Zusammenfassung:');
  console.log(`   Dauer: ${duration} Sekunden`);

  if (code === 0) {
    if (!hasOutput) {
      console.log('   ✅ Keine Probleme gefunden!');
    }
    console.log('   ✅ ESLint erfolgreich abgeschlossen!');
  } else {
    console.log(`   ❌ ESLint fehlgeschlagen (Exit-Code: ${code})`);
  }

  console.log('='.repeat(50));

  process.exit(code || 0);
});

eslint.on('error', (error) => {
  clearInterval(heartbeat);
  console.error('❌ Fehler beim Starten von ESLint:', error.message);
  process.exit(1);
});

