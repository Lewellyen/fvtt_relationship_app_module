import { describe, it, expect, vi } from "vitest";
import { ok, err } from "@/domain/utils/result";
import { MetricsInitializationAdapter } from "../metrics-initialization-adapter";

describe("MetricsInitializationAdapter", () => {
  it("should return ok when collector is not initializable", () => {
    const adapter = new MetricsInitializationAdapter({} as any);
    const result = adapter.initialize();
    expect(result.ok).toBe(true);
  });

  it("should call initialize when collector is initializable", () => {
    const initialize = vi.fn().mockReturnValue(ok(undefined));
    const adapter = new MetricsInitializationAdapter({ initialize } as any);
    const result = adapter.initialize();
    expect(result.ok).toBe(true);
    expect(initialize).toHaveBeenCalledOnce();
  });

  it("should propagate error when initialize fails", () => {
    const initialize = vi.fn().mockReturnValue(err("boom"));
    const adapter = new MetricsInitializationAdapter({ initialize } as any);
    const result = adapter.initialize();
    expect(result.ok).toBe(false);
  });
});
