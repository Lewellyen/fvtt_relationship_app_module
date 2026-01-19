import { describe, it, expect } from "vitest";
import { checkDomainBoundary, validateAllDomainBoundaries } from "../domain-boundary-checker";

describe("Domain Boundary Checker", () => {
  describe("checkDomainBoundary", () => {
    it("should allow domain to import from domain", () => {
      const result = checkDomainBoundary(
        "src/domain/entities/journal-entry.ts",
        "@/domain/types/result"
      );
      expect(result.valid).toBe(true);
    });

    it("should reject domain importing from application", () => {
      const result = checkDomainBoundary(
        "src/domain/entities/journal-entry.ts",
        "@/application/services/JournalVisibilityService"
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Domain Layer");
      expect(result.violation).toContain("application");
    });

    it("should reject domain importing from infrastructure", () => {
      const result = checkDomainBoundary(
        "src/domain/entities/journal-entry.ts",
        "@/infrastructure/di/container"
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Domain Layer");
      expect(result.violation).toContain("infrastructure");
    });

    it("should reject domain importing from framework", () => {
      const result = checkDomainBoundary(
        "src/domain/entities/journal-entry.ts",
        "@/framework/core/composition-root"
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Domain Layer");
      expect(result.violation).toContain("framework");
    });

    it("should allow application to import from domain", () => {
      const result = checkDomainBoundary(
        "src/application/services/JournalVisibilityService.ts",
        "@/domain/entities/journal-entry"
      );
      expect(result.valid).toBe(true);
    });

    it("should allow application to import port interfaces from infrastructure", () => {
      const result = checkDomainBoundary(
        "src/application/services/JournalVisibilityService.ts",
        "@/infrastructure/adapters/foundry/interfaces/FoundryGame"
      );
      expect(result.valid).toBe(true);
    });

    it("should allow application to import ports from infrastructure", () => {
      const result = checkDomainBoundary(
        "src/application/services/JournalVisibilityService.ts",
        "@/infrastructure/adapters/foundry/ports/v13/FoundryGamePort"
      );
      expect(result.valid).toBe(true);
    });

    it("should allow application to import tokens from infrastructure", () => {
      const result = checkDomainBoundary(
        "src/application/services/JournalVisibilityService.ts",
        "@/infrastructure/shared/tokens/core/logger.token"
      );
      expect(result.valid).toBe(true);
    });

    it("should reject application importing non-port from infrastructure", () => {
      const result = checkDomainBoundary(
        "src/application/services/JournalVisibilityService.ts",
        "@/infrastructure/di/container"
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Application Layer");
      expect(result.violation).toContain("Port-Interfaces");
    });

    it("should reject application importing from framework", () => {
      const result = checkDomainBoundary(
        "src/application/services/JournalVisibilityService.ts",
        "@/framework/core/composition-root"
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Application Layer");
      expect(result.violation).toContain("Framework Layer");
    });

    it("should allow infrastructure to import from domain", () => {
      const result = checkDomainBoundary(
        "src/infrastructure/adapters/foundry/ports/v13/FoundryGamePort.ts",
        "@/domain/types/result"
      );
      expect(result.valid).toBe(true);
    });

    it("should allow infrastructure to import from application", () => {
      // Infrastructure kann von Application importieren (z.B. für Adapter)
      const result = checkDomainBoundary(
        "src/infrastructure/adapters/foundry/services/FoundryGameService.ts",
        "@/application/services/JournalVisibilityService"
      );
      expect(result.valid).toBe(true);
    });

    it("should reject infrastructure importing from framework", () => {
      const result = checkDomainBoundary(
        "src/infrastructure/di/container.ts",
        "@/framework/core/composition-root"
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Infrastructure Layer");
      expect(result.violation).toContain("Framework Layer");
    });

    it("should ignore non-@/ imports", () => {
      const result = checkDomainBoundary("src/domain/entities/journal-entry.ts", "fs");
      expect(result.valid).toBe(true);
    });

    it("should ignore non-src relative imports without projectRoot", () => {
      const result = checkDomainBoundary("src/domain/entities/journal-entry.ts", "./types/result");
      expect(result.valid).toBe(true);
    });

    it("should validate relative imports within same layer", () => {
      const projectRoot = process.cwd();
      const result = checkDomainBoundary(
        "src/domain/entities/journal-entry.ts",
        "../types/result",
        projectRoot
      );
      expect(result.valid).toBe(true);
    });

    it("should reject relative import from domain to application", () => {
      const projectRoot = process.cwd();
      // Simuliere: domain/entities/file.ts importiert von application/services (über mehrere ..)
      // Das ist schwer zu testen mit echten Pfaden, aber wir testen die Logik
      const result = checkDomainBoundary(
        "src/domain/entities/journal-entry.ts",
        "../../application/services/JournalVisibilityService",
        projectRoot
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Domain Layer");
      expect(result.violation).toContain("application");
    });

    it("should reject relative import from application to framework", () => {
      const projectRoot = process.cwd();
      const result = checkDomainBoundary(
        "src/application/services/JournalVisibilityService.ts",
        "../../framework/core/composition-root",
        projectRoot
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Application Layer");
      expect(result.violation).toContain("Framework Layer");
    });

    it("should reject relative import from infrastructure to framework", () => {
      const projectRoot = process.cwd();
      const result = checkDomainBoundary(
        "src/infrastructure/di/container.ts",
        "../../framework/core/composition-root",
        projectRoot
      );
      expect(result.valid).toBe(false);
      expect(result.violation).toContain("Infrastructure Layer");
      expect(result.violation).toContain("Framework Layer");
    });

    it("should allow relative imports within same subdirectory", () => {
      const projectRoot = process.cwd();
      const result = checkDomainBoundary(
        "src/infrastructure/cache/config/CacheConfigManager.ts",
        "./cache-config-manager.interface",
        projectRoot
      );
      expect(result.valid).toBe(true);
    });

    it("should allow relative import from infrastructure to domain", () => {
      const projectRoot = process.cwd();
      const result = checkDomainBoundary(
        "src/infrastructure/adapters/foundry/ports/v13/FoundryGamePort.ts",
        "../../../../domain/types/result",
        projectRoot
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("validateAllDomainBoundaries", () => {
    it("should validate all architecture boundaries without violations", async () => {
      const { violations } = await validateAllDomainBoundaries();

      if (violations.length > 0) {
        // Verwende console.log statt console.error, damit es in CI-Logs besser sichtbar ist
        console.log("\n❌ Architecture boundary violations found:");
        console.log(`Total violations: ${violations.length}\n`);

        violations.forEach((v, index) => {
          console.log(`[${index + 1}/${violations.length}] Violation:`);
          console.log(`  File: ${v.file}`);
          console.log(`  Import: ${v.import}`);
          console.log(`  Message: ${v.message}`);
          console.log("");
        });

        // Zusätzlich als Error ausgeben für bessere Sichtbarkeit in CI
        console.error("\n❌ Architecture boundary violations found:");
        violations.forEach((v) => {
          console.error(`  ${v.file}: ${v.message}`);
          console.error(`    Import: ${v.import}`);
        });
      }

      // Erstelle detaillierte Fehlermeldung für bessere CI-Sichtbarkeit
      if (violations.length > 0) {
        const violationDetails = violations
          .map((v, index) => {
            return `[${index + 1}] ${v.file}\n   Import: ${v.import}\n   Error: ${v.message}`;
          })
          .join("\n\n");

        throw new Error(
          `Found ${violations.length} architecture boundary violation(s):\n\n${violationDetails}`
        );
      }

      expect(violations).toHaveLength(0);
    }, 30000); // 30s timeout für große Codebases
  });
});
