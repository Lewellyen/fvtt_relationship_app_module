import { describe, it, expect, vi, beforeEach } from "vitest";
import { InitOrchestrator } from "../init-orchestrator";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { MetricsBootstrapper } from "../orchestrators/metrics-bootstrapper";
import { LoggingBootstrapper } from "../orchestrators/logging-bootstrapper";
import { NotificationBootstrapper } from "../orchestrators/notification-bootstrapper";
import { ApiBootstrapper } from "../orchestrators/api-bootstrapper";
import { SettingsBootstrapper } from "../orchestrators/settings-bootstrapper";
import { EventsBootstrapper } from "../orchestrators/events-bootstrapper";
import { ContextMenuBootstrapper } from "../orchestrators/context-menu-bootstrapper";
import { err, ok } from "@/domain/utils/result";

vi.mock("../orchestrators/metrics-bootstrapper");
vi.mock("../orchestrators/notification-bootstrapper");
vi.mock("../orchestrators/api-bootstrapper");
vi.mock("../orchestrators/settings-bootstrapper");
vi.mock("../orchestrators/logging-bootstrapper");
vi.mock("../orchestrators/events-bootstrapper");
vi.mock("../orchestrators/context-menu-bootstrapper");

describe("InitOrchestrator", () => {
  let mockContainer: PlatformContainerPort;
  let mockLogger: Logger;

  beforeEach(() => {
    mockContainer = {
      resolveWithError: vi.fn(),
      resolve: vi.fn(),
      getValidationState: vi.fn(),
      isRegistered: vi.fn(),
    } as unknown as PlatformContainerPort;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;

    vi.clearAllMocks();
  });

  it("should execute all phases successfully", () => {
    vi.mocked(MetricsBootstrapper.initializeMetrics).mockReturnValue(ok(undefined));
    vi.mocked(NotificationBootstrapper.attachNotificationChannels).mockReturnValue(ok(undefined));
    vi.mocked(ApiBootstrapper.exposeApi).mockReturnValue(ok(undefined));
    vi.mocked(SettingsBootstrapper.registerSettings).mockReturnValue(ok(undefined));
    vi.mocked(LoggingBootstrapper.configureLogging).mockReturnValue(ok(undefined));
    vi.mocked(EventsBootstrapper.registerEvents).mockReturnValue(ok(undefined));
    vi.mocked(ContextMenuBootstrapper.registerContextMenu).mockReturnValue(ok(undefined));

    const result = InitOrchestrator.execute(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should warn when metrics initialization fails", () => {
    vi.mocked(MetricsBootstrapper.initializeMetrics).mockReturnValue(err("Metrics failed"));
    vi.mocked(NotificationBootstrapper.attachNotificationChannels).mockReturnValue(ok(undefined));
    vi.mocked(ApiBootstrapper.exposeApi).mockReturnValue(ok(undefined));
    vi.mocked(SettingsBootstrapper.registerSettings).mockReturnValue(ok(undefined));
    vi.mocked(LoggingBootstrapper.configureLogging).mockReturnValue(ok(undefined));
    vi.mocked(EventsBootstrapper.registerEvents).mockReturnValue(ok(undefined));
    vi.mocked(ContextMenuBootstrapper.registerContextMenu).mockReturnValue(ok(undefined));

    const result = InitOrchestrator.execute(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith("Metrics initialization failed: Metrics failed");
  });

  it("should warn when logging configuration fails", () => {
    vi.mocked(MetricsBootstrapper.initializeMetrics).mockReturnValue(ok(undefined));
    vi.mocked(NotificationBootstrapper.attachNotificationChannels).mockReturnValue(ok(undefined));
    vi.mocked(ApiBootstrapper.exposeApi).mockReturnValue(ok(undefined));
    vi.mocked(SettingsBootstrapper.registerSettings).mockReturnValue(ok(undefined));
    vi.mocked(LoggingBootstrapper.configureLogging).mockReturnValue(err("Logging failed"));
    vi.mocked(EventsBootstrapper.registerEvents).mockReturnValue(ok(undefined));
    vi.mocked(ContextMenuBootstrapper.registerContextMenu).mockReturnValue(ok(undefined));

    const result = InitOrchestrator.execute(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith("Logging configuration failed: Logging failed");
  });

  it("should return errors when critical phases fail", () => {
    vi.mocked(MetricsBootstrapper.initializeMetrics).mockReturnValue(ok(undefined));
    vi.mocked(NotificationBootstrapper.attachNotificationChannels).mockReturnValue(ok(undefined));
    vi.mocked(ApiBootstrapper.exposeApi).mockReturnValue(err("API failed"));
    vi.mocked(SettingsBootstrapper.registerSettings).mockReturnValue(err("Settings failed"));
    vi.mocked(LoggingBootstrapper.configureLogging).mockReturnValue(ok(undefined));
    vi.mocked(EventsBootstrapper.registerEvents).mockReturnValue(err("Events failed"));
    vi.mocked(ContextMenuBootstrapper.registerContextMenu).mockReturnValue(ok(undefined));

    const result = InitOrchestrator.execute(mockContainer, mockLogger);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toHaveLength(3);
      expect(result.error[0]!.phase).toBe("api-exposure");
      expect(result.error[1]!.phase).toBe("settings-registration");
      expect(result.error[2]!.phase).toBe("event-registration");
    }
    expect(mockLogger.error).toHaveBeenCalledTimes(3);
  });
});
