import { describe, expect, it } from "vitest";
import {
  checkpoints,
  convertPace,
  elapsedAt,
  formatDelta,
  formatDistance,
  formatTime,
  generatePlan,
  manualPlan,
  resamplePaces,
  segmentDistances,
  toUnits,
  type Strategy,
} from "./pace";

const HALF_MI = toUnits(21097.5, "mi");
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe("segmentDistances", () => {
  it("splits a half marathon into 13 full miles and a partial", () => {
    const distances = segmentDistances(HALF_MI);
    expect(distances).toHaveLength(14);
    expect(distances.slice(0, 13).every((d) => d === 1)).toBe(true);
    expect(distances[13]).toBeCloseTo(0.1094, 3);
  });

  it("does not create a phantom segment from floating-point error", () => {
    expect(segmentDistances(toUnits(3 * 1609.344, "mi"))).toHaveLength(3);
    expect(segmentDistances(toUnits(5000, "km"))).toEqual([1, 1, 1, 1, 1]);
  });

  it("returns no segments for zero or invalid distances", () => {
    expect(segmentDistances(0)).toEqual([]);
    expect(segmentDistances(Number.NaN)).toEqual([]);
  });
});

describe("generatePlan", () => {
  const strategies: Strategy[] = ["even", "negative", "positive", "progression"];

  it.each(strategies)("%s plan finishes exactly on the goal time", (strategy) => {
    const plan = generatePlan({ totalUnits: HALF_MI, goalSeconds: 6600, strategy, strength: 8, holdUnits: 3 });
    expect(plan.at(-1)!.elapsed).toBeCloseTo(6600, 6);
    expect(sum(plan.map((s) => s.distance))).toBeCloseTo(HALF_MI, 9);
  });

  it("even pace holds the goal average on every segment", () => {
    const plan = generatePlan({ totalUnits: 10, goalSeconds: 5000, strategy: "even", strength: 5, holdUnits: 1 });
    expect(plan.every((s) => Math.abs(s.pace - 500) < 1e-9)).toBe(true);
  });

  it("negative split gets faster every mile; positive split gets slower", () => {
    const args = { totalUnits: 10, goalSeconds: 5000, strength: 6, holdUnits: 1 };
    const negative = generatePlan({ ...args, strategy: "negative" }).map((s) => s.pace);
    const positive = generatePlan({ ...args, strategy: "positive" }).map((s) => s.pace);
    for (let i = 1; i < 10; i++) {
      expect(negative[i]).toBeLessThan(negative[i - 1]);
      expect(positive[i]).toBeGreaterThan(positive[i - 1]);
    }
  });

  it("strength sets the spread between first and last segment", () => {
    const plan = generatePlan({ totalUnits: 10, goalSeconds: 5000, strategy: "negative", strength: 5, holdUnits: 1 });
    expect(plan[0].pace / 500).toBeCloseTo(1.05, 6);
    expect(plan[9].pace / 500).toBeCloseTo(0.95, 6);
  });

  it("progression holds each pace for the chosen number of units", () => {
    const plan = generatePlan({ totalUnits: 9, goalSeconds: 4500, strategy: "progression", strength: 6, holdUnits: 3 });
    const paces = plan.map((s) => Math.round(s.pace * 1000));
    expect(new Set(paces.slice(0, 3)).size).toBe(1);
    expect(new Set(paces.slice(3, 6)).size).toBe(1);
    expect(paces[3]).toBeLessThan(paces[0]);
    expect(paces[6]).toBeLessThan(paces[3]);
  });

  it("splits one mile or kilometer in half for positive, negative, and progression", () => {
    for (const strategy of ["negative", "positive", "progression"] as Strategy[]) {
      const plan = generatePlan({ totalUnits: 1, goalSeconds: 600, strategy, strength: 6, holdUnits: 1 });
      expect(plan.map((split) => split.distance)).toEqual([0.5, 0.5]);
      expect(plan.at(-1)!.elapsed).toBeCloseTo(600, 6);
    }
    const negative = generatePlan({ totalUnits: 1, goalSeconds: 600, strategy: "negative", strength: 6, holdUnits: 1 });
    const positive = generatePlan({ totalUnits: 1, goalSeconds: 600, strategy: "positive", strength: 6, holdUnits: 1 });
    expect(negative[1].pace).toBeLessThan(negative[0].pace);
    expect(positive[1].pace).toBeGreaterThan(positive[0].pace);
    const even = generatePlan({ totalUnits: 1, goalSeconds: 600, strategy: "even", strength: 6, holdUnits: 1 });
    expect(even.map((split) => split.distance)).toEqual([1]);
  });

  it("returns an empty plan without a goal", () => {
    expect(generatePlan({ totalUnits: 10, goalSeconds: 0, strategy: "even", strength: 5, holdUnits: 1 })).toEqual([]);
  });

  it.each(strategies)("%s plan still finishes on the goal when the warm-up mile changes", (strategy) => {
    const easy = generatePlan({
      totalUnits: 10,
      goalSeconds: 5000,
      strategy,
      strength: 6,
      holdUnits: 2,
      warmUpSeconds: 560,
    });
    const long = generatePlan({
      totalUnits: 10,
      goalSeconds: 5000,
      strategy,
      strength: 6,
      holdUnits: 2,
      warmUpSeconds: 720,
    });
    expect(easy[0].pace).toBeCloseTo(560, 6);
    expect(long[0].pace).toBeCloseTo(720, 6);
    expect(easy.at(-1)!.elapsed).toBeCloseTo(5000, 6);
    expect(long.at(-1)!.elapsed).toBeCloseTo(5000, 6);
    expect(long[1].pace).toBeLessThan(easy[1].pace);
  });
});

describe("manualPlan", () => {
  it("weights the final partial segment by its length", () => {
    const plan = manualPlan(2.5, [480, 500, 400]);
    expect(plan.map((s) => s.elapsed)).toEqual([480, 980, 1180]);
    expect(plan[2].average).toBeCloseTo(1180 / 2.5, 9);
  });
});

describe("elapsedAt and checkpoints", () => {
  it("interpolates inside a segment", () => {
    const plan = manualPlan(3, [400, 500, 600]);
    expect(elapsedAt(plan, 1.5)).toBe(650);
    expect(elapsedAt(plan, 3)).toBe(1500);
  });

  it("lists the standard checkpoints before the finish and merges halfway with the half", () => {
    const totalMeters = 42195;
    const plan = generatePlan({ totalUnits: toUnits(totalMeters, "mi"), goalSeconds: 14400, strategy: "even", strength: 5, holdUnits: 1 });
    const points = checkpoints(plan, totalMeters, "mi");
    expect(points.map((p) => p.label)).toEqual([
      "5K",
      "10K",
      "15K",
      "20K",
      "Half marathon · halfway",
      "25K",
      "30K",
      "35K",
      "40K",
    ]);
    expect(points[4].elapsed).toBeCloseTo(7200, 6);
  });

  it("includes 20K before the finish of a half marathon", () => {
    const totalMeters = 21097.5;
    const plan = generatePlan({ totalUnits: toUnits(totalMeters, "mi"), goalSeconds: 7200, strategy: "even", strength: 5, holdUnits: 1 });
    expect(checkpoints(plan, totalMeters, "mi").map((point) => point.label)).toEqual(["5K", "10K", "Halfway", "15K", "20K"]);
  });

  it("adds a halfway point when no standard distance matches it", () => {
    const plan = manualPlan(toUnits(10000, "km"), Array(10).fill(300));
    expect(checkpoints(plan, 10000, "km").map((p) => p.label)).toEqual(["5K · halfway"]);
  });
});

describe("unit conversion", () => {
  it("converts pace between miles and kilometers", () => {
    expect(convertPace(480, "mi", "km")).toBeCloseTo(298.26, 2);
    expect(convertPace(convertPace(480, "mi", "km"), "km", "mi")).toBeCloseTo(480, 9);
  });

  it("resamples manual mile paces into kilometer paces", () => {
    const paces = resamplePaces([480, 540, 600, null], "mi", "km", 5000);
    expect(paces).toHaveLength(5);
    expect(paces[0]).toBe(Math.round(convertPace(480, "mi", "km")));
    expect(paces[2]).toBe(Math.round(convertPace(540, "mi", "km")));
    expect(paces[4]).toBe(Math.round(convertPace(600, "mi", "km")));
  });
});

describe("formatting", () => {
  it("formats times with and without hours", () => {
    expect(formatTime(504)).toBe("8:24");
    expect(formatTime(6600, true)).toBe("1:50:00");
    expect(formatTime(59.6)).toBe("1:00");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });

  it("formats signed deltas", () => {
    expect(formatDelta(72)).toBe("+1:12");
    expect(formatDelta(-30)).toBe("−0:30");
    expect(formatDelta(0.3)).toBe("On goal");
  });

  it("formats race distances", () => {
    expect(formatDistance(toUnits(21097.5, "mi"))).toBe("13.1");
    expect(formatDistance(5)).toBe("5");
  });
});
