/**
 * Service Cast Utilities for Application Layer
 *
 * Provides type-safe casts for service resolution in the Application layer.
 * This file is in the Application layer to avoid Infrastructure dependencies.
 *
 * These casts are runtime-safe when used with DI container resolution,
 * as the container guarantees type safety through token registration.
 */

import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";

/**
 * Casts a resolved service value to the expected type.
 *
 * This is a type assertion that is safe when used with DI container resolution,
 * as the container ensures the token matches the registered type.
 *
 * @template T - The expected service type
 * @param value - The resolved service value from the container
 * @returns The value cast to type T
 */
export function castResolvedService<T>(value: unknown): T {
  // type-coverage:ignore-next-line - DI container resolution guarantees type safety
  return value as T;
}

/**
 * Contract-based cast for WindowController stored in ActionContext.metadata.
 *
 * The WindowController contract guarantees presence/type at runtime; we centralize the
 * necessary type assertion here to keep marker usage limited to boundary utilities.
 */
export function castWindowController(value: unknown): IWindowController | undefined {
  // type-coverage:ignore-next-line - WindowController contract guarantees shape for internal call sites
  return value as IWindowController | undefined;
}

/**
 * Contract-based cast for PlatformContainerPort stored in ActionContext.metadata.
 */
export function castPlatformContainerPort(value: unknown): PlatformContainerPort | undefined {
  // type-coverage:ignore-next-line - Container contract guarantees shape for internal call sites
  return value as PlatformContainerPort | undefined;
}

/**
 * Cast helper for event handler storage in Sets that operate on `unknown` payloads.
 *
 * This is a narrow boundary utility: runtime-safe when used with the window/event-bus
 * patterns that guarantee payload shapes before invoking the handler.
 */
export function castEventHandlerForSet<TPayload>(
  handler: (payload: TPayload) => void
): (payload: unknown) => void {
  type HandlerType = (payload: unknown) => void;
  // type-coverage:ignore-next-line - type variance cast for Set storage
  return handler as HandlerType;
}

/**
 * Cast helper for Svelte components stored as unknown in descriptors.
 *
 * Runtime check ensures `function`, cast provides compile-time typing.
 */
export function castSvelteComponent<
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(component: unknown): import("svelte").Component<TProps> | null {
  if (typeof component !== "function") {
    return null;
  }
  type SvelteComponent = import("svelte").Component<TProps>;
  // type-coverage:ignore-next-line - runtime check ensures function, cast provides component typing
  return component as SvelteComponent;
}
