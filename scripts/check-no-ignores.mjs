#!/usr/bin/env node
/**
 * Check for forbidden ignore directives in production code.
 *
 * Prüft ALLE Dateien in src/** (außer Tests und Polyfills) auf Ignore-Marker.
 * Nur Dateien in der Whitelist dürfen Ignore-Marker haben.
 *
 * Whitelist-System:
 * - Alle Dateien in src/** werden geprüft
 * - Test-Dateien (__tests__/, *.test.ts, *.spec.ts) werden automatisch ausgenommen
 * - Polyfills (src/polyfills/**) werden automatisch ausgenommen
 * - Nur dokumentierte Dateien in ALLOWED_WITH_MARKERS dürfen Marker haben
 *
 * Sucht nach:
 * - v8 ignore
 * - type-coverage:ignore
 * - eslint-disable
 * - ts-ignore
 *
 * Exits with error code 1 if any forbidden ignores are found.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

/**
 * Whitelist: Dateien, die Ignore-Marker haben dürfen (mit Begründung)
 *
 * Jede Datei muss dokumentiert sein mit:
 * - Welche Marker-Typen erlaubt sind
 * - Begründung warum Marker notwendig sind
 */
const ALLOWED_WITH_MARKERS = [
  // Bootstrap & Environment
  {
    file: 'src/framework/core/init-solid.ts',
    allowed: ['v8 ignore'],
    reason: 'Foundry-spezifische Runtime-Umgebung: Hooks und Bootstrap-Fehlerpfade hängen stark von der Foundry-Version ab und sind schwer isoliert testbar',
  },
  {
    file: 'src/framework/core/bootstrap-init-hook.ts',
    allowed: ['v8 ignore'],
    reason: 'Foundry-spezifische Runtime-Umgebung: Hook-Registrierung und Init-Phase-Logik hängen stark von der Foundry-Version ab und sind schwer isoliert testbar. Direkte Hooks.on() Nutzung um Henne-Ei-Problem zu vermeiden.',
  },
  {
    file: 'src/framework/core/bootstrap-ready-hook.ts',
    allowed: ['v8 ignore'],
    reason: 'Foundry-spezifische Runtime-Umgebung: Hook-Registrierung hängt stark von der Foundry-Version ab und ist schwer isoliert testbar. Direkte Hooks.on() Nutzung um Henne-Ei-Problem zu vermeiden.',
  },
  {
    file: 'src/framework/index.ts',
    allowed: ['v8 ignore file'],
    reason: 'Entry Point: Reine Import-Datei ohne ausführbaren Code',
  },
  {
    file: 'src/infrastructure/shared/constants.ts',
    allowed: ['v8 ignore file'],
    reason: 'Konstanten-Definition: Keine ausführbare Logik',
  },
  // DI-Infrastruktur: Coverage-Tool-Limitationen
  {
    file: 'src/infrastructure/di/validation/ContainerValidator.ts',
    allowed: ['v8 ignore'],
    reason: 'Coverage-Tool-Limitation: Early-Return-Pfad wird nicht korrekt gezählt (Coverage-Tool-Limitation)',
  },

  // DI-Infrastruktur: Architektonisch notwendige Typen
  {
    file: 'src/infrastructure/di/types/resolution/serviceclass.ts',
    allowed: ['type-coverage:ignore-next-line'],
    reason: 'Variadische Konstruktoren: any[] ist für Dependency Injection notwendig (variadische Konstruktoren für variable Argumente)',
  },
  {
    file: 'src/infrastructure/di/types/utilities/api-safe-token.ts',
    allowed: ['type-coverage:ignore-next-line', 'ts-ignore'],
    reason: 'Nominal Branding: Return-Type-Assertion für Compile-Time-Brand-Marker (Type-Cast für Brand-Assertion)',
  },
  {
    file: 'src/infrastructure/di/types/utilities/api-casts.ts',
    allowed: ['eslint-disable'],
    reason: 'API Cast Utilities: any ist notwendig für API-Wrapper-Funktionen, um zirkuläre Dependencies zu vermeiden (API-spezifische Type-Casts)',
  },

  // Runtime-Casts (bereits global in type-coverage.json ausgenommen)
  {
    file: 'src/infrastructure/di/types/utilities/runtime-safe-cast.ts',
    allowed: ['type-coverage:ignore'],
    reason: 'Runtime-Casts: Zentralisierte Runtime-Cast-Helpers (bereits global in type-coverage.json ausgenommen)',
  },
  {
    file: 'src/infrastructure/adapters/foundry/runtime-casts.ts',
    allowed: ['type-coverage:ignore'],
    reason: 'Foundry Runtime-Casts: Zentralisierte Foundry-spezifische Runtime-Cast-Helpers (bereits global in type-coverage.json ausgenommen)',
  },
  {
    file: 'src/application/utils/registry-casts.ts',
    allowed: ['type-coverage:ignore', 'eslint-disable'],
    reason: 'Registry-Casts: Zentralisierte Registry-Type-Cast-Helpers für Type-Varianz (bereits global in type-coverage.json ausgenommen, eslint-disable für any-Parameter in castBindingToUnknown notwendig)',
  },
  {
    file: 'src/infrastructure/observability/metrics-definition/metric-casts.ts',
    allowed: ['type-coverage:ignore'],
    reason: 'Metrics-Casts: Zentralisierte Metrics-Type-Cast-Helpers für Type-Varianz (bereits global in type-coverage.json ausgenommen)',
  },
  {
    file: 'src/infrastructure/shared/utils/type-guards.ts',
    allowed: ['type-coverage:ignore-next-line'],
    reason: 'Runtime Type Guards: Type-Cast für Runtime-Validierung von Methoden-Existenz (notwendig für type-safe Runtime-Checks)',
  },
  {
    file: 'src/framework/core/api/wrappers/strategies/api-wrapper-strategy-registry.ts',
    allowed: ['type-coverage:ignore-next-line'],
    reason: 'Generic Type Narrowing: strategy.supports() garantiert Kompatibilität mit TServiceType zur Laufzeit, aber TypeScript kann den generischen Typ nicht aus Runtime-Checks ableiten',
  },
  {
    file: 'src/infrastructure/adapters/foundry/versioning/portselector.ts',
    allowed: ['type-coverage:ignore-next-line'],
    reason: 'Generic Type Narrowing: selectedToken kommt aus tokens Map<number, InjectionToken<T>>, aber Strategy ist als PortMatchStrategy<unknown> typisiert für Flexibilität. TypeScript kann den generischen Typ nicht ableiten, obwohl der Token zur Laufzeit vom Typ InjectionToken<T> ist.',
  },
  {
    file: 'src/infrastructure/adapters/foundry/ports/v13/FoundryV13UIPort.ts',
    allowed: ['type-coverage:ignore-next-line'],
    reason: 'Foundry API Type Casts: Foundry\'s ui.sidebar types are incomplete, need type assertion for proper type safety (Foundry-spezifische Runtime-Type-Assertions)',
  },
  {
    file: 'src/infrastructure/adapters/foundry/ports/v13/FoundryV13GamePort.ts',
    allowed: ['type-coverage:ignore-next-line'],
    reason: 'Foundry API Null Handling: null needed when API unavailable, but IFoundryGameAPI["journal"] is non-nullable (Foundry-spezifische Runtime-Null-Handling)',
  },

  // Domain Port Interfaces: Leere Interface-Erweiterungen
  {
    file: 'src/domain/ports/collections/platform-journal-collection-port.interface.ts',
    allowed: ['eslint-disable-next-line'],
    reason: 'Type-Placeholder: Leere Interface-Erweiterung für zukünftige journal-spezifische Methoden (no-empty-object-type ist hier beabsichtigt für Extension-Point)',
  },
  {
    file: 'src/domain/ports/repositories/platform-entity-read-repository.interface.ts',
    allowed: ['eslint-disable-next-line'],
    reason: 'Interface-Segregation: Leere Interface-Erweiterung für Read-Only-Repository (no-empty-object-type ist hier beabsichtigt, da alle Methoden von PlatformEntityCollectionPort geerbt werden)',
  },
  {
    file: 'src/domain/ports/repositories/platform-journal-repository.interface.ts',
    allowed: ['eslint-disable-next-line'],
    reason: 'Type-Placeholder: Leere Interface-Erweiterung für zukünftige journal-spezifische Methoden (no-empty-object-type ist hier beabsichtigt für Extension-Point)',
  },

  // Foundry Adapters: Type-Coverage für Array-Zugriffe
  {
    file: 'src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts',
    allowed: ['type-coverage:ignore-next-line'],
    reason: 'Array-Zugriffe: TypeScript kann nicht statisch beweisen, dass Array mit length > 0 ein Element bei Index 0 hat (obwohl zur Laufzeit garantiert). Non-Null-Assertion ist hier sicher.',
  },
  {
    file: 'src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts',
    allowed: ['type-coverage:ignore-next-line', 'eslint-disable-next-line'],
    reason: 'Array-Zugriffe: TypeScript kann nicht statisch beweisen, dass Array mit length > 0 ein Element bei Index 0 hat. Naming-Convention: Foundry verwendet PascalCase für Klassen-Namen (JournalEntry).',
  },

  // Domain Types: Naming Conventions & Proxy Pattern Type Casts
  {
    file: 'src/domain/types/settings.ts',
    allowed: ['eslint-disable-next-line', 'type-coverage:ignore-next-line'],
    reason: 'Naming-Convention: PascalCase für namespace-ähnliches Objekt (SettingValidators) ist beabsichtigt für konsistente API-Nutzung. Proxy Pattern: Type-Casts für dynamische Property-Zugriffe und Generic Type Narrowing im Proxy-Handler sind notwendig für Type-Safety.',
  },
  {
    file: 'src/domain/utils/setting-validators.ts',
    allowed: ['eslint-disable-next-line', 'type-coverage:ignore-next-line'],
    reason: 'Naming-Convention: PascalCase für namespace-ähnliches Objekt (SettingValidators) ist beabsichtigt für konsistente API-Nutzung. Proxy Pattern: Type-Casts für dynamische Property-Zugriffe und Generic Type Narrowing im Proxy-Handler sind notwendig für Type-Safety.',
  },
  {
    file: 'src/domain/types/container-types.ts',
    allowed: ['eslint-disable-next-line'],
    reason: 'Type-Parameter: TServiceType wird als Type-Parameter für generische Type-Constraints verwendet (DomainInjectionToken<TServiceType>), auch wenn er im Type-Body nicht direkt referenziert wird.',
  },
  {
    file: 'src/framework/core/api/module-api-initializer.ts',
    allowed: ['eslint-disable-next-line'],
    reason: 'Type-Imports: MetricsCollector und ModuleHealthService werden für explizite Type-Annotations verwendet (const metricsCollector: MetricsCollector), auch wenn sie nicht direkt im Code referenziert werden.',
  },

  // DI Token Files: eslint-disable für @typescript-eslint/no-explicit-any
  {
    file: 'src/application/tokens/application.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/application/tokens/domain-ports.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/application/tokens/event.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/infrastructure/shared/tokens/core.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/infrastructure/shared/tokens/event.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/infrastructure/shared/tokens/foundry.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/infrastructure/shared/tokens/i18n.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/infrastructure/shared/tokens/infrastructure.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/infrastructure/shared/tokens/observability.tokens.ts',
    allowed: ['eslint-disable'],
    reason: 'DI Token Definitions: any ist notwendig für InjectionToken-Generics in DI-Container (Service-Type-Tokens mit variadischen Typen)',
  },
  {
    file: 'src/infrastructure/observability/metrics-reporter.ts',
    allowed: ['eslint-disable'],
    reason: 'Console Table Output: Property-Namen müssen mit Leerzeichen sein für console.table() Ausgabe (Naming-Convention für Tabellen-Header)',
  },

];

// Ignore-Marker, nach denen gesucht wird
const IGNORE_PATTERNS = [
  { pattern: /v8\s+ignore/i, name: 'v8 ignore' },
  { pattern: /type-coverage:ignore/i, name: 'type-coverage:ignore' },
  { pattern: /eslint-disable/i, name: 'eslint-disable' },
  { pattern: /ts-ignore/i, name: 'ts-ignore' },
  { pattern: /@ts-ignore/i, name: '@ts-ignore' },
];

/**
 * Check if a file path is a test file.
 */
function isTestFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.includes('/__tests__/') ||
    normalized.includes('/test/') ||
    normalized.endsWith('.test.ts') ||
    normalized.endsWith('.spec.ts')
  );
}

/**
 * Check if a file path is a polyfill.
 */
function isPolyfill(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.includes('/polyfills/');
}

/**
 * Check if a file path is in the whitelist.
 */
function isAllowedWithMarkers(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return ALLOWED_WITH_MARKERS.some(entry => {
    const entryPath = entry.file.replace(/\\/g, '/');
    return normalized === entryPath || normalized.endsWith(entryPath);
  });
}

/**
 * Get allowed marker types for a file.
 */
function getAllowedMarkers(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const entry = ALLOWED_WITH_MARKERS.find(e => {
    const entryPath = e.file.replace(/\\/g, '/');
    return normalized === entryPath || normalized.endsWith(entryPath);
  });
  return entry ? entry.allowed : [];
}

/**
 * Extract the actual marker text from a line of code.
 * Returns the full marker text (e.g., "type-coverage:ignore-line" from "type-coverage:ignore-line -- comment").
 */
function extractMarkerFromLine(line) {
  // Match common marker patterns in comments
  const markerMatch = line.match(/(?:type-coverage:ignore(?:-line|-next-line)?|v8\s+ignore(?:\s+file)?|eslint-disable(?:-next-line|-line)?|@?ts-ignore)/i);
  return markerMatch ? markerMatch[0].trim() : null;
}

/**
 * Check if a marker type is allowed for a file.
 *
 * @param filePath - Path to the file
 * @param markerName - The pattern name that matched (e.g., "type-coverage:ignore")
 * @param actualLine - Optional: The actual line content to extract the real marker from
 */
function isMarkerAllowed(filePath, markerName, actualLine = null) {
  if (!isAllowedWithMarkers(filePath)) {
    return false;
  }
  const allowed = getAllowedMarkers(filePath);

  // If we have the actual line, extract the real marker text
  let actualMarker = markerName;
  if (actualLine) {
    const extracted = extractMarkerFromLine(actualLine);
    if (extracted) {
      actualMarker = extracted;
    }
  }

  // Check if actual marker matches any allowed pattern
  // Both directions: actual marker contains pattern OR pattern contains actual marker
  return allowed.some(pattern => {
    const patternLower = pattern.toLowerCase();
    const markerLower = actualMarker.toLowerCase();
    return markerLower.includes(patternLower) || patternLower.includes(markerLower);
  });
}

/**
 * Find all TypeScript/JavaScript files in src/ excluding tests and polyfills.
 */
function findAllSourceFiles() {
  const files = [];

  function walkDir(dir) {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      // Normalize paths: convert to forward slashes for consistent comparison
      const normalizedRepoRoot = repoRoot.replace(/\\/g, '/');
      const normalizedFullPath = fullPath.replace(/\\/g, '/');
      const relPath = normalizedFullPath.replace(normalizedRepoRoot + '/', '');

      // Skip if not in src/
      if (!relPath.startsWith('src/')) continue;

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
        !isTestFile(relPath) &&
        !isPolyfill(relPath)
      ) {
        files.push(relPath);
      }
    }
  }

  walkDir(resolve(repoRoot, 'src'));
  return files;
}

/**
 * Search for ignore patterns in a file.
 */
function searchIgnoresInFile(filePath) {
  const fullPath = resolve(repoRoot, filePath);

  if (!existsSync(fullPath)) {
    return [];
  }

  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pattern, name } of IGNORE_PATTERNS) {
      if (pattern.test(line)) {
        // Check if this marker is allowed for this file (pass actual line to extract real marker)
        if (!isMarkerAllowed(filePath, name, line)) {
          matches.push({
            file: filePath,
            line: i + 1,
            content: line.trim(),
            pattern: name,
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Main check function.
 */
async function checkNoIgnores() {
  console.log('Checking for forbidden ignore directives in production code...\n');
  console.log('Whitelist-System: Nur dokumentierte Dateien dürfen Marker haben.\n');

  try {
    // Always use both methods for reliability: ripgrep (fast) + fallback (comprehensive)
    // This ensures we catch everything regardless of ripgrep version or availability
    let allMatches = [];
    const rgAvailable = (() => {
      try {
        const version = execSync('rg --version', { encoding: 'utf-8', stdio: 'pipe' });
        const isAvailable = version.includes('ripgrep');
        if (isAvailable) {
          console.log(`Using ripgrep: ${version.trim()}\n`);
        }
        return isAvailable;
      } catch {
        return false;
      }
    })();

    // Method 1: Use ripgrep if available (fast)
    if (rgAvailable) {
      for (const { pattern, name } of IGNORE_PATTERNS) {
        const rgPattern = pattern.source.replace(/\\s/g, '\\s+');

        try {
          // Search in src/ excluding tests and polyfills
          const excludePatterns = [
            '--glob', '!**/__tests__/**',
            '--glob', '!**/test/**',
            '--glob', '!**/*.test.ts',
            '--glob', '!**/*.spec.ts',
            '--glob', '!**/polyfills/**',
          ];

          const result = execSync(
            `rg -n "${rgPattern}" --type ts --type js src/ ${excludePatterns.join(' ')}`,
            { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }
          );

          const lines = result.split('\n').filter(Boolean);
          for (const line of lines) {
            const match = line.match(/^(.+?):(\d+):(.+)$/);
            if (match) {
              const [, filePath, lineNum, content] = match;
              const normalizedPath = filePath.replace(/\\/g, '/');

              // Skip if in whitelist and marker is allowed (pass actual content to extract real marker)
              if (!isMarkerAllowed(normalizedPath, name, content)) {
                allMatches.push({
                  file: normalizedPath,
                  line: parseInt(lineNum, 10),
                  content: content.trim(),
                  pattern: name,
                });
              }
            }
          }
        } catch (e) {
          // No matches or pattern not found - continue
        }
      }
    }

    // Method 2: Always use fallback as verification (comprehensive, OS-independent)
    // This ensures we catch everything even if ripgrep misses something
    const files = findAllSourceFiles();
    if (rgAvailable) {
      console.log(`Verifying with fallback method (${files.length} files)...\n`);
    } else {
      console.log(`Using fallback method (${files.length} files)...\n`);
    }

    const fallbackMatches = [];
    for (const file of files) {
      const matches = searchIgnoresInFile(file);
      fallbackMatches.push(...matches);
    }

    // Merge results: use ripgrep results if available, otherwise fallback
    // If both methods found results, prefer ripgrep but verify with fallback
    if (rgAvailable && allMatches.length > 0) {
      // Verify: check if fallback found anything ripgrep missed
      const rgFiles = new Set(allMatches.map(m => m.file));
      const missedMatches = fallbackMatches.filter(m => !rgFiles.has(m.file));
      if (missedMatches.length > 0) {
        console.warn(`⚠️  Warning: Fallback method found ${missedMatches.length} match(es) that ripgrep missed:\n`);
        missedMatches.forEach(m => {
          console.warn(`  ${m.file}:${m.line} - ${m.pattern}`);
        });
        console.warn('\nAdding missed matches to results...\n');
        allMatches.push(...missedMatches);
      }
    } else {
      // Use fallback results
      allMatches = fallbackMatches;
    }

    // Remove duplicates (same file + line + pattern)
    const seen = new Set();
    allMatches = allMatches.filter(m => {
      const key = `${m.file}:${m.line}:${m.pattern}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    if (allMatches.length > 0) {
      console.error('❌ Forbidden ignore directives found in production code:\n');

      // Group by file
      const byFile = {};
      for (const match of allMatches) {
        if (!byFile[match.file]) {
          byFile[match.file] = [];
        }
        byFile[match.file].push(match);
      }

      for (const [file, matches] of Object.entries(byFile)) {
        console.error(`  ${file}:`);
        for (const match of matches) {
          console.error(`    Line ${match.line}: ${match.pattern}`);
          console.error(`      ${match.content.substring(0, 80)}${match.content.length > 80 ? '...' : ''}`);
        }
        console.error('');
      }

      console.error(`Total: ${allMatches.length} forbidden ignore directive(s) found.`);
      console.error('\nOnly files in the whitelist are allowed to have ignore markers:');
      ALLOWED_WITH_MARKERS.forEach(entry => {
        console.error(`  - ${entry.file}`);
        console.error(`    Allowed: ${entry.allowed.join(', ')}`);
        console.error(`    Reason: ${entry.reason}`);
      });
      console.error('\nThese ignores must be removed, added to the whitelist, or replaced with proper tests/type improvements.');

      process.exit(1);
    } else {
      console.log('✓ No forbidden ignore directives found in production code.');
      console.log(`\nWhitelist: ${ALLOWED_WITH_MARKERS.length} file(s) allowed to have markers:`);
      ALLOWED_WITH_MARKERS.forEach(entry => {
        console.log(`  - ${entry.file} (${entry.allowed.join(', ')})`);
      });
      process.exit(0);
    }
  } catch (error) {
    if (error.status === 1 && error.stdout === '') {
      // ripgrep returns exit code 1 when no matches found - this is OK
      console.log('✓ No forbidden ignore directives found in production code.');
      process.exit(0);
    } else {
      console.error('Error running no-ignores check:', error.message);
      process.exit(1);
    }
  }
}

checkNoIgnores();
