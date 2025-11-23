#!/usr/bin/env node

/**
 * Script zum Erstellen eines GitHub Issues für ein Feature aus docs/features/
 * 
 * Verwendung:
 *   node scripts/create-feature-issue.mjs docs/features/use-case-001-journal-context-menu-hide.md
 * 
 * Voraussetzungen:
 *   - GitHub CLI installiert: https://cli.github.com/
 *   - Authentifiziert: gh auth login
 *   - Repository ist korrekt konfiguriert
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

/**
 * Parst eine Feature-Dokumentation und extrahiert relevante Informationen
 */
function parseFeatureDoc(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  
  // Extrahiere Metadaten
  const statusMatch = content.match(/\*\*Status:\*\* (.+)/);
  const priorityMatch = content.match(/\*\*Priorität:\*\* (.+)/);
  const categoryMatch = content.match(/\*\*Kategorie:\*\* (.+)/);
  const descriptionMatch = content.match(/## Beschreibung\s*\n\n(.+?)(?=\n##)/s);
  const titleMatch = content.match(/^# (.+)/);
  
  return {
    title: titleMatch?.[1] || 'Unbekanntes Feature',
    status: statusMatch?.[1]?.trim() || 'Geplant',
    priority: priorityMatch?.[1]?.trim() || 'Mittel',
    category: categoryMatch?.[1]?.trim() || '',
    description: descriptionMatch?.[1]?.trim() || '',
    filePath: filePath.replace(projectRoot + '\\', '').replace(projectRoot + '/', ''),
  };
}

/**
 * Erstellt den Issue-Body basierend auf der Feature-Dokumentation
 */
function createIssueBody(feature) {
  const relativePath = feature.filePath.replace(/\\/g, '/');
  
  return `## Feature-Beschreibung

${feature.description}

## Technische Dokumentation

Detaillierte technische Planung: [\`${relativePath}\`](../../${relativePath})

## Status

- **Status:** ${feature.status}
- **Priorität:** ${feature.priority}
- **Kategorie:** ${feature.category}

## Nächste Schritte

Siehe Definition of Done in der technischen Dokumentation.

---

_Issue erstellt automatisch aus Feature-Dokumentation_`;
}

/**
 * Prüft, ob GitHub CLI installiert ist
 */
function checkGhInstalled() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Prüft, ob der Benutzer authentifiziert ist
 */
function checkGhAuth() {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Erstellt das GitHub Issue
 */
function createIssue(title, body, labels = ['enhancement']) {
  const labelsArg = labels.map(l => `--label "${l}"`).join(' ');
  const command = `gh issue create --title "${title}" --body "${body}" ${labelsArg}`;
  
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      cwd: projectRoot,
      stdio: 'pipe'
    });
    return output.trim();
  } catch (error) {
    throw new Error(`Fehler beim Erstellen des Issues: ${error.message}`);
  }
}

/**
 * Hauptfunktion
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Fehler: Keine Datei angegeben');
    console.error('Verwendung: node scripts/create-feature-issue.mjs <feature-doc.md>');
    process.exit(1);
  }
  
  const filePath = resolve(projectRoot, args[0]);
  
  // Prüfe, ob Datei existiert
  try {
    readFileSync(filePath, 'utf-8');
  } catch {
    console.error(`Fehler: Datei nicht gefunden: ${filePath}`);
    process.exit(1);
  }
  
  // Prüfe GitHub CLI
  if (!checkGhInstalled()) {
    console.error('Fehler: GitHub CLI ist nicht installiert');
    console.error('Installation: https://cli.github.com/');
    process.exit(1);
  }
  
  if (!checkGhAuth()) {
    console.error('Fehler: GitHub CLI ist nicht authentifiziert');
    console.error('Bitte ausführen: gh auth login');
    process.exit(1);
  }
  
  // Parse Feature-Dokumentation
  console.log(`Lese Feature-Dokumentation: ${filePath}`);
  const feature = parseFeatureDoc(filePath);
  
  // Erstelle Issue
  console.log(`Erstelle GitHub Issue: ${feature.title}`);
  const issueBody = createIssueBody(feature);
  
  try {
    const issueUrl = createIssue(feature.title, issueBody, ['enhancement', 'feature']);
    console.log(`✅ Issue erstellt: ${issueUrl}`);
    
    // Extrahiere Issue-Nummer
    const issueNumberMatch = issueUrl.match(/issues\/(\d+)/);
    if (issueNumberMatch) {
      const issueNumber = issueNumberMatch[1];
      console.log(`\n📝 Nächste Schritte:`);
      console.log(`1. Füge die Issue-Nummer zur Feature-Dokumentation hinzu:`);
      console.log(`   **GitHub Issue:** [#${issueNumber}](${issueUrl})`);
      console.log(`\n2. Oder führe aus:`);
      console.log(`   node scripts/update-feature-issue-link.mjs ${args[0]} ${issueNumber}`);
    }
  } catch (error) {
    console.error(`❌ Fehler: ${error.message}`);
    process.exit(1);
  }
}

main();


