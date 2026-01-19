/**
 * Service registration for relationship app application services and use cases.
 *
 * Registers:
 * - MigrationService (singleton)
 * - NodeDataService (singleton)
 * - GraphDataService (singleton)
 * - CreateNodePageUseCase (transient)
 * - CreateGraphPageUseCase (transient)
 * - AddNodeToGraphUseCase (transient)
 * - RemoveNodeFromGraphUseCase (transient)
 * - UpsertEdgeUseCase (transient)
 * - RemoveEdgeUseCase (transient)
 */

import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { migrationServiceToken } from "@/application/tokens/application.tokens";
import { nodeDataServiceToken } from "@/application/tokens/application.tokens";
import { graphDataServiceToken } from "@/application/tokens/application.tokens";
import { sheetFacadeToken } from "@/application/tokens/api-facades.tokens";
import { createNodePageUseCaseToken } from "@/application/tokens/application.tokens";
import { createGraphPageUseCaseToken } from "@/application/tokens/application.tokens";
import { addNodeToGraphUseCaseToken } from "@/application/tokens/application.tokens";
import { removeNodeFromGraphUseCaseToken } from "@/application/tokens/application.tokens";
import { upsertEdgeUseCaseToken } from "@/application/tokens/application.tokens";
import { removeEdgeUseCaseToken } from "@/application/tokens/application.tokens";
import { DIMigrationService } from "@/application/services/MigrationService";
import { DINodeDataService } from "@/application/services/NodeDataService";
import { DIGraphDataService } from "@/application/services/GraphDataService";
import { DISheetFacade } from "@/application/services/SheetFacade";
import { DICreateNodePageUseCase } from "@/application/use-cases/create-node-page.use-case";
import { DICreateGraphPageUseCase } from "@/application/use-cases/create-graph-page.use-case";
import { DIAddNodeToGraphUseCase } from "@/application/use-cases/add-node-to-graph.use-case";
import { DIRemoveNodeFromGraphUseCase } from "@/application/use-cases/remove-node-from-graph.use-case";
import { DIUpsertEdgeUseCase } from "@/application/use-cases/upsert-edge.use-case";
import { DIRemoveEdgeUseCase } from "@/application/use-cases/remove-edge.use-case";

/**
 * Registers relationship app application services and use cases.
 *
 * Services registered:
 * - MigrationService (singleton) - Schema migration with backup and rollback
 * - NodeDataService (singleton) - Node data loading, saving, and validation
 * - GraphDataService (singleton) - Graph data loading, saving, and validation
 *
 * Use cases registered (transient - new instance per use):
 * - CreateNodePageUseCase - Create new node pages
 * - CreateGraphPageUseCase - Create new graph pages
 * - AddNodeToGraphUseCase - Add node to graph
 * - RemoveNodeFromGraphUseCase - Remove node from graph
 * - UpsertEdgeUseCase - Upsert edge in graph
 * - RemoveEdgeUseCase - Remove edge from graph
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerRelationshipAppServices(container: ServiceContainer): Result<void, string> {
  // Register MigrationService (singleton - shared state)
  const migrationServiceResult = container.registerClass(
    migrationServiceToken,
    DIMigrationService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(migrationServiceResult)) {
    return err(`Failed to register MigrationService: ${migrationServiceResult.error.message}`);
  }

  // Register NodeDataService (singleton - shared state)
  const nodeDataServiceResult = container.registerClass(
    nodeDataServiceToken,
    DINodeDataService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(nodeDataServiceResult)) {
    return err(`Failed to register NodeDataService: ${nodeDataServiceResult.error.message}`);
  }

  // Register GraphDataService (singleton - shared state)
  const graphDataServiceResult = container.registerClass(
    graphDataServiceToken,
    DIGraphDataService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(graphDataServiceResult)) {
    return err(`Failed to register GraphDataService: ${graphDataServiceResult.error.message}`);
  }

  // Register SheetFacade (singleton) - API entrypoint for Foundry-instantiated sheets
  const sheetFacadeResult = container.registerClass(
    sheetFacadeToken,
    DISheetFacade,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(sheetFacadeResult)) {
    return err(`Failed to register SheetFacade: ${sheetFacadeResult.error.message}`);
  }

  // Register CreateNodePageUseCase (transient - new instance per use)
  const createNodePageResult = container.registerClass(
    createNodePageUseCaseToken,
    DICreateNodePageUseCase,
    ServiceLifecycle.TRANSIENT
  );
  if (isErr(createNodePageResult)) {
    return err(`Failed to register CreateNodePageUseCase: ${createNodePageResult.error.message}`);
  }

  // Register CreateGraphPageUseCase (transient - new instance per use)
  const createGraphPageResult = container.registerClass(
    createGraphPageUseCaseToken,
    DICreateGraphPageUseCase,
    ServiceLifecycle.TRANSIENT
  );
  if (isErr(createGraphPageResult)) {
    return err(`Failed to register CreateGraphPageUseCase: ${createGraphPageResult.error.message}`);
  }

  // Register AddNodeToGraphUseCase (transient - new instance per use)
  const addNodeToGraphResult = container.registerClass(
    addNodeToGraphUseCaseToken,
    DIAddNodeToGraphUseCase,
    ServiceLifecycle.TRANSIENT
  );
  if (isErr(addNodeToGraphResult)) {
    return err(`Failed to register AddNodeToGraphUseCase: ${addNodeToGraphResult.error.message}`);
  }

  // Register RemoveNodeFromGraphUseCase (transient - new instance per use)
  const removeNodeFromGraphResult = container.registerClass(
    removeNodeFromGraphUseCaseToken,
    DIRemoveNodeFromGraphUseCase,
    ServiceLifecycle.TRANSIENT
  );
  if (isErr(removeNodeFromGraphResult)) {
    return err(
      `Failed to register RemoveNodeFromGraphUseCase: ${removeNodeFromGraphResult.error.message}`
    );
  }

  // Register UpsertEdgeUseCase (transient - new instance per use)
  const upsertEdgeResult = container.registerClass(
    upsertEdgeUseCaseToken,
    DIUpsertEdgeUseCase,
    ServiceLifecycle.TRANSIENT
  );
  if (isErr(upsertEdgeResult)) {
    return err(`Failed to register UpsertEdgeUseCase: ${upsertEdgeResult.error.message}`);
  }

  // Register RemoveEdgeUseCase (transient - new instance per use)
  const removeEdgeResult = container.registerClass(
    removeEdgeUseCaseToken,
    DIRemoveEdgeUseCase,
    ServiceLifecycle.TRANSIENT
  );
  if (isErr(removeEdgeResult)) {
    return err(`Failed to register RemoveEdgeUseCase: ${removeEdgeResult.error.message}`);
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "RelationshipAppServices",
  priority: 90, // After RelationshipPageServices (85) since we depend on RelationshipPageRepositoryAdapter
  execute: registerRelationshipAppServices,
});
