/**
 * Domain Boundary Checker
 *
 * Prüft zur Laufzeit, ob Importe die Clean Architecture Domänengrenzen verletzen.
 * Diese Utility kann in Tests verwendet werden, um Architektur-Verletzungen zu erkennen.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { glob } from "glob";

/**
 * Ergebnis einer Domänengrenzen-Prüfung
 */
export interface DomainBoundaryCheckResult {
  valid: boolean;
  violation?: string;
}

/**
 * Gefundene Verletzung
 */
export interface DomainBoundaryViolation {
  file: string;
  import: string;
  message: string;
}

/**
 * Prüft, ob ein Import eine Domänengrenze verletzt
 *
 * @param filePath - Pfad zur Datei, die importiert
 * @param importPath - Import-Pfad (z.B. '@/application/services/...')
 * @returns Prüfungsergebnis
 */
export function checkDomainBoundary(
  filePath: string,
  importPath: string
): DomainBoundaryCheckResult {
  // Nur @/ Imports prüfen (interne Imports)
  if (!importPath.startsWith("@/")) {
    return { valid: true };
  }

  // Domain Layer Regeln
  if (filePath.includes("/domain/")) {
    if (
      importPath.includes("/application/") ||
      importPath.includes("/infrastructure/") ||
      importPath.includes("/framework/")
    ) {
      return {
        valid: false,
        violation: `Domain Layer (${filePath}) darf nicht von ${importPath} importieren (Clean Architecture Verletzung)`,
      };
    }
  }

  // Application Layer Regeln
  if (filePath.includes("/application/")) {
    if (importPath.includes("/framework/")) {
      return {
        valid: false,
        violation: `Application Layer (${filePath}) darf nicht von Framework Layer importieren (Clean Architecture Verletzung)`,
      };
    }
    // Infrastructure nur über Port-Interfaces und Tokens erlauben
    if (importPath.includes("/infrastructure/")) {
      const isPortInterface =
        importPath.includes("/interfaces/") ||
        importPath.includes("/ports/") ||
        importPath.includes("/tokens/");

      if (!isPortInterface) {
        return {
          valid: false,
          violation: `Application Layer (${filePath}) darf nur Port-Interfaces und Tokens von Infrastructure importieren, nicht: ${importPath}`,
        };
      }
    }
  }

  // Infrastructure Layer Regeln
  if (filePath.includes("/infrastructure/")) {
    if (importPath.includes("/framework/")) {
      return {
        valid: false,
        violation: `Infrastructure Layer (${filePath}) darf nicht von Framework Layer importieren (Clean Architecture Verletzung)`,
      };
    }
  }

  return { valid: true };
}

/**
 * Entfernt Kommentare aus dem Dateiinhalt
 *
 * @param content - Dateiinhalt
 * @returns Dateiinhalt ohne Kommentare
 */
function removeComments(content: string): string {
  let result = content;

  // Single-line comments: // ...
  result = result.replace(/\/\/.*$/gm, "");

  // Multi-line comments: /* ... */
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // JSDoc-style comments in code blocks innerhalb von /** */ können noch übrig bleiben
  // aber das sollte für unseren Use-Case ausreichen

  return result;
}

/**
 * Extrahiert alle Import-Statements aus einem TypeScript/JavaScript File
 *
 * @param content - Dateiinhalt
 * @returns Array von Import-Pfaden
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];

  // Kommentare entfernen, um Imports in Kommentaren zu ignorieren
  const contentWithoutComments = removeComments(content);

  // Standard ES6 imports: import ... from '...'
  const es6ImportRegex = /import\s+.*?\s+from\s+['"](@\/[^'"]+)['"]/g;
  let match;
  while ((match = es6ImportRegex.exec(contentWithoutComments)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  // Dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"](@\/[^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(contentWithoutComments)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  // require() calls: require('...')
  const requireRegex = /require\s*\(\s*['"](@\/[^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(contentWithoutComments)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  return imports;
}

/**
 * Prüft alle Dateien auf Domänengrenzen-Verletzungen
 *
 * @param projectRoot - Projekt-Root-Verzeichnis (optional, default: process.cwd())
 * @returns Array von gefundenen Verletzungen
 */
export async function validateAllDomainBoundaries(
  projectRoot: string = process.cwd()
): Promise<{ violations: DomainBoundaryViolation[] }> {
  const violations: DomainBoundaryViolation[] = [];

  // Alle TypeScript/JavaScript Dateien finden (außer Tests, node_modules, dist)
  const files = await glob("src/**/*.{ts,js}", {
    cwd: projectRoot,
    ignore: ["**/node_modules/**", "**/dist/**", "**/__tests__/**", "**/*.test.ts", "**/*.spec.ts"],
  });

  for (const file of files) {
    const filePath = join(projectRoot, file);

    try {
      const content = readFileSync(filePath, "utf-8");
      const imports = extractImports(content);

      for (const importPath of imports) {
        const check = checkDomainBoundary(file, importPath);

        if (!check.valid && check.violation) {
          violations.push({
            file,
            import: importPath,
            message: check.violation,
          });
        }
      }
    } catch (error) {
      // Datei konnte nicht gelesen werden (z.B. Berechtigungen)
      console.warn(`Warning: Could not read file ${filePath}: ${error}`);
    }
  }

  return { violations };
}
