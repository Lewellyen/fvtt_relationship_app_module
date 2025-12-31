/**
 * Utility functions for working with the Result pattern.
 * Provides functional error handling with type safety.
 *
 * This module re-exports all Result utilities from the organized sub-modules.
 * For better organization, see the individual files in the result/ directory.
 *
 * This module contains only runtime functions - types are imported from "@/domain/types/result"
 */

// Re-export everything from the organized structure
export * from "./result/index";
