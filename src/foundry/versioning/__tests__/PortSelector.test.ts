import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PortSelector } from "../portselector";
import { getFoundryVersion } from "../versiondetector";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

vi.mock("../versiondetector", () => ({
  getFoundryVersion: vi.fn(),
}));

describe("PortSelector", () => {
  let selector: PortSelector;

  beforeEach(() => {
    selector = new PortSelector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("selectPort", () => {
    it("should select highest compatible port version", () => {
      const ports = new Map([
        [13, "port-v13"],
        [14, "port-v14"],
        [15, "port-v15"],
      ]);

      vi.mocked(getFoundryVersion).mockReturnValue(14);

      const result = selector.selectPort(ports);
      expectResultOk(result);
      expect(result.value).toBe("port-v14");
    });

    it("should fallback to lower version when exact match not available", () => {
      const ports = new Map([
        [13, "port-v13"],
        [15, "port-v15"],
      ]);

      vi.mocked(getFoundryVersion).mockReturnValue(14);

      const result = selector.selectPort(ports);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
    });

    it("should ignore ports with version higher than Foundry version", () => {
      const ports = new Map([
        [13, "port-v13"],
        [15, "port-v15"],
      ]);

      vi.mocked(getFoundryVersion).mockReturnValue(13);

      const result = selector.selectPort(ports);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
    });

    it("should fail when no compatible port available", () => {
      const ports = new Map([
        [14, "port-v14"],
        [15, "port-v15"],
      ]);

      vi.mocked(getFoundryVersion).mockReturnValue(13);

      const result = selector.selectPort(ports);
      expectResultErr(result);
      expect(result.error).toContain("No compatible port found");
      expect(result.error).toContain("13");
    });

    it("should use provided foundryVersion parameter", () => {
      const ports = new Map([
        [13, "port-v13"],
        [14, "port-v14"],
      ]);

      const result = selector.selectPort(ports, 14);
      expectResultOk(result);
      expect(result.value).toBe("port-v14");
      expect(getFoundryVersion).not.toHaveBeenCalled();
    });

    it("should detect Foundry version when not provided", () => {
      const ports = new Map([[13, "port-v13"]]);

      vi.mocked(getFoundryVersion).mockReturnValue(13);

      const result = selector.selectPort(ports);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      expect(getFoundryVersion).toHaveBeenCalled();
    });

    it("should handle version detection errors", () => {
      const ports = new Map([[13, "port-v13"]]);

      vi.mocked(getFoundryVersion).mockImplementation(() => {
        throw new Error("Version detection failed");
      });

      const result = selector.selectPort(ports);
      expectResultErr(result);
      expect(result.error).toContain("Could not determine Foundry version");
    });

    it("should select exact version match when available", () => {
      const ports = new Map([
        [12, "port-v12"],
        [13, "port-v13"],
        [14, "port-v14"],
      ]);

      const result = selector.selectPort(ports, 13);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
    });

    it("should handle empty ports map", () => {
      const ports = new Map<number, string>();

      const result = selector.selectPort(ports, 13);
      expectResultErr(result);
      expect(result.error).toContain("No compatible port found");
      expect(result.error).toContain("none");
    });
  });
});
