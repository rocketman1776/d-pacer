import { Decoder, Stream } from "@garmin/fitsdk";
import { describe, expect, it } from "vitest";
import { fitFileName, speedRange, workoutFitFile, workoutSteps } from "./fitWorkout";
import { generatePlan } from "./pace";
import { DEFAULT_STATE } from "./planState";

function decode(bytes: Uint8Array) {
  const decoder = new Decoder(Stream.fromByteArray(bytes));
  expect(decoder.checkIntegrity()).toBe(true);
  const { messages, errors } = decoder.read();
  expect(errors).toEqual([]);
  return messages;
}

describe("workoutSteps", () => {
  it("merges an even plan into one step", () => {
    const plan = generatePlan({ totalUnits: 3.1, goalSeconds: 1860, strategy: "even", strength: 5, holdUnits: 2 });
    const steps = workoutSteps(plan);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.endUnits).toBeCloseTo(3.1);
    expect(steps[0]?.elapsed).toBeCloseTo(1860);
  });

  it("keeps one step per split when the pace changes", () => {
    const plan = generatePlan({ totalUnits: 5, goalSeconds: 2500, strategy: "negative", strength: 6, holdUnits: 2 });
    expect(workoutSteps(plan)).toHaveLength(5);
  });
});

describe("speedRange", () => {
  it("matches the ±30 s window Garmin Connect writes for a 10:00 mile", () => {
    expect(speedRange(600, "mi", 30)).toEqual({ low: 2555, high: 2824 });
  });
});

describe("workoutFitFile", () => {
  it("writes a valid workout with distance steps and speed targets", () => {
    const state = { ...DEFAULT_STATE, race: "5k" as const, unit: "km" as const, finishSeconds: 25 * 60, strategy: "negative" as const };
    const { bytes, fileName } = workoutFitFile("Park 5K", state, new Date("2026-10-14T12:00:00Z"));
    const messages = decode(bytes);

    expect(fileName).toBe("park-5k.fit");
    expect(messages.fileIdMesgs?.[0]?.type).toBe("workout");
    expect(messages.workoutMesgs?.[0]?.wktName).toBe("Park 5K");
    expect(messages.workoutMesgs?.[0]?.sport).toBe("running");

    const steps = messages.workoutStepMesgs ?? [];
    expect(steps).toHaveLength(5);
    expect(messages.workoutMesgs?.[0]?.numValidSteps).toBe(5);
    for (const step of steps) {
      expect(step.durationType).toBe("distance");
      expect(step.durationDistance).toBeCloseTo(1000);
      expect(step.targetType).toBe("speed");
      expect(step.customTargetSpeedLow).toBeLessThan(step.customTargetSpeedHigh as number);
    }
    const total = steps.reduce((sum, step) => sum + (step.durationDistance as number), 0);
    expect(total).toBeCloseTo(5000);
  });

  it("gives a half marathon's last 0.1 mile its own step", () => {
    const state = { ...DEFAULT_STATE, race: "half" as const, finishSeconds: 2 * 3600, strategy: "positive" as const };
    const steps = decode(workoutFitFile("Half", state).bytes).workoutStepMesgs;
    expect(steps?.at(-1)?.durationDistance).toBeCloseTo(0.1094 * 1609.344, 0);
  });

  it("refuses a plan with no splits", () => {
    expect(() => workoutFitFile("Empty", DEFAULT_STATE)).toThrow();
  });
});

describe("fitFileName", () => {
  it("makes a safe file name", () => {
    expect(fitFileName("  Sun Long Run / 10mi!  ")).toBe("sun-long-run-10mi.fit");
    expect(fitFileName("🏃")).toBe("run.fit");
  });
});
