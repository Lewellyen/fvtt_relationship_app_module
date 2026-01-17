import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic port for optional metrics initialization during bootstrap.
 *
 * Example: Some platforms persist metrics and require an explicit initialization step.
 * Non-persistent implementations can return ok without doing anything.
 */
export interface PlatformMetricsInitializationPort {
  initialize(): Result<void, string>;
}
