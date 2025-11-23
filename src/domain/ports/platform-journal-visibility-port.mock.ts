import { vi } from "vitest";
import type { PlatformJournalVisibilityPort } from "./platform-journal-visibility-port.interface";
import type { Result } from "@/domain/types/result";
import type { JournalEntry, JournalVisibilityError } from "@/domain/entities/journal-entry";
import { ok } from "@/infrastructure/shared/utils/result";

/**
 * Creates a mock PlatformJournalVisibilityPort for testing.
 *
 * All methods are mocked with default implementations that return success.
 * Override specific methods in tests as needed.
 *
 * @example
 * ```typescript
 * const mockPort = createMockPlatformJournalVisibilityPort();
 * vi.mocked(mockPort.getAllEntries).mockReturnValue({
 *   ok: true,
 *   value: [{ id: "1", name: "Entry 1" }]
 * });
 * ```
 */
export function createMockPlatformJournalVisibilityPort(): PlatformJournalVisibilityPort {
  return {
    getAllEntries: vi
      .fn()
      .mockReturnValue(ok([]) as Result<JournalEntry[], JournalVisibilityError>),
    getEntryFlag: vi
      .fn()
      .mockReturnValue(ok(null) as Result<boolean | null, JournalVisibilityError>),
    setEntryFlag: vi.fn().mockResolvedValue(ok(undefined) as Result<void, JournalVisibilityError>),
  };
}
