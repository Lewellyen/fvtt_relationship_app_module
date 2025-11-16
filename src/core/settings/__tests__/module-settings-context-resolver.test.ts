import { describe, it, expect, vi, afterEach } from "vitest";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import type { Logger } from "@/interfaces/logger";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";
import { ModuleSettingsContextResolver } from "@/core/settings/module-settings-context-resolver";
import {
  notificationCenterToken,
  loggerToken,
  i18nFacadeToken,
  runtimeConfigToken,
} from "@/tokens/tokenindex";
import { foundrySettingsToken } from "@/foundry/foundrytokens";
import { ok, err } from "@/utils/functional/result";
import type { Result } from "@/types/result";

type ResolveResponse = Result<unknown, unknown>;

function createContainerMock(responses: Map<symbol, ResolveResponse>): ServiceContainer {
  const resolveWithError = vi.fn((token: symbol) => {
    const response = responses.get(token as symbol);
    if (!response) {
      throw new Error(`Missing mock for token ${String(token)}`);
    }
    return response;
  });

  return {
    resolveWithError,
  } as unknown as ServiceContainer;
}

describe("ModuleSettingsContextResolver", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null and logs when NotificationCenter cannot be resolved", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const resolver = new ModuleSettingsContextResolver();
    const container = {
      resolveWithError: vi
        .fn()
        .mockReturnValueOnce(err({ code: "DependencyResolveFailed", message: "missing" })),
    } as unknown as ServiceContainer;

    const result = resolver.resolve(container);

    expect(result).toBeNull();
    expect(container.resolveWithError).toHaveBeenCalledTimes(1);
    expect(container.resolveWithError).toHaveBeenCalledWith(notificationCenterToken);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to resolve NotificationCenter for ModuleSettingsRegistrar",
      expect.objectContaining({
        error: { code: "DependencyResolveFailed", message: "missing" },
      })
    );
  });

  it("routes DI resolution failures through NotificationCenter", () => {
    const notifications = {
      error: vi.fn(),
    } as unknown as NotificationCenter;
    const logger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;
    const i18n = {
      translate: vi.fn(),
      format: vi.fn(),
      has: vi.fn(),
      loadLocalTranslations: vi.fn(),
    } as unknown as I18nFacadeService;
    const runtimeConfig = {} as RuntimeConfigService;

    const resolver = new ModuleSettingsContextResolver();
    const responses = new Map<symbol, ResolveResponse>([
      [notificationCenterToken as symbol, ok(notifications)],
      [foundrySettingsToken as symbol, err({ code: "MissingSettings" })],
      [loggerToken as symbol, ok(logger)],
      [i18nFacadeToken as symbol, ok(i18n)],
      [runtimeConfigToken as symbol, ok(runtimeConfig)],
    ]);
    const container = createContainerMock(responses);

    const result = resolver.resolve(container);

    expect(result).toBeNull();
    expect(notifications.error).toHaveBeenCalledWith(
      "DI resolution failed in ModuleSettingsRegistrar",
      {
        code: "DI_RESOLUTION_FAILED",
        message: "Required services for ModuleSettingsRegistrar are missing",
        details: {
          settingsResolved: false,
          i18nResolved: true,
          loggerResolved: true,
          runtimeConfigResolved: true,
        },
      },
      { channels: ["ConsoleChannel"] }
    );
  });

  it("returns a fully populated context when all dependencies resolve", () => {
    const notifications = {
      error: vi.fn(),
    } as unknown as NotificationCenter;
    const foundrySettings = {
      dispose: vi.fn(),
      register: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
    } as unknown as FoundrySettings;
    const logger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;
    const i18n = {
      translate: vi.fn(),
      format: vi.fn(),
      has: vi.fn(),
      loadLocalTranslations: vi.fn(),
    } as unknown as I18nFacadeService;
    const runtimeConfig = {} as RuntimeConfigService;

    const resolver = new ModuleSettingsContextResolver();
    const responses = new Map<symbol, ResolveResponse>([
      [notificationCenterToken as symbol, ok(notifications)],
      [foundrySettingsToken as symbol, ok(foundrySettings)],
      [loggerToken as symbol, ok(logger)],
      [i18nFacadeToken as symbol, ok(i18n)],
      [runtimeConfigToken as symbol, ok(runtimeConfig)],
    ]);
    const container = createContainerMock(responses);

    const context = resolver.resolve(container);

    expect(context).toEqual({
      notifications,
      foundrySettings,
      logger,
      i18n,
      runtimeConfig,
    });
  });
});
