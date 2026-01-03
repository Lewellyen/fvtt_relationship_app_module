import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RemoteSyncGate } from "../remote-sync-gate";

describe("RemoteSyncGate", () => {
  let syncGate: RemoteSyncGate;

  beforeEach(() => {
    // Mock game.userId
    (globalThis as { game?: { userId?: string } }).game = {
      userId: "test-user-123",
    };
  });

  afterEach(() => {
    delete (globalThis as { game?: unknown }).game;
  });

  describe("constructor", () => {
    it("should use game.userId as clientId when available", () => {
      syncGate = new RemoteSyncGate();

      expect(syncGate.getClientId()).toBe("test-user-123");
    });

    it("should generate clientId when game is not available", () => {
      delete (globalThis as { game?: unknown }).game;

      syncGate = new RemoteSyncGate();

      const clientId = syncGate.getClientId();
      expect(clientId).toMatch(/^client-\d+$/);
    });

    it("should generate clientId when game.userId is not available", () => {
      (globalThis as { game?: { userId?: string } }).game = {};

      syncGate = new RemoteSyncGate();

      const clientId = syncGate.getClientId();
      expect(clientId).toMatch(/^client-\d+$/);
    });
  });

  describe("makePersistMeta", () => {
    beforeEach(() => {
      syncGate = new RemoteSyncGate();
    });

    it("should create persist meta with clientId and instanceId", () => {
      const meta = syncGate.makePersistMeta("instance-1");

      expect(meta.originClientId).toBe("test-user-123");
      expect(meta.originWindowInstanceId).toBe("instance-1");
      expect(meta.render).toBe(false);
    });

    it("should set render to false", () => {
      const meta = syncGate.makePersistMeta("instance-1");

      expect(meta.render).toBe(false);
    });
  });

  describe("isFromWindow", () => {
    beforeEach(() => {
      syncGate = new RemoteSyncGate();
    });

    it("should return false if options is undefined", () => {
      const result = syncGate.isFromWindow(undefined, "instance-1");

      expect(result).toBe(false);
    });

    it("should return false if options is null", () => {
      const result = syncGate.isFromWindow(null as unknown as undefined, "instance-1");

      expect(result).toBe(false);
    });

    it("should return false if options does not contain windowFrameworkOrigin", () => {
      const options = {};

      const result = syncGate.isFromWindow(options, "instance-1");

      expect(result).toBe(false);
    });

    it("should return false if meta.originWindowInstanceId does not match", () => {
      const options = {
        windowFrameworkOrigin: {
          originClientId: "test-user-123",
          originWindowInstanceId: "instance-2",
          render: false,
        },
      };

      const result = syncGate.isFromWindow(options, "instance-1");

      expect(result).toBe(false);
    });

    it("should return true if meta.originWindowInstanceId matches", () => {
      const options = {
        windowFrameworkOrigin: {
          originClientId: "test-user-123",
          originWindowInstanceId: "instance-1",
          render: false,
        },
      };

      const result = syncGate.isFromWindow(options, "instance-1");

      expect(result).toBe(true);
    });

    it("should return false if meta is not an object", () => {
      const options = {
        windowFrameworkOrigin: "invalid",
      };

      const result = syncGate.isFromWindow(options, "instance-1");

      expect(result).toBe(false);
    });
  });

  describe("getClientId", () => {
    it("should return clientId from constructor", () => {
      syncGate = new RemoteSyncGate();

      const clientId = syncGate.getClientId();

      expect(clientId).toBe("test-user-123");
    });

    it("should return generated clientId when game is not available", () => {
      delete (globalThis as { game?: unknown }).game;
      syncGate = new RemoteSyncGate();

      const clientId = syncGate.getClientId();

      expect(clientId).toMatch(/^client-\d+$/);
    });
  });
});
