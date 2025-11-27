import { vi } from "vitest";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { NotificationService } from "@/infrastructure/notifications/notification-center.interface";
import {
  loggerToken,
  journalVisibilityServiceToken,
  notificationCenterToken,
  foundryHooksToken,
} from "@/infrastructure/shared/tokens";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";

/**
 * Mock-Factories für Foundry VTT API-Objekte
 */

export interface MockGameOptions {
  version?: string;
  journal?: {
    contents?: FoundryJournalEntry[];
    get?: (id: string) => FoundryJournalEntry | undefined;
  };
  modules?: Map<string, unknown>;
  user?: {
    id?: string;
    name?: string;
  };
}

/**
 * Erstellt ein Mock game-Objekt für Tests
 */
export function createMockGame(options: MockGameOptions = {}): typeof game {
  const journalEntries = options.journal?.contents || [];
  const journalGet =
    options.journal?.get || ((id: string) => journalEntries.find((e) => e.id === id));

  // Explizit prüfen ob version gesetzt ist (inkl. empty string)
  const version = options.version !== undefined ? options.version : "13.291";

  return {
    version,
    journal: {
      contents: journalEntries,
      get: vi.fn(journalGet),
    },
    modules: options.modules || new Map(),
    user: options.user || {
      id: "test-user",
      name: "Test User",
    },
  } as typeof game;
}

export interface MockJournalEntryOptions {
  id?: string;
  name?: string;
  flags?: Record<string, unknown>;
}

/**
 * Erstellt ein Mock JournalEntry.Stored Objekt
 */
export function createMockJournalEntry(
  overrides: MockJournalEntryOptions = {}
): FoundryJournalEntry {
  const id = overrides.id || `journal-${Math.random().toString(36).substring(7)}`;
  const name = overrides.name || "Test Journal Entry";

  return {
    id,
    name,
    flags: overrides.flags || {},
    getFlag: vi.fn((scope: string, key: string) => {
      const flags = overrides.flags || {};
      return (flags[`${scope}.${key}`] as unknown) || (flags[key] as unknown);
    }),
    setFlag: vi.fn().mockResolvedValue(true),
  } as unknown as FoundryJournalEntry;
}

/**
 * Erstellt ein Mock Hooks-Objekt
 */
export function createMockHooks(): typeof Hooks {
  return {
    on: vi.fn().mockReturnValue(1),
    off: vi.fn(),
    once: vi.fn().mockReturnValue(1),
    call: vi.fn(),
    callAll: vi.fn(),
  } as unknown as typeof Hooks;
}

/**
 * Erstellt ein Mock UI-Objekt
 */
export function createMockUI(): typeof ui {
  return {
    notifications: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as unknown as typeof ui;
}

/**
 * Erstellt ein Mock HTMLElement für DOM-Tests
 */
export function createMockHTMLElement(tagName = "div"): HTMLElement {
  return document.createElement(tagName);
}

/**
 * Mock-Container für ModuleHookRegistrar Tests
 * Verwendet resolve-Spies statt echten Container-Resolution
 */
export function createMockContainer(overrides: Partial<Record<symbol, unknown>> = {}): {
  resolve: ReturnType<typeof vi.fn>;
  resolveWithError: ReturnType<typeof vi.fn>;
  getMockLogger: () => Logger;
  getMockHooks: () => FoundryHooks;
  getMockJournalService: () => JournalVisibilityService;
  getMockNotificationCenter: () => NotificationService;
} {
  const mockLogger: Logger = {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    withTraceId: vi.fn(),
  };

  const mockHooks: FoundryHooks = {
    on: vi.fn().mockReturnValue({ ok: true as const, value: 1 }),
    once: vi.fn().mockReturnValue({ ok: true as const, value: 1 }),
    off: vi.fn().mockReturnValue({ ok: true as const, value: undefined }),
    dispose: vi.fn(),
  };

  const mockJournalService = {
    processJournalDirectory: vi.fn().mockReturnValue({ ok: true as const, value: undefined }),
    getHiddenJournalEntries: vi.fn().mockReturnValue({ ok: true as const, value: [] }),
  } as unknown as JournalVisibilityService;

  const mockNotificationCenter = {
    notify: vi.fn().mockReturnValue({ ok: true as const, value: undefined }),
    debug: vi.fn().mockReturnValue({ ok: true as const, value: undefined }),
    info: vi.fn().mockReturnValue({ ok: true as const, value: undefined }),
    warn: vi.fn().mockReturnValue({ ok: true as const, value: undefined }),
    error: vi.fn().mockReturnValue({ ok: true as const, value: undefined }),
    addChannel: vi.fn(),
    removeChannel: vi.fn(),
    getChannelNames: vi.fn().mockReturnValue(["ConsoleChannel", "UIChannel"]),
  } as unknown as NotificationService;

  const defaults: Record<symbol, unknown> = {
    [loggerToken]: mockLogger,
    [foundryHooksToken]: mockHooks,
    [journalVisibilityServiceToken]: mockJournalService,
    [notificationCenterToken]: mockNotificationCenter,
  };

  const services = { ...defaults, ...overrides };

  return {
    resolve: vi.fn((token: symbol) => {
      if (!services[token]) {
        throw new Error(`Token not mocked: ${String(token)}`);
      }
      return services[token];
    }),
    resolveWithError: vi.fn((token: symbol) => {
      if (!services[token]) {
        return { ok: false as const, error: { code: "NotFound", message: "Token not mocked" } };
      }
      return { ok: true as const, value: services[token] };
    }),
    // Expose mocked services for assertions
    getMockLogger: () => mockLogger,
    getMockHooks: () => mockHooks,
    getMockJournalService: () => mockJournalService,
    getMockNotificationCenter: () => mockNotificationCenter,
  };
}
