/**
 * Central token registry.
 *
 * ⚠️ DEPRECATED: Direct imports from specific token files are preferred for tree-shaking.
 * This file is kept for backward compatibility only.
 *
 * @deprecated Import tokens from specific files instead:
 * @example
 * ```typescript
 * // ❌ OLD (imports everything):
 * import { loggerToken } from "@/infrastructure/shared/tokens";
 *
 * // ✅ NEW (tree-shakeable):
 * import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
 * ```
 */

// Core tokens
export * from "./core.tokens";

// Observability tokens
export * from "./observability.tokens";

// I18n tokens
export * from "./i18n.tokens";

// Notification tokens
export * from "./notifications.tokens";

// Infrastructure tokens
export * from "./infrastructure.tokens";

// Foundry tokens
export * from "./foundry.tokens";

// Event tokens (moved to @/application/tokens/event.tokens)
// Kept for backward compatibility only - use direct imports from @/application/tokens/event.tokens

// Port tokens
export * from "./ports.tokens";

// Validation tokens
export * from "./validation.tokens";

// Application layer tokens should be imported directly from:
// - @/application/tokens/application.tokens
// - @/application/tokens/domain-ports.tokens
// - @/application/tokens/event.tokens
// Re-exports removed to maintain Clean Architecture dependency rules.
// Infrastructure layer should not re-export Application layer tokens.

// ⚠️ ServiceType wurde entfernt (war Union von 80+ Service-Klassen)
// Container nutzt jetzt freie Generics statt ServiceType-Constraint.
