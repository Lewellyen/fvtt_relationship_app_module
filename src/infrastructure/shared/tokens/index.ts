/**
 * Central token registry.
 *
 * All tokens are now organized in subdirectories (core/, observability/, foundry/, etc.)
 * with one token per file to prevent circular dependencies.
 *
 * **Import Strategy:**
 * **Feingranular (empfohlen):** Import direkt aus Token-Datei
 *    ```typescript
 *    import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
 *    ```
 *
 * **Vorteile der feingranularen Struktur:**
 * - ✅ Keine zirkulären Abhängigkeiten mehr möglich (strukturell verhindert)
 * - ✅ Besseres Tree-Shaking (nur benötigte Tokens werden gebündelt)
 * - ✅ Klarere Dependency-Grenzen
 * - ✅ Keine Barrel-Exports mehr (verhindert zirkuläre Abhängigkeiten strukturell)
 *
 * **Hinweis:**
 * Barrel-Exports wurden entfernt. Alle Token müssen direkt aus ihren individuellen
 * Token-Dateien importiert werden.
 */

// Application layer tokens should be imported directly from:
// - @/application/tokens/application.tokens
// - @/application/tokens/domain-ports.tokens
// - @/application/tokens/event.tokens
// Re-exports removed to maintain Clean Architecture dependency rules.
// Infrastructure layer should not re-export Application layer tokens.

// ⚠️ ServiceType wurde entfernt (war Union von 80+ Service-Klassen)
// Container nutzt jetzt freie Generics statt ServiceType-Constraint.
