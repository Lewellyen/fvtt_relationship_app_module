import { describe, it, expect, beforeEach } from "vitest";
import { StateStore } from "../state-store";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("StateStore", () => {
  let store: StateStore;

  beforeEach(() => {
    store = new StateStore();
  });

  describe("set", () => {
    it("should set value for instance and key", () => {
      const result = store.set("instance-1", "count", 5);

      expectResultOk(result);

      const getResult = store.get("instance-1", "count");
      expectResultOk(getResult);
      expect(getResult.value).toBe(5);
    });

    it("should create new instance map if instance does not exist", () => {
      const result = store.set("instance-1", "count", 10);

      expectResultOk(result);

      const getResult = store.get("instance-1", "count");
      expectResultOk(getResult);
      expect(getResult.value).toBe(10);
    });

    it("should overwrite existing value", () => {
      store.set("instance-1", "count", 5);
      const result = store.set("instance-1", "count", 10);

      expectResultOk(result);

      const getResult = store.get("instance-1", "count");
      expectResultOk(getResult);
      expect(getResult.value).toBe(10);
    });

    it("should set multiple keys for same instance", () => {
      store.set("instance-1", "count", 5);
      store.set("instance-1", "name", "test");

      const countResult = store.get("instance-1", "count");
      const nameResult = store.get("instance-1", "name");

      expectResultOk(countResult);
      expectResultOk(nameResult);
      expect(countResult.value).toBe(5);
      expect(nameResult.value).toBe("test");
    });

    it("should set values for different instances independently", () => {
      store.set("instance-1", "count", 5);
      store.set("instance-2", "count", 10);

      const result1 = store.get("instance-1", "count");
      const result2 = store.get("instance-2", "count");

      expectResultOk(result1);
      expectResultOk(result2);
      expect(result1.value).toBe(5);
      expect(result2.value).toBe(10);
    });
  });

  describe("get", () => {
    it("should get value for instance and key", () => {
      store.set("instance-1", "count", 5);

      const result = store.get("instance-1", "count");

      expectResultOk(result);
      expect(result.value).toBe(5);
    });

    it("should return error if instance not found", () => {
      const result = store.get("instance-999", "count");

      expectResultErr(result);
      expect(result.error.code).toBe("InstanceNotFound");
      expect(result.error.message).toContain("Instance instance-999 not found");
    });

    it("should return error if key not found", () => {
      store.set("instance-1", "count", 5);

      const result = store.get("instance-1", "missing-key");

      expectResultErr(result);
      expect(result.error.code).toBe("KeyNotFound");
      expect(result.error.message).toContain("Key missing-key not found");
    });
  });

  describe("getAll", () => {
    it("should return all values for instance", () => {
      store.set("instance-1", "count", 5);
      store.set("instance-1", "name", "test");
      store.set("instance-1", "active", true);

      const result = store.getAll("instance-1");

      expectResultOk(result);
      expect(result.value).toEqual({
        count: 5,
        name: "test",
        active: true,
      });
    });

    it("should return empty object if instance not found", () => {
      const result = store.getAll("instance-999");

      expectResultOk(result);
      expect(result.value).toEqual({});
    });

    it("should return empty object if instance has no keys", () => {
      // Create instance by setting a value and then clearing
      store.set("instance-1", "temp", "value");
      store.clear("instance-1");

      const result = store.getAll("instance-1");

      expectResultOk(result);
      expect(result.value).toEqual({});
    });
  });

  describe("clear", () => {
    it("should remove instance from store", () => {
      store.set("instance-1", "count", 5);
      store.set("instance-1", "name", "test");

      const result = store.clear("instance-1");

      expectResultOk(result);

      const getResult = store.get("instance-1", "count");
      expectResultErr(getResult);
      expect(getResult.error.code).toBe("InstanceNotFound");
    });

    it("should return success even if instance does not exist", () => {
      const result = store.clear("instance-999");

      expectResultOk(result);
    });

    it("should not affect other instances", () => {
      store.set("instance-1", "count", 5);
      store.set("instance-2", "count", 10);

      store.clear("instance-1");

      const result1 = store.get("instance-1", "count");
      const result2 = store.get("instance-2", "count");

      expectResultErr(result1);
      expectResultOk(result2);
      expect(result2.value).toBe(10);
    });
  });
});
