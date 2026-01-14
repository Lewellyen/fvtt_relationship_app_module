/**
 * Foundry implementation of PlatformPageCreationPort.
 *
 * Creates relationship pages using Foundry's createEmbeddedDocuments API.
 */

import type { Result } from "@/domain/types/result";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import type { PlatformPageCreationPort } from "@/domain/ports/repositories/platform-page-creation-port.interface";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import { ok, err } from "@/domain/utils/result";
import { fromPromise } from "@/domain/utils/result";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import {
  createRelationshipNodePageData,
  createRelationshipGraphPageData,
  castPageDataForCreateEmbeddedDocuments,
} from "@/infrastructure/adapters/foundry/runtime-casts";

/**
 * Foundry implementation of PlatformPageCreationPort.
 *
 * Uses Foundry's JournalEntry.createEmbeddedDocuments() to create pages.
 */
export class FoundryPageCreationAdapter implements PlatformPageCreationPort {
  constructor(private readonly foundryGame: FoundryGame) {}

  /**
   * Creates a new relationship node page in a journal entry.
   */
  async createNodePage(
    journalEntryId: string,
    initialData: RelationshipNodeData
  ): Promise<Result<string, EntityRepositoryError>> {
    // Get the journal entry
    const journalResult = this.foundryGame.getJournalEntryById(journalEntryId);
    if (!journalResult.ok) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal entry ${journalEntryId} not found: ${journalResult.error.message}`,
        details: journalResult.error,
      });
    }

    if (!journalResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal entry ${journalEntryId} not found`,
      });
    }

    const journalEntry = journalResult.value;

    // Prepare page data using runtime-cast helper
    // Use nodeData.name as page name (required by Foundry)
    const pageData = createRelationshipNodePageData(initialData.name, initialData);

    // Create the page using createEmbeddedDocuments
    // createEmbeddedDocuments returns an array of created documents
    const createResult = await fromPromise<
      Array<{ uuid?: string; id?: string; _id?: string }>,
      Error
    >(
      journalEntry.createEmbeddedDocuments(
        "JournalEntryPage",
        castPageDataForCreateEmbeddedDocuments([pageData])
      ),
      (error) => {
        if (error instanceof Error) {
          return error;
        }
        return new Error(String(error));
      }
    );

    if (createResult.ok === false) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to create node page: ${createResult.error.message}`,
        details: createResult.error,
      });
    }

    const createdPages = createResult.value;
    if (!createdPages || createdPages.length === 0) {
      return err({
        code: "OPERATION_FAILED",
        message: "createEmbeddedDocuments returned empty array",
      });
    }

    // Extract page ID from first created page
    // Foundry v13 uses uuid, but we should handle id/_id as fallback
    const createdPage = createdPages[0];
    if (!createdPage) {
      return err({
        code: "OPERATION_FAILED",
        message: "Created pages array is empty",
      });
    }
    const pageId = createdPage.uuid ?? createdPage.id ?? createdPage._id;

    if (!pageId) {
      return err({
        code: "OPERATION_FAILED",
        message: "Created page has no ID (uuid, id, or _id)",
        details: { createdPage },
      });
    }

    return ok(pageId);
  }

  /**
   * Creates a new relationship graph page in a journal entry.
   */
  async createGraphPage(
    journalEntryId: string,
    initialData: RelationshipGraphData
  ): Promise<Result<string, EntityRepositoryError>> {
    // Get the journal entry
    const journalResult = this.foundryGame.getJournalEntryById(journalEntryId);
    if (!journalResult.ok) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal entry ${journalEntryId} not found: ${journalResult.error.message}`,
        details: journalResult.error,
      });
    }

    if (!journalResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal entry ${journalEntryId} not found`,
      });
    }

    const journalEntry = journalResult.value;

    // Prepare page data using runtime-cast helper
    // Use graphKey or generate a name (required by Foundry)
    const pageName = initialData.graphKey || "Graph Page";
    const pageData = createRelationshipGraphPageData(pageName, initialData);

    // Create the page using createEmbeddedDocuments
    const createResult = await fromPromise<
      Array<{ uuid?: string; id?: string; _id?: string }>,
      Error
    >(
      journalEntry.createEmbeddedDocuments(
        "JournalEntryPage",
        castPageDataForCreateEmbeddedDocuments([pageData])
      ),
      (error) => {
        if (error instanceof Error) {
          return error;
        }
        return new Error(String(error));
      }
    );

    if (createResult.ok === false) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to create graph page: ${createResult.error.message}`,
        details: createResult.error,
      });
    }

    const createdPages = createResult.value;
    if (!createdPages || createdPages.length === 0) {
      return err({
        code: "OPERATION_FAILED",
        message: "createEmbeddedDocuments returned empty array",
      });
    }

    // Extract page ID from first created page
    const createdPage = createdPages[0];
    if (!createdPage) {
      return err({
        code: "OPERATION_FAILED",
        message: "Created pages array is empty",
      });
    }
    const pageId = createdPage.uuid ?? createdPage.id ?? createdPage._id;

    if (!pageId) {
      return err({
        code: "OPERATION_FAILED",
        message: "Created page has no ID (uuid, id, or _id)",
        details: { createdPage },
      });
    }

    return ok(pageId);
  }
}

/**
 * DI-enabled wrapper for FoundryPageCreationAdapter.
 */
export class DIFoundryPageCreationAdapter extends FoundryPageCreationAdapter {
  static dependencies = [foundryGameToken] as const;

  constructor(foundryGame: FoundryGame) {
    super(foundryGame);
  }
}
