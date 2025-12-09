import { describe, it, expect, vi } from "vitest";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { LogLevel } from "@/domain/types/log-level";
import { ok } from "@/domain/utils/result";
import { logLevelSetting } from "@/application/settings/log-level-setting";
import { cacheEnabledSetting } from "@/application/settings/cache-enabled-setting";
import { cacheDefaultTtlSetting } from "@/application/settings/cache-default-ttl-setting";
import { cacheMaxEntriesSetting } from "@/application/settings/cache-max-entries-setting";
import { performanceTrackingSetting } from "@/application/settings/performance-tracking-setting";
import { performanceSamplingSetting } from "@/application/settings/performance-sampling-setting";
import { metricsPersistenceEnabledSetting } from "@/application/settings/metrics-persistence-enabled-setting";
import { metricsPersistenceKeySetting } from "@/application/settings/metrics-persistence-key-setting";
import { notificationQueueMaxSizeSetting } from "@/application/settings/notification-queue-max-size-setting";

type MockLogger = Logger & {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  log: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  setMinLevel: ReturnType<typeof vi.fn>;
};

function createMocks(): {
  logger: MockLogger;
  i18n: PlatformI18nPort;
  validator: PlatformValidationPort;
} {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    setMinLevel: vi.fn(),
  } as unknown as MockLogger;

  const i18n = {
    translate: vi.fn((_key: string, fallback?: string) => ok(fallback ?? _key)),
    format: vi.fn((_key: string, _data: Record<string, unknown>, fallback?: string) =>
      ok(fallback ?? _key)
    ),
    has: vi.fn(() => ok(false)),
    loadLocalTranslations: vi.fn(),
  } as unknown as PlatformI18nPort;

  const validator = {
    validateLogLevel: vi.fn((value: number) => {
      if (value >= LogLevel.DEBUG && value <= LogLevel.ERROR) {
        return ok(value as LogLevel);
      }
      return { ok: false, error: "Invalid log level" };
    }),
  } as unknown as PlatformValidationPort;

  return { logger, i18n, validator };
}

describe("module settings definitions", () => {
  it("updates logger level via logLevelSetting", () => {
    const { logger, i18n, validator } = createMocks();
    const config = logLevelSetting.createConfig(i18n, logger, validator);
    config.onChange?.(LogLevel.DEBUG);
    expect(logger.setMinLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
  });

  it("logs cache toggle changes", () => {
    const { logger, i18n, validator } = createMocks();
    const config = cacheEnabledSetting.createConfig(i18n, logger, validator);
    config.onChange?.(false);
    expect(logger.info).toHaveBeenCalledWith("CacheService disabled via module setting.");
    logger.info.mockClear();
    config.onChange?.(true);
    expect(logger.info).toHaveBeenCalledWith("CacheService enabled via module setting.");
  });

  it("sanitizes cache TTL updates", () => {
    const { logger, i18n, validator } = createMocks();
    const config = cacheDefaultTtlSetting.createConfig(i18n, logger, validator);
    config.onChange?.(-5);
    expect(logger.info).toHaveBeenCalledWith("Cache TTL updated via settings: 0ms");
    logger.info.mockClear();
    config.onChange?.(123);
    expect(logger.info).toHaveBeenCalledWith("Cache TTL updated via settings: 123ms");
  });

  it("reports cache max entries for unlimited and bounded values", () => {
    const { logger, i18n, validator } = createMocks();
    const config = cacheMaxEntriesSetting.createConfig(i18n, logger, validator);

    config.onChange?.(0);
    expect(logger.info).toHaveBeenCalledWith("Cache max entries reset to unlimited via settings.");

    logger.info.mockClear();
    config.onChange?.(42.7);
    expect(logger.info).toHaveBeenCalledWith("Cache max entries updated via settings: 42");
  });

  it("logs performance tracking toggles", () => {
    const { logger, i18n, validator } = createMocks();
    const config = performanceTrackingSetting.createConfig(i18n, logger, validator);
    config.onChange?.(true);
    expect(logger.info).toHaveBeenCalledWith("Performance tracking enabled via module setting.");
    logger.info.mockClear();
    config.onChange?.(false);
    expect(logger.info).toHaveBeenCalledWith("Performance tracking disabled via module setting.");
  });

  it("logs performance sampling rate updates", () => {
    const { logger, i18n, validator } = createMocks();
    const config = performanceSamplingSetting.createConfig(i18n, logger, validator);
    config.onChange?.(0.25);
    expect(logger.info).toHaveBeenCalledWith(
      "Performance sampling rate updated via settings: 25.0%"
    );
    logger.info.mockClear();
    config.onChange?.(undefined as unknown as number);
    expect(logger.info).toHaveBeenCalledWith(
      "Performance sampling rate updated via settings: 0.0%"
    );
  });

  it("logs metrics persistence toggles", () => {
    const { logger, i18n, validator } = createMocks();
    const config = metricsPersistenceEnabledSetting.createConfig(i18n, logger, validator);
    config.onChange?.(true);
    expect(logger.info).toHaveBeenCalledWith("Metrics persistence enabled via module setting.");
    logger.info.mockClear();
    config.onChange?.(false);
    expect(logger.info).toHaveBeenCalledWith("Metrics persistence disabled via module setting.");
  });

  it("logs metrics persistence key changes", () => {
    const { logger, i18n, validator } = createMocks();
    const config = metricsPersistenceKeySetting.createConfig(i18n, logger, validator);
    config.onChange?.("custom.metrics");
    expect(logger.info).toHaveBeenCalledWith("Metrics persistence key set to: custom.metrics");
    logger.info.mockClear();
    config.onChange?.("");
    expect(logger.info).toHaveBeenCalledWith("Metrics persistence key set to: (empty)");
  });

  it("logs notification queue max size updates and clamps values", () => {
    const { logger, i18n, validator } = createMocks();
    const config = notificationQueueMaxSizeSetting.createConfig(i18n, logger, validator);

    // Test normal update
    config.onChange?.(100);
    expect(logger.info).toHaveBeenCalledWith(
      "Notification queue max size updated via settings: 100"
    );
    logger.info.mockClear();

    // Test clamping from value below min (ENV min is 10)
    config.onChange?.(5);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Notification queue max size clamped from 5 to 10")
    );
    logger.info.mockClear();

    // Test clamping from value above max (ENV max is 1000)
    config.onChange?.(2000);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Notification queue max size clamped from 2000 to 1000")
    );
    logger.info.mockClear();

    // Test with decimal value (should be floored and clamped)
    config.onChange?.(75.7);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Notification queue max size clamped from 75.7 to 75")
    );
  });
});
