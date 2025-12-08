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

    it("should ignore relative imports", () => {
      const result = checkDomainBoundary("src/domain/entities/journal-entry.ts", "./types/result");
      expect(result.valid).toBe(true);
    });
  });

  describe("validateAllDomainBoundaries", () => {
    it("should validate all domain boundaries without violations", async () => {
      const { violations } = await validateAllDomainBoundaries();

      if (violations.length > 0) {
        console.error("\n❌ Domain boundary violations found:");
        violations.forEach((v) => {
          console.error(`  ${v.file}: ${v.message}`);
          console.error(`    Import: ${v.import}`);
        });
      }

      expect(violations).toHaveLength(0);
    }, 30000); // 30s timeout für große Codebases
  });
});
