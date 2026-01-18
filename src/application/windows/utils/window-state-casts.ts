/**
 * Window State Cast Utilities for Application Layer
 *
 * Provides type-safe helper functions for Map operations in the Window Framework.
 * This file consolidates Map.get() patterns to avoid non-null assertions.
 *
 * These helpers are runtime-safe when used with the patterns in binding-engine,
 * event-bus, and state-store, as they handle the "get or create" pattern safely.
 */

import { isRecord } from "@/domain/utils/type-guards";
import {
  castEventHandlerForSet as castEventHandlerForSetFromServiceCasts,
  castSvelteComponent as castSvelteComponentFromServiceCasts,
} from "./service-casts";

/**
 * Gets a value from a Map, or creates it if it doesn't exist.
 *
 * This helper function eliminates the need for non-null assertions after
 * checking if a key exists and creating a default value.
 *
 * @template K - The key type
 * @template V - The value type
 * @param map - The Map to get the value from
 * @param key - The key to look up
 * @param factory - A function that creates a new value if the key doesn't exist
 * @returns The existing value, or the newly created value
 *
 * @example
 * ```typescript
 * // Instead of:
 * if (!this.bindings.has(instanceId)) {
 *   this.bindings.set(instanceId, new Map());
 * }
 * const instanceBindings = this.bindings.get(instanceId)!;
 *
 * // Use:
 * const instanceBindings = getMapValueOrCreate(
 *   this.bindings,
 *   instanceId,
 *   () => new Map()
 * );
 * ```
 */
export function getMapValueOrCreate<K, V>(map: Map<K, V>, key: K, factory: () => V): V {
  let value = map.get(key);
  if (value === undefined) {
    value = factory();
    map.set(key, value);
  }
  return value;
}

/**
 * Gets a nested value from an object using a dot-notation path (e.g., "some.nested.key").
 *
 * This helper function safely navigates nested object structures without type assertions.
 *
 * @param obj - The object to navigate (unknown type)
 * @param path - The dot-notation path to the nested value
 * @returns The nested value, or undefined if the path doesn't exist
 *
 * @example
 * ```typescript
 * const data = { some: { nested: { key: "value" } } };
 * const value = getNestedValue(data, "some.nested.key"); // "value"
 * ```
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!path.includes(".")) {
    if (isRecord(obj)) {
      return obj[path];
    }
    return undefined;
  }

  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (isRecord(current) && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Creates a nested object structure from a dot-notation path and value.
 *
 * This helper function safely creates nested object structures without type assertions.
 *
 * @param path - The dot-notation path (e.g., "some.nested.key")
 * @param value - The value to set at the end of the path
 * @returns A nested object structure with the value at the specified path
 *
 * @example
 * ```typescript
 * const nested = createNestedObject("some.nested.key", "value");
 * // { some: { nested: { key: "value" } } }
 * ```
 */
export function createNestedObject(path: string, value: unknown): Record<string, unknown> {
  if (!path.includes(".")) {
    return { [path]: value };
  }

  const keys = path.split(".");
  const nested: Record<string, unknown> = {};
  let current: Record<string, unknown> = nested;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key) {
      const next: Record<string, unknown> = {};
      current[key] = next;
      current = next;
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }

  return nested;
}

/**
 * Safely casts an event handler to the Set-compatible type for event bus operations.
 *
 * This helper function handles type variance when adding/removing handlers from Sets
 * that store handlers with different generic payload types.
 *
 * @template K - The event key type
 * @template TPayload - The specific payload type for this handler
 * @param handler - The typed event handler
 * @returns The handler cast to the Set-compatible type
 *
 * @example
 * ```typescript
 * const handler = (payload: MyEventPayload) => { ... };
 * eventListeners.add(castEventHandlerForSet(handler));
 * ```
 */
export function castEventHandlerForSet<TPayload>(
  handler: (payload: TPayload) => void
): (payload: unknown) => void {
  return castEventHandlerForSetFromServiceCasts(handler);
}

/**
 * Safely extracts PersistMeta from options object.
 *
 * This helper function validates and extracts PersistMeta from a Record<string, unknown>
 * without type assertions.
 *
 * @param options - The options object that may contain PersistMeta
 * @param key - The key where PersistMeta is stored
 * @returns The PersistMeta if found and valid, undefined otherwise
 */
export function extractPersistMeta(
  options: Record<string, unknown> | undefined,
  key: string
): { originClientId: string; originWindowInstanceId: string; render: boolean } | undefined {
  if (!options || !isRecord(options)) {
    return undefined;
  }

  const metaValue = options[key];
  if (
    isRecord(metaValue) &&
    typeof metaValue.originClientId === "string" &&
    typeof metaValue.originWindowInstanceId === "string" &&
    typeof metaValue.render === "boolean"
  ) {
    return {
      originClientId: metaValue.originClientId,
      originWindowInstanceId: metaValue.originWindowInstanceId,
      render: metaValue.render,
    };
  }

  return undefined;
}

/**
 * Safely casts a component descriptor component to a Svelte Component type.
 *
 * This helper function validates that the component is a function before casting,
 * ensuring type safety for Svelte component mounting.
 *
 * @template TProps - The props type for the Svelte component
 * @param component - The component from the descriptor (unknown type)
 * @returns The component cast to Component<TProps> if valid, null otherwise
 */
export function castSvelteComponent<
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(component: unknown): import("svelte").Component<TProps> | null {
  return castSvelteComponentFromServiceCasts<TProps>(component);
}
