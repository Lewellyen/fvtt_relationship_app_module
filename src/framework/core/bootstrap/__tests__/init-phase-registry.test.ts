import { describe, it, expect } from "vitest";
import { InitPhaseRegistry } from "../init-phase-registry";
import type { InitPhase } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { ok } from "@/domain/utils/result";

describe("InitPhaseRegistry", () => {
  const createMockPhase = (id: string, priority: number): InitPhase => ({
    id,
    priority,
    criticality: InitPhaseCriticality.WARN_AND_CONTINUE,
    execute: () => ok(undefined),
  });

  it("should sort phases by priority ascending", () => {
    const phase1 = createMockPhase("phase-1", 3);
    const phase2 = createMockPhase("phase-2", 1);
    const phase3 = createMockPhase("phase-3", 2);

    const registry = new InitPhaseRegistry([phase1, phase2, phase3]);
    const phases = registry.getAll();

    expect(phases).toHaveLength(3);
    expect(phases[0]!.id).toBe("phase-2");
    expect(phases[1]!.id).toBe("phase-3");
    expect(phases[2]!.id).toBe("phase-1");
  });

  it("should return empty array when no phases provided", () => {
    const registry = new InitPhaseRegistry();
    const phases = registry.getAll();

    expect(phases).toHaveLength(0);
  });

  it("should return a copy of phases array", () => {
    const phase = createMockPhase("phase-1", 1);
    const registry = new InitPhaseRegistry([phase]);
    const phases1 = registry.getAll();
    const phases2 = registry.getAll();

    expect(phases1).not.toBe(phases2);
    expect(phases1).toEqual(phases2);
  });

  it("should add phase and re-sort", () => {
    const phase1 = createMockPhase("phase-1", 1);
    const phase2 = createMockPhase("phase-2", 3);
    const registry = new InitPhaseRegistry([phase1, phase2]);

    const phase3 = createMockPhase("phase-3", 2);
    registry.add(phase3);

    const phases = registry.getAll();
    expect(phases).toHaveLength(3);
    expect(phases[0]!.id).toBe("phase-1");
    expect(phases[1]!.id).toBe("phase-3");
    expect(phases[2]!.id).toBe("phase-2");
  });
});
