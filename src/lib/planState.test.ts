import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, decodeState, encodeState, raceMeters, sanitizeState, syncGoal, type PlanState } from "./planState";
import { formatTime, toUnits } from "./pace";

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

  it("keeps the split unit separate from a custom distance", () => {
    const state = sanitizeState({ ...DEFAULT_STATE, race: "custom", customUnit: "km", unit: "mi" });
    expect(state.customUnit).toBe("km");
    expect(state.unit).toBe("mi");
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

describe("syncGoal", () => {
  it("turns the average pace into the matching finish time", () => {
    const state: PlanState = { ...DEFAULT_STATE, race: "half", goalType: "pace", targetPace: 8 * 60 };
    const synced = syncGoal(state, "finish");
    const units = toUnits(raceMeters(state), "mi");
    expect(synced.finishSeconds).toBe(Math.round(8 * 60 * units));
    expect(formatTime(synced.finishSeconds, true)).toBe(formatTime(state.targetPace * units, true));
    expect(synced.targetPace).toBe(state.targetPace);
  });

  it("turns the finish time into the matching average pace", () => {
    const state: PlanState = { ...DEFAULT_STATE, race: "half", goalType: "finish", finishSeconds: 1 * 3600 + 50 * 60 };
    const synced = syncGoal(state, "pace");
    const units = toUnits(raceMeters(state), "mi");
    expect(synced.targetPace).toBe(Math.round(state.finishSeconds / units));
    expect(formatTime(synced.targetPace)).toBe(formatTime(state.finishSeconds / units));
  });
});

describe("raceMeters", () => {
  it("keeps a custom distance of at least 1", () => {
    expect(sanitizeState({ race: "custom", customDistance: 0.4 }).customDistance).toBe(1);
    expect(sanitizeState({ race: "custom", customDistance: 1 }).customDistance).toBe(1);
  });

  it("uses the custom unit for custom distances", () => {
    expect(raceMeters({ race: "custom", customDistance: 10, customUnit: "km" })).toBe(10000);
    expect(raceMeters({ race: "half", customDistance: 10, customUnit: "km" })).toBe(21097.5);
  });
});
