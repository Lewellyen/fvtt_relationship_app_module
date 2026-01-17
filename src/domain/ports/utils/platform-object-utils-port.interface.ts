import type { Result } from "@/domain/types/result";
import type { PlatformUtilsError } from "./platform-utils-error.interface";

/**
 * Platform-agnostic object manipulation utilities.
 */
export interface PlatformObjectUtilsPort {
  deepClone<T>(obj: T): Result<T, PlatformUtilsError>;
  mergeObject<T>(original: T, updates: unknown, options?: unknown): Result<T, PlatformUtilsError>;
  diffObject(
    original: unknown,
    updated: unknown
  ): Result<Record<string, unknown>, PlatformUtilsError>;
  flattenObject(obj: unknown): Result<Record<string, unknown>, PlatformUtilsError>;
  expandObject(obj: Record<string, unknown>): Result<unknown, PlatformUtilsError>;
}
