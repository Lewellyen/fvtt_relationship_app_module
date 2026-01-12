/**
 * JSON parsing and serialization utilities with Result pattern.
 * Provides robust JSON processing with error handling.
 */

import type { Result } from "@/domain/types/result";
import * as v from "valibot";
import { ok, err, tryCatch } from "./result";

/**
 * Error types for JSON parsing operations.
 */
export interface ParseError {
  code: "PARSE_ERROR";
  message: string;
  details?: {
    input?: string;
    position?: number;
    cause?: unknown;
  };
}

export interface ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details?: {
    issues?: unknown;
    cause?: unknown;
  };
}

export interface SerializeError {
  code: "SERIALIZE_ERROR";
  message: string;
  details?: {
    data?: unknown;
    cause?: unknown;
  };
}

/**
 * Union type for all JSON-related errors.
 */
export type JSONError = ParseError | ValidationError | SerializeError;

/**
 * Parses a JSON string into an unknown value.
 * Returns a Result to handle parsing errors gracefully.
 *
 * @param input - JSON string to parse
 * @returns Result containing parsed data or ParseError
 *
 * @example
 * ```typescript
 * const result = parseJSON('{"key": "value"}');
 * if (result.ok) {
 *   console.log(result.value); // { key: "value" }
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function parseJSON(input: string): Result<unknown, ParseError> {
  return tryCatch(
    () => JSON.parse(input),
    (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        code: "PARSE_ERROR",
        message: `Failed to parse JSON: ${errorMessage}`,
        details: {
          input,
          cause: error,
        },
      };
    }
  );
}

/**
 * Validates data against a Valibot schema.
 * Returns a Result with validated data or ValidationError.
 *
 * @template T - Type inferred from schema
 * @param data - Data to validate
 * @param schema - Valibot schema to validate against
 * @returns Result containing validated data or ValidationError
 *
 * @example
 * ```typescript
 * const schema = v.object({ name: v.string() });
 * const result = validateSchema({ name: "Test" }, schema);
 * if (result.ok) {
 *   console.log(result.value.name); // "Test"
 * }
 * ```
 */

export function validateSchema<
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(data: unknown, schema: TSchema): Result<v.InferOutput<TSchema>, ValidationError> {
  const parseResult = v.safeParse(schema, data);
  if (parseResult.success) {
    return ok(parseResult.output);
  }

  return err({
    code: "VALIDATION_ERROR",
    message: "Schema validation failed",
    details: {
      issues: parseResult.issues,
    },
  });
}

/**
 * Parses a JSON string and validates it against a Valibot schema.
 * Combines parseJSON and validateSchema into a single operation.
 *
 * @template T - Type inferred from schema
 * @param input - JSON string to parse and validate
 * @param schema - Valibot schema to validate against
 * @returns Result containing validated data or ParseError | ValidationError
 *
 * @example
 * ```typescript
 * const schema = v.object({ name: v.string() });
 * const result = parseAndValidate('{"name": "Test"}', schema);
 * if (result.ok) {
 *   console.log(result.value.name); // "Test"
 * }
 * ```
 */

export function parseAndValidate<
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(input: string, schema: TSchema): Result<v.InferOutput<TSchema>, ParseError | ValidationError> {
  const parseResult = parseJSON(input);
  if (!parseResult.ok) {
    return parseResult;
  }
  return validateSchema(parseResult.value, schema);
}

/**
 * Serializes data to a JSON string.
 * Returns a Result to handle serialization errors gracefully.
 *
 * @param data - Data to serialize
 * @param space - Optional number of spaces for indentation (for pretty printing)
 * @returns Result containing JSON string or SerializeError
 *
 * @example
 * ```typescript
 * const result = serializeJSON({ key: "value" });
 * if (result.ok) {
 *   console.log(result.value); // '{"key":"value"}'
 * }
 *
 * const pretty = serializeJSON({ key: "value" }, 2);
 * // Returns formatted JSON with 2-space indentation
 * ```
 */
export function serializeJSON(data: unknown, space?: number): Result<string, SerializeError> {
  return tryCatch(
    () => JSON.stringify(data, null, space),
    (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        code: "SERIALIZE_ERROR",
        message: `Failed to serialize to JSON: ${errorMessage}`,
        details: {
          data,
          cause: error,
        },
      };
    }
  );
}
