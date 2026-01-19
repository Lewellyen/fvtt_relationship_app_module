import { describe, it, expect, vi } from "vitest";
import { createJournalOverviewWindowDefinition } from "../journal-overview-window.definition";
import { err, ok } from "@/domain/utils/result";
import type { ActionContext } from "@/domain/windows/types/action-definition.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";

describe("journal-overview-window.definition coverage", () => {
  it("should warn when bulk setFlag fails and notifications are provided", async () => {
    const definition = createJournalOverviewWindowDefinition({});
    const action = definition.actions?.find((a) => a.id === "setAllVisible");
    expect(action?.handler).toBeDefined();
    if (!action?.handler) return;

    const mockControllerState: Record<string, unknown> = {
      filteredJournals: [{ id: "j1", name: "J1", isHidden: true }],
    };

    const controller: IWindowController = {
      updateStateLocal: vi.fn().mockResolvedValue(undefined),
      dispatchAction: vi.fn().mockResolvedValue(ok(undefined)),
      get state() {
        return mockControllerState as Readonly<Record<string, unknown>>;
      },
    } as unknown as IWindowController;

    const repo: PlatformJournalRepository = {
      setFlag: vi.fn().mockResolvedValue(err({ code: "OPERATION_FAILED", message: "fail" })),
    } as unknown as PlatformJournalRepository;

    const ui: PlatformUIPort = {
      notify: vi.fn(),
      confirm: vi.fn(),
    } as unknown as PlatformUIPort;

    const notifications: NotificationPublisherPort = {
      warn: vi.fn(),
    } as unknown as NotificationPublisherPort;

    const context: ActionContext = {
      windowInstanceId: "w1",
      state: {},
      metadata: {
        controller,
        platformJournalRepository: repo,
        platformUI: ui,
        notificationPublisher: notifications,
      },
    };

    const result = await action.handler(context);
    expect(result.ok).toBe(true);
    expect(vi.mocked(notifications.warn)).toHaveBeenCalled();
    expect(vi.mocked(ui.notify)).toHaveBeenCalled();
  });

  it("should not warn when bulk setFlag fails and notifications are missing", async () => {
    const definition = createJournalOverviewWindowDefinition({});
    const action = definition.actions?.find((a) => a.id === "setAllVisible");
    expect(action?.handler).toBeDefined();
    if (!action?.handler) return;

    const mockControllerState: Record<string, unknown> = {
      filteredJournals: [{ id: "j1", name: "J1", isHidden: true }],
    };

    const controller: IWindowController = {
      updateStateLocal: vi.fn().mockResolvedValue(undefined),
      dispatchAction: vi.fn().mockResolvedValue(ok(undefined)),
      get state() {
        return mockControllerState as Readonly<Record<string, unknown>>;
      },
    } as unknown as IWindowController;

    const repo: PlatformJournalRepository = {
      setFlag: vi.fn().mockResolvedValue(err({ code: "OPERATION_FAILED", message: "fail" })),
    } as unknown as PlatformJournalRepository;

    const ui: PlatformUIPort = {
      notify: vi.fn(),
      confirm: vi.fn(),
    } as unknown as PlatformUIPort;

    const context: ActionContext = {
      windowInstanceId: "w1",
      state: {},
      metadata: {
        controller,
        platformJournalRepository: repo,
        platformUI: ui,
        // no notificationPublisher
      },
    };

    const result = await action.handler(context);
    expect(result.ok).toBe(true);
    expect(vi.mocked(ui.notify)).toHaveBeenCalled();
  });
});
