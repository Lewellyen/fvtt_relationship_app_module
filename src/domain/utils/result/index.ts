/**
 * Utility functions for working with the Result pattern.
 * Provides functional error handling with type safety.
 *
 * This module re-exports all Result utilities organized by category:
 * - Creation: ok(), err()
 * - Guards: isOk(), isErr()
 * - Transformation: map(), mapError(), andThen()
 * - Unwrapping: unwrapOr(), unwrapOrElse(), getOrThrow()
 * - Combination: all(), match()
 * - Error Handling: tryCatch(), lift()
 * - Async: asyncMap(), asyncAndThen(), fromPromise(), asyncAll()
 *
 * Types are imported from "@/domain/types/result"
 */

// Creation
export { ok, err } from "./creation";

// Guards
export { isOk, isErr } from "./guards";

// Transformation
export { map, mapError, andThen } from "./transformation";

// Unwrapping
export { unwrapOr, unwrapOrElse, getOrThrow } from "./unwrapping";

// Combination
export { all, match } from "./combination";

// Error Handling
export { tryCatch, lift } from "./error-handling";

// Async
export { asyncMap, asyncAndThen, fromPromise, asyncAll } from "./async";
