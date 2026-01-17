import { describe, it, expect, vi, beforeEach } from "vitest";
import { MetricsBootstrapper } from "../metrics-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { platformMetricsInitializationPortToken } from "@/application/tokens/domain-ports.tokens";
import { ok, err } from "@/domain/utils/result";
import type { PlatformMetricsInitializationPort } from "@/domain/ports/bootstrap/platform-metrics-initialization-port.interface";

describe("MetricsBootstrapper", () => {
  let mockContainer: PlatformContainerPort;

  beforeEach(() => {
    mockContainer = {
      resolveWithError: vi.fn(),
      resolve: vi.fn(),
      getValidationState: vi.fn(),
      isRegistered: vi.fn(),
    } as unknown as PlatformContainerPort;
  });

  it("should return success when metrics initialization port is not available", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "Metrics init port not registered",
      })
    );

    const result = MetricsBootstrapper.initializeMetrics(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(
      platformMetricsInitializationPortToken
    );
  });

  it("should call initialize when port is available", () => {
    const initPort: PlatformMetricsInitializationPort = {
      initialize: vi.fn().mockReturnValue(ok(undefined)),
    };
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(ok(initPort));

    const result = MetricsBootstrapper.initializeMetrics(mockContainer);

    expect(result.ok).toBe(true);
    expect(initPort.initialize).toHaveBeenCalledOnce();
  });

  it("should return success even when initialize fails", () => {
    const initPort: PlatformMetricsInitializationPort = {
      initialize: vi.fn().mockReturnValue(err("Initialization failed")),
    };
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(ok(initPort));

    const result = MetricsBootstrapper.initializeMetrics(mockContainer);

    expect(result.ok).toBe(true);
    expect(initPort.initialize).toHaveBeenCalledOnce();
  });
});
