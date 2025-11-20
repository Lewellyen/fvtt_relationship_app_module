import type { JournalVisibilityPort } from "@/core/ports/journal-visibility-port.interface";
import type { JournalEntry, JournalVisibilityError } from "@/core/domain/journal-entry";
import type { Result } from "@/types/result";
import type { FoundryJournalFacade } from "@/foundry/facades/foundry-journal-facade.interface";
import { BOOLEAN_FLAG_SCHEMA } from "@/foundry/validation/setting-schemas";
import { MODULE_CONSTANTS } from "@/constants";
import { foundryJournalFacadeToken } from "@/foundry/foundrytokens";

/**
 * Foundry-specific adapter for JournalVisibilityPort.
 *
 * Translates between domain types (JournalEntry) and Foundry types (FoundryJournalEntry).
 * The adapter is version-independent, as it uses FoundryJournalFacade which already
 * handles version selection via PortSelector.
 */
export class FoundryJournalVisibilityAdapter implements JournalVisibilityPort {
  constructor(private readonly foundryJournalFacade: FoundryJournalFacade) {}

  getAllEntries(): Result<JournalEntry[], JournalVisibilityError> {
    const result = this.foundryJournalFacade.getJournalEntries();
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "INVALID_ENTRY_DATA",
          message: result.error.message,
        },
      };
    }

    // Map FoundryJournalEntry → JournalEntry
    const entries: JournalEntry[] = result.value.map((foundryEntry) => ({
      id: foundryEntry.id,
      name: foundryEntry.name ?? null,
    }));

    return { ok: true, value: entries };
  }

  getEntryFlag(
    entry: JournalEntry,
    flagKey: string
  ): Result<boolean | null, JournalVisibilityError> {
    // Find FoundryJournalEntry by ID (we need to fetch all to find the right one)
    const foundryEntriesResult = this.foundryJournalFacade.getJournalEntries();
    if (!foundryEntriesResult.ok) {
      return {
        ok: false,
        error: {
          code: "FLAG_READ_FAILED",
          entryId: entry.id,
          message: foundryEntriesResult.error.message,
        },
      };
    }

    const foundryEntry = foundryEntriesResult.value.find((e) => e.id === entry.id);
    if (!foundryEntry) {
      return {
        ok: false,
        error: {
          code: "ENTRY_NOT_FOUND",
          entryId: entry.id,
          message: `Journal entry with ID ${entry.id} not found`,
        },
      };
    }

    const flagResult = this.foundryJournalFacade.getEntryFlag<boolean>(
      foundryEntry,
      flagKey,
      BOOLEAN_FLAG_SCHEMA
    );

    if (!flagResult.ok) {
      return {
        ok: false,
        error: {
          code: "FLAG_READ_FAILED",
          entryId: entry.id,
          message: flagResult.error.message,
        },
      };
    }

    return { ok: true, value: flagResult.value };
  }

  removeEntryFromDOM(
    entryId: string,
    entryName: string | null,
    htmlElement: HTMLElement
  ): Result<void, JournalVisibilityError> {
    const result = this.foundryJournalFacade.removeJournalElement(
      entryId,
      entryName ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME,
      htmlElement
    );

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "DOM_MANIPULATION_FAILED",
          entryId,
          message: result.error.message,
        },
      };
    }

    return { ok: true, value: undefined };
  }
}

// DI-Wrapper
export class DIFoundryJournalVisibilityAdapter extends FoundryJournalVisibilityAdapter {
  static dependencies = [foundryJournalFacadeToken] as const;

  constructor(foundryJournalFacade: FoundryJournalFacade) {
    super(foundryJournalFacade);
  }
}
