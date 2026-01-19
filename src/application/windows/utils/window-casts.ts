/**
 * Window Cast Utilities for Application Layer
 *
 * Provides type-safe helper functions for ActionContext metadata operations in the Window Framework.
 * This file consolidates ActionContext metadata type assertions to avoid non-null assertions.
 *
 * These helpers are runtime-safe when used with the WindowController contract,
 * as the controller guarantees that metadata contains the expected values.
 */

import type { ActionContext } from "@/domain/windows/types/action-definition.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { JournalOverviewService } from "@/application/services/JournalOverviewService";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { CacheInvalidationPort } from "@/domain/ports/cache/cache-invalidation-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalDirectoryRerenderScheduler } from "@/application/services/JournalDirectoryRerenderScheduler";
import {
  castPlatformContainerPort,
  castResolvedService,
  castWindowController,
} from "./service-casts";

/**
 * Gets the controller from ActionContext metadata.
 *
 * This helper function eliminates the need for type assertions when
 * accessing the controller from ActionContext.metadata. The WindowController contract
 * guarantees that the controller is available in the metadata.
 *
 * @template TState - The state type
 * @param context - The ActionContext to extract the controller from
 * @returns The controller if available, undefined otherwise
 *
 * @example
 * ```typescript
 * // Instead of:
 * // type assertion needed here
 * const controller = context.metadata?.controller as IWindowController | undefined;
 *
 * // Use:
 * const controller = getControllerFromContext(context);
 * ```
 */
export function getControllerFromContext<TState = Record<string, unknown>>(
  context: ActionContext<TState>
): IWindowController | undefined {
  const controller = context.metadata?.controller;
  return castWindowController(controller);
}

/**
 * Gets the container from ActionContext metadata.
 *
 * This helper function eliminates the need for type assertions when
 * accessing the container from ActionContext.metadata. The WindowController contract
 * guarantees that the container is available in the metadata.
 *
 * @template TState - The state type
 * @param context - The ActionContext to extract the container from
 * @returns The container if available, undefined otherwise
 *
 * @example
 * ```typescript
 * // Instead of:
 * // type assertion needed here
 * const container = context.metadata?.container as PlatformContainerPort | undefined;
 *
 * // Use:
 * const container = getContainerFromContext(context);
 * ```
 */
export function getContainerFromContext<TState = Record<string, unknown>>(
  context: ActionContext<TState>
): PlatformContainerPort | undefined {
  const container = context.metadata?.container;
  return castPlatformContainerPort(container);
}

export function getJournalOverviewServiceFromContext<TState = Record<string, unknown>>(
  context: ActionContext<TState>
): JournalOverviewService | undefined {
  const service = context.metadata?.journalOverviewService;
  if (service === undefined) return undefined;
  return castResolvedService<JournalOverviewService>(service);
}

export function getPlatformJournalRepositoryFromContext<TState = Record<string, unknown>>(
  context: ActionContext<TState>
): PlatformJournalRepository | undefined {
  const repo = context.metadata?.platformJournalRepository;
  if (repo === undefined) return undefined;
  return castResolvedService<PlatformJournalRepository>(repo);
}

export function getCacheInvalidationPortFromContext<TState = Record<string, unknown>>(
  context: ActionContext<TState>
): CacheInvalidationPort | undefined {
  const cache = context.metadata?.cacheInvalidationPort;
  if (cache === undefined) return undefined;
  return castResolvedService<CacheInvalidationPort>(cache);
}

export function getJournalDirectoryRerenderSchedulerFromContext<TState = Record<string, unknown>>(
  context: ActionContext<TState>
): JournalDirectoryRerenderScheduler | undefined {
  const scheduler = context.metadata?.journalDirectoryRerenderScheduler;
  if (scheduler === undefined) return undefined;
  return castResolvedService<JournalDirectoryRerenderScheduler>(scheduler);
}

export function getPlatformUIPortFromContext<TState = Record<string, unknown>>(
  context: ActionContext<TState>
): PlatformUIPort | undefined {
  const ui = context.metadata?.platformUI;
  if (ui === undefined) return undefined;
  return castResolvedService<PlatformUIPort>(ui);
}

export function getNotificationPublisherFromContext<TState = Record<string, unknown>>(
  context: ActionContext<TState>
): NotificationPublisherPort | undefined {
  const notifications = context.metadata?.notificationPublisher;
  if (notifications === undefined) return undefined;
  return castResolvedService<NotificationPublisherPort>(notifications);
}
