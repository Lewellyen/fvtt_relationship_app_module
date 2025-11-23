#!/usr/bin/env node

/**
 * Script zum Aktualisieren der GitHub Issue-Nummer in einer Feature-Dokumentation
 * 
 * Verwendung:
 *   node scripts/update-feature-issue-link.mjs docs/features/use-case-001.md 123
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Fehler: Datei und Issue-Nummer erforderlich');
    console.error('Verwendung: node scripts/update-feature-issue-link.mjs <feature-doc.md> <issue-number>');
    process.exit(1);
  }
  
  const filePath = resolve(projectRoot, args[0]);
  const issueNumber = args[1];
  
  // Prüfe, ob Datei existiert
  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    console.error(`Fehler: Datei nicht gefunden: ${filePath}`);
    process.exit(1);
  }
  
  // Extrahiere Repository-URL aus package.json
  let repoUrl = 'https://github.com/Lewellyen/fvtt_relationship_app_module';
  try {
    const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf-8'));
    if (packageJson.repository?.url) {
      repoUrl = packageJson.repository.url.replace(/\.git$/, '');
    }
  } catch {
    // Fallback zu Standard-URL
  }
  
  const issueUrl = `${repoUrl}/issues/${issueNumber}`;
  const issueLink = `**GitHub Issue:** [#${issueNumber}](${issueUrl})`;
  
  // Ersetze oder füge GitHub Issue-Link hinzu
  if (content.includes('**GitHub Issue:**')) {
    // Ersetze existierenden Link
    content = content.replace(
      /\*\*GitHub Issue:\*\* .+/,
      issueLink
    );
  } else {
    // Füge Link nach dem Status-Block hinzu
    const statusMatch = content.match(/(\*\*Status:\*\* .+\n)/);
    if (statusMatch) {
      const insertPos = statusMatch.index + statusMatch[0].length;
      content = content.slice(0, insertPos) + issueLink + '\n' + content.slice(insertPos);
    } else {
      // Fallback: Am Anfang nach dem Titel
      const titleMatch = content.match(/^# .+\n\n/);
      if (titleMatch) {
        const insertPos = titleMatch.index + titleMatch[0].length;
        content = content.slice(0, insertPos) + issueLink + '\n\n' + content.slice(insertPos);
      }
    }
  }
  
  // Schreibe aktualisierte Datei
  writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ GitHub Issue-Link aktualisiert: ${issueLink}`);
}

main();


