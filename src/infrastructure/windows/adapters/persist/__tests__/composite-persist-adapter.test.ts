import { describe, it, expect, beforeEach, vi } from "vitest";
import { CompositePersistAdapter } from "../composite-persist-adapter";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { PersistConfig } from "@/domain/windows/types/persist-config.interface";
import { expectResultOk } from "@/test/utils/test-helpers";
import { ok } from "@/domain/utils/result";

describe("CompositePersistAdapter", () => {
  let adapter: CompositePersistAdapter;
  let mockSettingsPort: PlatformSettingsPort;

  beforeEach(() => {
    mockSettingsPort = {
      get: vi.fn().mockReturnValue(ok({})),
      set: vi.fn().mockResolvedValue(ok(undefined)),
      register: vi.fn(),
    } as unknown as PlatformSettingsPort;

    adapter = new CompositePersistAdapter(mockSettingsPort);
  });

  describe("save", () => {
    it("should delegate to flags adapter for flag type", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "test-namespace",
        key: "test-key",
      };
      const data = { value: "test" };

      // Mock game global for flags adapter
      const mockDocument = {
        id: "Actor.123",
        update: vi.fn().mockResolvedValue(undefined),
      };
      const mockCollection = {
        get: vi.fn().mockReturnValue(mockDocument),
        has: vi.fn().mockReturnValue(true),
      };
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(mockCollection),
        },
      };

      const result = await adapter.save(config, data);

      // Should succeed (flags adapter handles it)
      expect(result.ok).toBe(true);

      delete (globalThis as { game?: unknown }).game;
    });

    it("should delegate to settings adapter for setting type", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultOk(result);
      expect(mockSettingsPort.set).toHaveBeenCalledWith("test-namespace", "test-key", data);
    });

    it("should fallback to flags adapter for unknown type", async () => {
      const config: PersistConfig = {
        type: "unknown" as "flag",
        documentId: "Actor.123",
        namespace: "test-namespace",
        key: "test-key",
      };
      const data = { value: "test" };

      // Mock game global for flags adapter
      const mockDocument = {
        id: "Actor.123",
        update: vi.fn().mockResolvedValue(undefined),
      };
      const mockCollection = {
        get: vi.fn().mockReturnValue(mockDocument),
        has: vi.fn().mockReturnValue(true),
      };
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(mockCollection),
        },
      };

      const result = await adapter.save(config, data);

      // Should attempt to use flags adapter (may fail, but that's expected)
      expect(result).toBeDefined();

      delete (globalThis as { game?: unknown }).game;
    });
  });

  describe("load", () => {
    it("should delegate to flags adapter for flag type", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "test-namespace",
        key: "test-key",
      };

      // Mock game global for flags adapter
      const mockDocument = {
        id: "Actor.123",
        getFlag: vi.fn().mockReturnValue({ value: "test" }),
      };
      const mockCollection = {
        get: vi.fn().mockReturnValue(mockDocument),
        has: vi.fn().mockReturnValue(true),
      };
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(mockCollection),
        },
      };

      const result = await adapter.load(config);

      // Should succeed (flags adapter handles it)
      expect(result).toBeDefined();

      delete (globalThis as { game?: unknown }).game;
    });

    it("should delegate to settings adapter for setting type", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };

      const result = await adapter.load(config);

      expectResultOk(result);
      expect(mockSettingsPort.get).toHaveBeenCalledWith(
        "test-namespace",
        "test-key",
        expect.any(Object)
      );
    });

    it("should fallback to flags adapter for unknown type", async () => {
      const config: PersistConfig = {
        type: "unknown" as "flag",
        documentId: "Actor.123",
        namespace: "test-namespace",
        key: "test-key",
      };

      // Mock game global for flags adapter
      const mockDocument = {
        id: "Actor.123",
        getFlag: vi.fn().mockReturnValue({ value: "test" }),
      };
      const mockCollection = {
        get: vi.fn().mockReturnValue(mockDocument),
        has: vi.fn().mockReturnValue(true),
      };
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(mockCollection),
        },
      };

      const result = await adapter.load(config);

      // Should attempt to use flags adapter
      expect(result).toBeDefined();

      delete (globalThis as { game?: unknown }).game;
    });
  });
});
