import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowPersistenceCoordinator } from "../window-persistence-coordinator";
import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { PersistConfig, PersistMeta } from "@/domain/windows/types/persist-config.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";

describe("WindowPersistenceCoordinator", () => {
  let coordinator: WindowPersistenceCoordinator;
  let mockAdapter: IPersistAdapter;
  let mockConfig: PersistConfig;
  let mockState: Record<string, unknown>;
  let mockMeta: PersistMeta;

  beforeEach(() => {
    mockAdapter = {
      save: vi.fn(),
      load: vi.fn(),
    } as unknown as IPersistAdapter;

    mockConfig = {
      type: "setting",
      key: "test-key",
      scope: "client",
    };

    mockState = {
      journals: [],
      isLoading: false,
    };

    mockMeta = {
      originClientId: "client-1",
      originWindowInstanceId: "window-1",
    };

    coordinator = new WindowPersistenceCoordinator(mockAdapter);
  });

  describe("persist", () => {
    it("should persist state successfully", async () => {
      vi.mocked(mockAdapter.save).mockResolvedValue(ok(undefined));

      const result = await coordinator.persist(mockConfig, mockState, mockMeta);

      expectResultOk(result);
      expect(mockAdapter.save).toHaveBeenCalledWith(mockConfig, mockState, mockMeta);
    });

    it("should persist state without meta", async () => {
      vi.mocked(mockAdapter.save).mockResolvedValue(ok(undefined));

      const result = await coordinator.persist(mockConfig, mockState);

      expectResultOk(result);
      expect(mockAdapter.save).toHaveBeenCalledWith(mockConfig, mockState, undefined);
    });

    it("should return error if no adapter available", async () => {
      const coordinatorWithoutAdapter = new WindowPersistenceCoordinator(undefined);

      const result = await coordinatorWithoutAdapter.persist(mockConfig, mockState, mockMeta);

      expectResultErr(result);
      expect(result.error.code).toBe("NoPersistAdapter");
      expect(result.error.message).toBe("No persist adapter available");
    });

    it("should return error if save fails", async () => {
      vi.mocked(mockAdapter.save).mockResolvedValue(
        err({
          code: "SaveFailed",
          message: "Save error",
        })
      );

      const result = await coordinator.persist(mockConfig, mockState, mockMeta);

      expectResultErr(result);
      expect(result.error.code).toBe("PersistFailed");
      expect(result.error.message).toContain("Failed to persist state");
      expect(mockAdapter.save).toHaveBeenCalled();
    });
  });

  describe("restore", () => {
    it("should restore state successfully", async () => {
      const restoredState = { journals: [], isLoading: false };
      vi.mocked(mockAdapter.load).mockResolvedValue(ok(restoredState));

      const result = await coordinator.restore(mockConfig);

      expectResultOk(result);
      expect(result.value).toEqual(restoredState);
      expect(mockAdapter.load).toHaveBeenCalledWith(mockConfig);
    });

    it("should return error if no adapter available", async () => {
      const coordinatorWithoutAdapter = new WindowPersistenceCoordinator(undefined);

      const result = await coordinatorWithoutAdapter.restore(mockConfig);

      expectResultErr(result);
      expect(result.error.code).toBe("NoPersistAdapter");
      expect(result.error.message).toBe("No persist adapter available");
    });

    it("should return error if load fails", async () => {
      vi.mocked(mockAdapter.load).mockResolvedValue(
        err({
          code: "LoadFailed",
          message: "Load error",
        })
      );

      const result = await coordinator.restore(mockConfig);

      expectResultErr(result);
      expect(result.error.code).toBe("RestoreFailed");
      expect(result.error.message).toContain("Failed to restore state");
      expect(mockAdapter.load).toHaveBeenCalled();
    });

    it("should handle different config types", async () => {
      const flagConfig: PersistConfig = {
        type: "flag",
        key: "flag-key",
      };
      const restoredState = { flag: true };
      vi.mocked(mockAdapter.load).mockResolvedValue(ok(restoredState));

      const result = await coordinator.restore(flagConfig);

      expectResultOk(result);
      expect(result.value).toEqual(restoredState);
      expect(mockAdapter.load).toHaveBeenCalledWith(flagConfig);
    });
  });
});
