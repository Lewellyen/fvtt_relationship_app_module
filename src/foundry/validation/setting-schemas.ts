/**
 * Valibot schemas for runtime validation of Foundry settings and flags.
 *
 * SECURITY: Settings and flags are external input and must be validated!
 */

import * as v from "valibot";
import { LogLevel } from "@/config/environment";

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
