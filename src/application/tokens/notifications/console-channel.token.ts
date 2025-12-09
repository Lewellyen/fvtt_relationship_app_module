/**
 * Injection token for ConsoleChannel.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/application/utils/token-factory";
import type { PlatformConsoleChannelPort } from "@/domain/ports/notifications/platform-console-channel-port.interface";

/**
 * Injection token for ConsoleChannel.
 */
export const consoleChannelToken =
  createInjectionToken<PlatformConsoleChannelPort>("ConsoleChannel");
