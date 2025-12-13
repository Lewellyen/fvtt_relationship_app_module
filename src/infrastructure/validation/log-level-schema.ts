import * as v from "valibot";
import { LogLevel } from "@/domain/types/log-level";

/**
 * Schema for LogLevel setting values.
 * Validates that value is one of the defined LogLevel enum values.
 *
 * This schema is used for runtime validation of log level values.
 * It is defined in the infrastructure layer using valibot for validation,
 * following the Dependency Inversion Principle (Domain should not depend on Infrastructure).
 */
export const LOG_LEVEL_SCHEMA = v.picklist([
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
]);
