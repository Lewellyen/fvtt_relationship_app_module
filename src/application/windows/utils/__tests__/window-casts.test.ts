import { describe, it, expect } from "vitest";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { ActionContext } from "@/domain/windows/types/action-definition.interface";
import type { JournalOverviewService } from "@/application/services/JournalOverviewService";
import type { CacheInvalidationPort } from "@/domain/ports/cache/cache-invalidation-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { JournalDirectoryRerenderScheduler } from "@/application/services/JournalDirectoryRerenderScheduler";
import {
  getCacheInvalidationPortFromContext,
  getContainerFromContext,
  getJournalDirectoryRerenderSchedulerFromContext,
  getJournalOverviewServiceFromContext,
  getNotificationPublisherFromContext,
  getPlatformJournalRepositoryFromContext,
  getPlatformUIPortFromContext,
} from "../window-casts";

describe("window-casts", () => {
  describe("getContainerFromContext", () => {
    it("should return container when present in metadata", () => {
      const container: PlatformContainerPort = {
        resolveWithError: () => {
          throw new Error("not needed");
        },
        resolve: () => {
          throw new Error("not needed");
        },
        getValidationState: () => "validated",
        isRegistered: () => {
          throw new Error("not needed");
        },
      } as unknown as PlatformContainerPort;

      const context: ActionContext = {
        windowInstanceId: "w1",
        state: {},
        metadata: {
          container,
        },
      };

      expect(getContainerFromContext(context)).toBe(container);
    });

    it("should return undefined when container is missing", () => {
      const context: ActionContext = {
        windowInstanceId: "w1",
        state: {},
        metadata: {},
      };

      expect(getContainerFromContext(context)).toBeUndefined();
    });
  });

  it("should return injected deps from metadata when present", () => {
    const service = {
      getAllJournalsWithVisibilityStatus: () => ({ ok: true }),
    } as unknown as JournalOverviewService;
    const repo = { setFlag: () => ({ ok: true }) } as unknown as PlatformJournalRepository;
    const cache = { invalidateWhere: () => undefined } as unknown as CacheInvalidationPort;
    const scheduler = {
      requestRerender: () => undefined,
    } as unknown as JournalDirectoryRerenderScheduler;
    const ui = { notify: () => undefined, confirm: async () => true } as unknown as PlatformUIPort;
    const notifications = { warn: () => undefined } as unknown as NotificationPublisherPort;

    const context: ActionContext = {
      windowInstanceId: "w1",
      state: {},
      metadata: {
        journalOverviewService: service,
        platformJournalRepository: repo,
        cacheInvalidationPort: cache,
        journalDirectoryRerenderScheduler: scheduler,
        platformUI: ui,
        notificationPublisher: notifications,
      },
    };

    expect(getJournalOverviewServiceFromContext(context)).toBe(service);
    expect(getPlatformJournalRepositoryFromContext(context)).toBe(repo);
    expect(getCacheInvalidationPortFromContext(context)).toBe(cache);
    expect(getJournalDirectoryRerenderSchedulerFromContext(context)).toBe(scheduler);
    expect(getPlatformUIPortFromContext(context)).toBe(ui);
    expect(getNotificationPublisherFromContext(context)).toBe(notifications);
  });

  it("should return undefined for missing injected deps", () => {
    const context: ActionContext = {
      windowInstanceId: "w1",
      state: {},
      metadata: {},
    };

    expect(getJournalOverviewServiceFromContext(context)).toBeUndefined();
    expect(getPlatformJournalRepositoryFromContext(context)).toBeUndefined();
    expect(getCacheInvalidationPortFromContext(context)).toBeUndefined();
    expect(getJournalDirectoryRerenderSchedulerFromContext(context)).toBeUndefined();
    expect(getPlatformUIPortFromContext(context)).toBeUndefined();
    expect(getNotificationPublisherFromContext(context)).toBeUndefined();
  });
});
