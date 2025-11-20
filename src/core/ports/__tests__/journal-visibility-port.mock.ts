import { vi } from "vitest";
import type { JournalVisibilityPort } from "../journal-visibility-port.interface";
import type { Result } from "@/types/result";
import type { JournalEntry, JournalVisibilityError } from "@/core/domain/journal-entry";
import { ok } from "@/utils/functional/result";

/**
 * Creates a mock JournalVisibilityPort for testing.
 *
 * All methods are mocked with default implementations that return success.
 * Override specific methods in tests as needed.
 *
 * @example
 * ```typescript
 * const mockPort = createMockJournalVisibilityPort();
 * vi.mocked(mockPort.getAllEntries).mockReturnValue({
 *   ok: true,
 *   value: [{ id: "1", name: "Entry 1" }]
 * });
 * ```
 */
export function createMockJournalVisibilityPort(): JournalVisibilityPort {
  return {
    getAllEntries: vi
      .fn()
      .mockReturnValue(ok([]) as Result<JournalEntry[], JournalVisibilityError>),
    getEntryFlag: vi
      .fn()
      .mockReturnValue(ok(null) as Result<boolean | null, JournalVisibilityError>),
    removeEntryFromDOM: vi
      .fn()
      .mockReturnValue(ok(undefined) as Result<void, JournalVisibilityError>),
  };
}
