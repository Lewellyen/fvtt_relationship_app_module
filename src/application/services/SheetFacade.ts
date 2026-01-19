import type { Result } from "@/domain/types/result";
import { err, ok } from "@/domain/utils/result";
import type {
  SheetFacadeContract,
  SheetFacadeError,
} from "@/shared/api-contract/sheet-facade.contract";
import type { INodeDataService } from "@/application/services/NodeDataService";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import {
  nodeDataServiceToken,
  graphDataServiceToken,
} from "@/application/tokens/application.tokens";
import { safeParseRelationshipNodeData } from "@/domain/schemas/node-data.schema";
import { safeParseRelationshipGraphData } from "@/domain/schemas/graph-data.schema";

/**
 * Facade used by Foundry-instantiated entrypoints (e.g. sheets) via module.api.
 *
 * This class prevents those entrypoints from:
 * - importing internal tokens/services directly
 * - resolving arbitrary services (service locator)
 *
 * Instead they call stable facade methods.
 */
export class SheetFacade implements SheetFacadeContract {
  constructor(
    private readonly nodeData: INodeDataService,
    private readonly graphData: IGraphDataService
  ) {}

  async loadNodeData(pageId: string): Promise<Result<unknown, SheetFacadeError>> {
    const result = await this.nodeData.loadNodeData(pageId);
    return mapServiceError(result);
  }

  async saveNodeData(pageId: string, data: unknown): Promise<Result<void, SheetFacadeError>> {
    const parsed = safeParseRelationshipNodeData(data);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Node data validation failed: ${parsed.issues.map((i) => i.message).join(", ")}`,
        details: parsed.issues,
      });
    }

    const result = await this.nodeData.saveNodeData(pageId, parsed.output);
    return mapServiceError(result);
  }

  validateNodeData(data: unknown): Result<void, SheetFacadeError> {
    const parsed = safeParseRelationshipNodeData(data);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Node data validation failed: ${parsed.issues.map((i) => i.message).join(", ")}`,
        details: parsed.issues,
      });
    }
    return ok(undefined);
  }

  async loadGraphData(pageId: string): Promise<Result<unknown, SheetFacadeError>> {
    const result = await this.graphData.loadGraphData(pageId);
    return mapServiceError(result);
  }

  async saveGraphData(pageId: string, data: unknown): Promise<Result<void, SheetFacadeError>> {
    const parsed = safeParseRelationshipGraphData(data);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Graph data validation failed: ${parsed.issues.map((i) => i.message).join(", ")}`,
        details: parsed.issues,
      });
    }

    const result = await this.graphData.saveGraphData(pageId, parsed.output);
    return mapServiceError(result);
  }

  validateGraphData(data: unknown): Result<void, SheetFacadeError> {
    const parsed = safeParseRelationshipGraphData(data);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Graph data validation failed: ${parsed.issues.map((i) => i.message).join(", ")}`,
        details: parsed.issues,
      });
    }
    return ok(undefined);
  }
}

export class DISheetFacade extends SheetFacade {
  static dependencies = [nodeDataServiceToken, graphDataServiceToken] as const;

  constructor(nodeData: INodeDataService, graphData: IGraphDataService) {
    super(nodeData, graphData);
  }
}

function mapServiceError<T>(
  result: Result<T, { code: string; message: string; details?: unknown }>
): Result<T, SheetFacadeError> {
  if (result.ok) {
    return ok(result.value);
  }
  return err({
    code: result.error.code,
    message: result.error.message,
    details: result.error.details,
  });
}
