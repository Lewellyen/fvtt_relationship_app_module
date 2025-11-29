/**
 * @deprecated This file is deprecated. Import from "@/domain/utils/result" instead.
 * This file is maintained for backward compatibility during migration.
 *
 * Utility functions for working with the Result pattern.
 * Provides functional error handling with type safety.
 *
 * This module contains only runtime functions - types are imported from "@/domain/types/result"
 */
// Re-export all functions and types from domain/utils/result for backward compatibility
export * from "@/domain/utils/result";
export type { Result, Ok, Err, AsyncResult } from "@/domain/types/result";
