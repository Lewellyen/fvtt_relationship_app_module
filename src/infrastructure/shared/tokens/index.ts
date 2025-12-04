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

// Event tokens
export * from "./event.tokens";

// Port tokens
export * from "./ports.tokens";

// Re-export Application tokens for backward compatibility
// Application layer tokens should be imported from "@/application/tokens" going forward
export * from "@/application/tokens";

// ⚠️ ServiceType wurde nach @/infrastructure/di/types/service-type-registry ausgelagert
// Services sollten ServiceType nicht direkt importieren - nur DI-Container nutzt es.
