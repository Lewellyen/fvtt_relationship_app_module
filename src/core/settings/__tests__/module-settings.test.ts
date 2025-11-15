import { describe, it, expect, vi } from "vitest";
import type { Logger } from "@/interfaces/logger";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import { LogLevel } from "@/config/environment";
import { logLevelSetting } from "@/core/settings/log-level-setting";
import { cacheEnabledSetting } from "@/core/settings/cache-enabled-setting";
import { cacheDefaultTtlSetting } from "@/core/settings/cache-default-ttl-setting";
import { cacheMaxEntriesSetting } from "@/core/settings/cache-max-entries-setting";
import { performanceTrackingSetting } from "@/core/settings/performance-tracking-setting";
import { performanceSamplingSetting } from "@/core/settings/performance-sampling-setting";
import { metricsPersistenceEnabledSetting } from "@/core/settings/metrics-persistence-enabled-setting";
import { metricsPersistenceKeySetting } from "@/core/settings/metrics-persistence-key-setting";

type MockLogger = Logger & {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  log: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  setMinLevel: ReturnType<typeof vi.fn>;
};

function createMocks(): { logger: MockLogger; i18n: I18nFacadeService } {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    setMinLevel: vi.fn(),
  } as unknown as MockLogger;

  const i18n = {
    translate: vi.fn((_key: string, fallback: string) => fallback),
  } as unknown as I18nFacadeService;

  return { logger, i18n };
}

describe("module settings definitions", () => {
  it("updates logger level via logLevelSetting", () => {
    const { logger, i18n } = createMocks();
    const config = logLevelSetting.createConfig(i18n, logger);
    config.onChange?.(LogLevel.DEBUG);
    expect(logger.setMinLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
  });

  it("logs cache toggle changes", () => {
    const { logger, i18n } = createMocks();
    const config = cacheEnabledSetting.createConfig(i18n, logger);
    config.onChange?.(false);
    expect(logger.info).toHaveBeenCalledWith("CacheService disabled via module setting.");
    logger.info.mockClear();
    config.onChange?.(true);
    expect(logger.info).toHaveBeenCalledWith("CacheService enabled via module setting.");
  });

  it("sanitizes cache TTL updates", () => {
    const { logger, i18n } = createMocks();
    const config = cacheDefaultTtlSetting.createConfig(i18n, logger);
    config.onChange?.(-5);
    expect(logger.info).toHaveBeenCalledWith("Cache TTL updated via settings: 0ms");
    logger.info.mockClear();
    config.onChange?.(123);
    expect(logger.info).toHaveBeenCalledWith("Cache TTL updated via settings: 123ms");
  });

  it("reports cache max entries for unlimited and bounded values", () => {
    const { logger, i18n } = createMocks();
    const config = cacheMaxEntriesSetting.createConfig(i18n, logger);

    config.onChange?.(0);
    expect(logger.info).toHaveBeenCalledWith("Cache max entries reset to unlimited via settings.");

    logger.info.mockClear();
    config.onChange?.(42.7);
    expect(logger.info).toHaveBeenCalledWith("Cache max entries updated via settings: 42");
  });

  it("logs performance tracking toggles", () => {
    const { logger, i18n } = createMocks();
    const config = performanceTrackingSetting.createConfig(i18n, logger);
    config.onChange?.(true);
    expect(logger.info).toHaveBeenCalledWith("Performance tracking enabled via module setting.");
    logger.info.mockClear();
    config.onChange?.(false);
    expect(logger.info).toHaveBeenCalledWith("Performance tracking disabled via module setting.");
  });

  it("logs performance sampling rate updates", () => {
    const { logger, i18n } = createMocks();
    const config = performanceSamplingSetting.createConfig(i18n, logger);
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
    const { logger, i18n } = createMocks();
    const config = metricsPersistenceEnabledSetting.createConfig(i18n, logger);
    config.onChange?.(true);
    expect(logger.info).toHaveBeenCalledWith("Metrics persistence enabled via module setting.");
    logger.info.mockClear();
    config.onChange?.(false);
    expect(logger.info).toHaveBeenCalledWith("Metrics persistence disabled via module setting.");
  });

  it("logs metrics persistence key changes", () => {
    const { logger, i18n } = createMocks();
    const config = metricsPersistenceKeySetting.createConfig(i18n, logger);
    config.onChange?.("custom.metrics");
    expect(logger.info).toHaveBeenCalledWith("Metrics persistence key set to: custom.metrics");
    logger.info.mockClear();
    config.onChange?.("");
    expect(logger.info).toHaveBeenCalledWith("Metrics persistence key set to: (empty)");
  });
});
