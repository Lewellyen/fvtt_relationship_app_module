/**
 * Valibot schemas for runtime validation of Foundry settings and flags.
 *
 * SECURITY: Settings and flags are external input and must be validated!
 */

import * as v from "valibot";
import { LogLevel } from "@/framework/config/environment";

/**
 * Schema for LogLevel setting values.
 * Validates that value is one of the defined LogLevel enum values.
 */
export const LOG_LEVEL_SCHEMA = v.picklist([
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
]);

/**
 * Schema for boolean flag values.
 * Used for journal entry flags like "hidden".
 */
export const BOOLEAN_FLAG_SCHEMA = v.boolean();

/**
 * Schema for non-negative numbers (>= 0).
 */
export const NON_NEGATIVE_NUMBER_SCHEMA = v.pipe(v.number(), v.minValue(0));

/**
 * Schema for non-negative integers (>= 0).
 */
export const NON_NEGATIVE_INTEGER_SCHEMA = v.pipe(v.number(), v.integer(), v.minValue(0));

/**
 * Schema for sampling rates between 0 and 1.
 */
export const SAMPLING_RATE_SCHEMA = v.pipe(v.number(), v.minValue(0), v.maxValue(1));

/**
 * Schema for non-empty strings.
 */
export const NON_EMPTY_STRING_SCHEMA = v.pipe(v.string(), v.minLength(1));
