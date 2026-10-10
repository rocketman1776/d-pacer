import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, decodeState, encodeState, raceMeters, sanitizeState, type PlanState } from "./planState";

describe("sanitizeState", () => {
  it("falls back to defaults for garbage input", () => {
    expect(sanitizeState(null)).toEqual(DEFAULT_STATE);
    expect(sanitizeState({ race: "ultra", unit: "furlongs", strength: 99, finishSeconds: -5 })).toEqual(DEFAULT_STATE);
  });

  it("keeps valid values and drops invalid manual paces", () => {
    const state = sanitizeState({ ...DEFAULT_STATE, race: "10k", unit: "km", manualPaces: [300, "x", null, 310.4] });
    expect(state.race).toBe("10k");
    expect(state.unit).toBe("km");
    expect(state.manualPaces).toEqual([300, null, null, 310]);
  });
});

describe("share links", () => {
  it("round-trips a generated plan", () => {
    const state: PlanState = { ...DEFAULT_STATE, race: "marathon", strategy: "progression", holdUnits: 4, strength: 7 };
    expect(decodeState(encodeState(state))).toEqual({ ...state, manualPaces: [] });
  });

  it("round-trips a custom manual plan with gaps", () => {
    const state: PlanState = {
      ...DEFAULT_STATE,
      race: "custom",
      customDistance: 7.5,
      customUnit: "km",
      unit: "km",
      planMode: "manual",
      goalType: "pace",
      targetPace: 330,
      manualPaces: [320, null, 340],
    };
    const decoded = decodeState(encodeState(state))!;
    expect(decoded.race).toBe("custom");
    expect(decoded.customDistance).toBe(7.5);
    expect(decoded.targetPace).toBe(330);
    expect(decoded.manualPaces).toEqual([320, null, 340]);
  });

  it("round-trips a warm-up mile without changing the goal", () => {
    const state: PlanState = { ...DEFAULT_STATE, warmUpEnabled: true, warmUpSeconds: 630 };
    const decoded = decodeState(encodeState(state))!;
    expect(decoded.warmUpEnabled).toBe(true);
    expect(decoded.warmUpSeconds).toBe(630);
    expect(decoded.finishSeconds).toBe(state.finishSeconds);
    expect(decoded.targetPace).toBe(state.targetPace);
  });

  it("ignores URLs that are not plans", () => {
    expect(decodeState("")).toBeNull();
    expect(decodeState("?utm_source=x")).toBeNull();
  });
});

describe("raceMeters", () => {
  it("uses the custom unit for custom distances", () => {
    expect(raceMeters({ race: "custom", customDistance: 10, customUnit: "km" })).toBe(10000);
    expect(raceMeters({ race: "half", customDistance: 10, customUnit: "km" })).toBe(21097.5);
  });
});
