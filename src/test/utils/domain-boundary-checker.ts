/**
 * Domain Boundary Checker
 *
 * Prüft zur Laufzeit, ob Importe die Clean Architecture Domänengrenzen verletzen.
 * Diese Utility kann in Tests verwendet werden, um Architektur-Verletzungen zu erkennen.
 */

import { readFileSync } from "fs";
import { join, dirname, resolve, relative } from "path";
import { glob } from "glob";
import * as ts from "typescript";

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

type RuleId =
  | "LAYER_IMPORT"
  | "A_DOMAIN_LEAK"
  | "B_APP_LEAK"
  | "C_SERVICE_LOCATOR"
  | "D_FOUNDRY_ENTRYPOINT";

function isDomainFile(normalizedFilePath: string): boolean {
  return normalizedFilePath.includes("/domain/");
}

function isApplicationFile(normalizedFilePath: string): boolean {
  return normalizedFilePath.includes("/application/");
}

function isWindowDefinitionFile(normalizedFilePath: string): boolean {
  return normalizedFilePath.includes("/application/windows/definitions/");
}

function isFoundryEntrypointFile(normalizedFilePath: string): boolean {
  return (
    normalizedFilePath.includes("/infrastructure/adapters/foundry/sheets/") ||
    normalizedFilePath.includes("/infrastructure/ui/window-system/") ||
    normalizedFilePath.includes("/infrastructure/windows/adapters/foundry/")
  );
}

function addViolation(
  violations: DomainBoundaryViolation[],
  dedupe: Set<string>,
  file: string,
  importOrNode: string,
  message: string
): void {
  const key = `${file}::${importOrNode}::${message}`;
  if (dedupe.has(key)) return;
  dedupe.add(key);
  violations.push({ file, import: importOrNode, message });
}

function createSourceFile(file: string, content: string): ts.SourceFile {
  const scriptKind = file.endsWith(".js") ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  return ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, scriptKind);
}

function containsImportFromModule(sourceFile: ts.SourceFile, moduleName: string): boolean {
  for (const stmt of sourceFile.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      if (stmt.moduleSpecifier.text === moduleName) return true;
    }
  }
  return false;
}

function checkAandBTypeLeaks(
  violations: DomainBoundaryViolation[],
  dedupe: Set<string>,
  file: string,
  normalizedFilePath: string,
  sourceFile: ts.SourceFile
): void {
  const enforceDomain = isDomainFile(normalizedFilePath);
  const enforceApplication = isApplicationFile(normalizedFilePath);
  if (!enforceDomain && !enforceApplication) return;

  // A/B: import('svelte') type-level imports
  const bannedImportTypes = new Set<string>(["svelte", "react", "vue"]);

  function visit(node: ts.Node): void {
    // A/B: Foundry global namespace
    if (ts.isIdentifier(node) && node.text === "foundry") {
      const rule: RuleId = enforceDomain ? "A_DOMAIN_LEAK" : "B_APP_LEAK";
      addViolation(
        violations,
        dedupe,
        file,
        `${rule}: Identifier(foundry)`,
        enforceDomain
          ? "A: Domain enthält foundry.* Referenzen (verboten)."
          : "B: Application enthält foundry.* Referenzen (verboten)."
      );
    }

    // A/B: DOM type references (only enforce the capitalized DOM types)
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
      const typeName = node.typeName.text;
      if (typeName === "HTMLElement" || typeName === "Event") {
        const rule: RuleId = enforceDomain ? "A_DOMAIN_LEAK" : "B_APP_LEAK";
        addViolation(
          violations,
          dedupe,
          file,
          `${rule}: TypeReference(${typeName})`,
          enforceDomain
            ? `A: Domain referenziert DOM-Typ ${typeName} (verboten).`
            : `B: Application referenziert DOM-Typ ${typeName} (verboten).`
        );
      }
    }

    // A/B: import(\"svelte\") and similar in type positions
    if (ts.isImportTypeNode(node)) {
      const arg = node.argument;
      if (
        ts.isLiteralTypeNode(arg) &&
        ts.isStringLiteral(arg.literal) &&
        bannedImportTypes.has(arg.literal.text)
      ) {
        const mod = arg.literal.text;
        const rule: RuleId = enforceDomain ? "A_DOMAIN_LEAK" : "B_APP_LEAK";

        // In Application we only strictly need to ban svelte per plan, but banning react/vue too is OK.
        addViolation(
          violations,
          dedupe,
          file,
          `${rule}: ImportType(${mod})`,
          enforceDomain
            ? `A: Domain verwendet ImportType aus '${mod}' (verboten).`
            : `B: Application verwendet ImportType aus '${mod}' (verboten).`
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // A/B: explicit module imports
  if (containsImportFromModule(sourceFile, "svelte")) {
    addViolation(
      violations,
      dedupe,
      file,
      "A_B: import from 'svelte'",
      enforceDomain
        ? "A: Domain importiert 'svelte' (verboten)."
        : "B: Application importiert 'svelte' (verboten)."
    );
  }
  if (enforceDomain && containsImportFromModule(sourceFile, "react")) {
    addViolation(
      violations,
      dedupe,
      file,
      "A: import from 'react'",
      "A: Domain importiert 'react' (verboten)."
    );
  }
  if (enforceDomain && containsImportFromModule(sourceFile, "vue")) {
    addViolation(
      violations,
      dedupe,
      file,
      "A: import from 'vue'",
      "A: Domain importiert 'vue' (verboten)."
    );
  }
}

function checkCServiceLocatorInDefinitions(
  violations: DomainBoundaryViolation[],
  dedupe: Set<string>,
  file: string,
  normalizedFilePath: string,
  sourceFile: ts.SourceFile
): void {
  if (!isWindowDefinitionFile(normalizedFilePath)) return;

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        const methodName = expr.name.text;
        if (methodName === "resolveWithError") {
          addViolation(
            violations,
            dedupe,
            file,
            "C_SERVICE_LOCATOR: resolveWithError()",
            "C: Window-Definitions dürfen keine Container-Auflösung via resolveWithError() durchführen."
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function checkDFoundryEntrypoints(
  violations: DomainBoundaryViolation[],
  dedupe: Set<string>,
  file: string,
  normalizedFilePath: string,
  sourceFile: ts.SourceFile
): void {
  if (!isFoundryEntrypointFile(normalizedFilePath)) return;

  // D: Foundry entrypoints must not import internal application tokens file.
  for (const stmt of sourceFile.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      const mod = stmt.moduleSpecifier.text;
      if (
        mod === "@/application/tokens/application.tokens" ||
        mod === "@/application/tokens/application.tokens.ts"
      ) {
        addViolation(
          violations,
          dedupe,
          file,
          `D_FOUNDRY_ENTRYPOINT: import(${mod})`,
          "D: Foundry-EntryPoints dürfen keine internen Application Tokens importieren (nur module.api Facade Tokens)."
        );
      }
    }
  }

  // D: Foundry entrypoints must not reference platformContainerPortToken / PlatformContainerPort
  function visit(node: ts.Node): void {
    if (ts.isIdentifier(node)) {
      if (node.text === "platformContainerPortToken") {
        addViolation(
          violations,
          dedupe,
          file,
          "D_FOUNDRY_ENTRYPOINT: platformContainerPortToken",
          "D: Foundry-EntryPoints dürfen PlatformContainerPort nicht verwenden (nur Facade über module.api)."
        );
      }
      if (node.text === "PlatformContainerPort") {
        addViolation(
          violations,
          dedupe,
          file,
          "D_FOUNDRY_ENTRYPOINT: PlatformContainerPort",
          "D: Foundry-EntryPoints dürfen PlatformContainerPort nicht referenzieren (nur Facade über module.api)."
        );
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

/**
 * Löst einen relativen Import zu einem absoluten Pfad (relativ zu src/) auf
 *
 * @param filePath - Pfad zur importierenden Datei (relativ zu src/)
 * @param relativeImport - Relativer Import-Pfad (z.B. '../types/result' oder './helper')
 * @param projectRoot - Projekt-Root-Verzeichnis
 * @returns Absoluter Pfad relativ zu src/ (z.B. 'domain/types/result') oder null wenn außerhalb von src/
 */
function resolveRelativeImport(
  filePath: string,
  relativeImport: string,
  projectRoot: string
): string | null {
  // Normalisiere Pfade (Windows/Unix Kompatibilität)
  const normalizedFilePath = filePath.replace(/\\/g, "/");
  const normalizedImport = relativeImport.replace(/\\/g, "/");

  // Vollständiger Pfad zur importierenden Datei
  const fullFilePath = join(projectRoot, normalizedFilePath);
  const fileDir = dirname(fullFilePath);

  // Löse den relativen Import auf
  const resolvedPath = resolve(fileDir, normalizedImport);

  // Prüfe, ob der aufgelöste Pfad innerhalb von src/ liegt
  const srcDir = join(projectRoot, "src");
  const relativePath = relative(srcDir, resolvedPath);

  // Wenn der Pfad mit ../ beginnt, liegt er außerhalb von src/
  if (relativePath.startsWith("..")) {
    return null;
  }

  // Entferne .ts/.js Extension falls vorhanden und normalisiere
  return relativePath.replace(/\.(ts|js)$/, "").replace(/\\/g, "/");
}

/**
 * Prüft, ob ein Import eine Domänengrenze verletzt
 *
 * @param filePath - Pfad zur Datei, die importiert (relativ zu src/)
 * @param importPath - Import-Pfad (z.B. '@/application/services/...' oder '../types/result')
 * @param projectRoot - Projekt-Root-Verzeichnis (optional, nur für relative Imports benötigt)
 * @returns Prüfungsergebnis
 */
export function checkDomainBoundary(
  filePath: string,
  importPath: string,
  projectRoot?: string
): DomainBoundaryCheckResult {
  let normalizedImportPath = importPath;

  // Relative Imports auflösen
  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    if (!projectRoot) {
      // Kann ohne projectRoot nicht aufgelöst werden, überspringen
      return { valid: true };
    }
    const resolved = resolveRelativeImport(filePath, importPath, projectRoot);
    if (!resolved) {
      // Import liegt außerhalb von src/, nicht prüfbar
      return { valid: true };
    }
    normalizedImportPath = `@/${resolved}`;
  }

  // Nur @/ Imports prüfen (interne Imports)
  if (!normalizedImportPath.startsWith("@/")) {
    return { valid: true };
  }

  // Normalisiere filePath für Windows/Linux Kompatibilität
  const normalizedFilePath = filePath.replace(/\\/g, "/");

  // Domain Layer Regeln
  if (normalizedFilePath.includes("/domain/")) {
    if (
      normalizedImportPath.includes("/application/") ||
      normalizedImportPath.includes("/infrastructure/") ||
      normalizedImportPath.includes("/framework/")
    ) {
      return {
        valid: false,
        violation: `Domain Layer (${normalizedFilePath}) darf nicht von ${importPath} (→ ${normalizedImportPath}) importieren (Clean Architecture Verletzung)`,
      };
    }
  }

  // Application Layer Regeln
  if (normalizedFilePath.includes("/application/")) {
    if (normalizedImportPath.includes("/framework/")) {
      return {
        valid: false,
        violation: `Application Layer (${normalizedFilePath}) darf nicht von Framework Layer (${importPath} → ${normalizedImportPath}) importieren (Clean Architecture Verletzung)`,
      };
    }
    // Infrastructure nur über Port-Interfaces und Tokens erlauben
    if (normalizedImportPath.includes("/infrastructure/")) {
      const isPortInterface =
        normalizedImportPath.includes("/interfaces/") ||
        normalizedImportPath.includes("/ports/") ||
        normalizedImportPath.includes("/tokens/");

      if (!isPortInterface) {
        return {
          valid: false,
          violation: `Application Layer (${normalizedFilePath}) darf nur Port-Interfaces und Tokens von Infrastructure importieren, nicht: ${importPath} (→ ${normalizedImportPath})`,
        };
      }
    }
  }

  // Infrastructure Layer Regeln
  if (normalizedFilePath.includes("/infrastructure/")) {
    if (normalizedImportPath.includes("/framework/")) {
      return {
        valid: false,
        violation: `Infrastructure Layer (${normalizedFilePath}) darf nicht von Framework Layer (${importPath} → ${normalizedImportPath}) importieren (Clean Architecture Verletzung)`,
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
 * @returns Array von Import-Pfaden (sowohl @/ als auch relative Imports)
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];

  // Kommentare entfernen, um Imports in Kommentaren zu ignorieren
  const contentWithoutComments = removeComments(content);

  // Standard ES6 imports: import ... from '...' (@/ und relative)
  // Regex erfasst sowohl @/ als auch relative Imports (./ oder ../)
  const es6ImportRegex = /import\s+.*?\s+from\s+['"]((?:@\/|[./])[^'"]+)['"]/g;
  let match;
  while ((match = es6ImportRegex.exec(contentWithoutComments)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  // Dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]((?:@\/|[./])[^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(contentWithoutComments)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  // require() calls: require('...')
  const requireRegex = /require\s*\(\s*['"]((?:@\/|[./])[^'"]+)['"]\s*\)/g;
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
  const dedupe = new Set<string>();

  // Alle TypeScript/JavaScript Dateien finden (außer Tests, node_modules, dist)
  const files = await glob("src/**/*.{ts,js}", {
    cwd: projectRoot,
    ignore: ["**/node_modules/**", "**/dist/**", "**/__tests__/**", "**/*.test.ts", "**/*.spec.ts"],
  });

  for (const file of files) {
    const filePath = join(projectRoot, file);

    try {
      const content = readFileSync(filePath, "utf-8");
      const normalizedFilePath = file.replace(/\\/g, "/");
      const imports = extractImports(content);

      for (const importPath of imports) {
        const check = checkDomainBoundary(file, importPath, projectRoot);

        if (!check.valid && check.violation) {
          violations.push({
            file,
            import: importPath,
            message: check.violation,
          });
        }
      }

      // Additional architecture gates (A+B+C+D) using TypeScript AST.
      const sf = createSourceFile(file, content);
      checkAandBTypeLeaks(violations, dedupe, file, normalizedFilePath, sf);
      checkCServiceLocatorInDefinitions(violations, dedupe, file, normalizedFilePath, sf);
      checkDFoundryEntrypoints(violations, dedupe, file, normalizedFilePath, sf);
    } catch (error) {
      // Datei konnte nicht gelesen werden (z.B. Berechtigungen)
      console.warn(`Warning: Could not read file ${filePath}: ${error}`);
    }
  }

  return { violations };
}
