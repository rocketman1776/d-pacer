import { Encoder, Profile, type FileIdMesg, type WorkoutMesg, type WorkoutStepMesg } from "@garmin/fitsdk";
import { STRATEGIES, UNIT_METERS, formatDistance, formatTime, type Split, type Unit } from "./pace";
import { planFor } from "./workouts";
import type { PlanState } from "./planState";

/** Seconds per unit on either side of each split's pace for the watch's pace alert. */
export const PACE_WINDOW_SECONDS = 10;
export const MAX_WORKOUT_STEPS = 50;
const MAX_NAME_LENGTH = 40;

export interface WorkoutStep {
  startUnits: number;
  endUnits: number;
  /** Seconds per unit. */
  pace: number;
  /** Cumulative seconds at the end of the step. */
  elapsed: number;
}

/** Back-to-back splits that round to the same pace become one step. */
export function workoutSteps(plan: Split[]): WorkoutStep[] {
  const steps: (WorkoutStep & { startElapsed: number })[] = [];
  let covered = 0;
  let elapsed = 0;
  for (const split of plan) {
    const end = covered + split.distance;
    const last = steps.at(-1);
    if (last && Math.round(last.pace) === Math.round(split.pace)) {
      last.endUnits = end;
      last.elapsed = split.elapsed;
      last.pace = (split.elapsed - last.startElapsed) / (end - last.startUnits);
    } else {
      steps.push({ startUnits: covered, endUnits: end, pace: split.pace, elapsed: split.elapsed, startElapsed: elapsed });
    }
    covered = end;
    elapsed = split.elapsed;
  }
  return steps.map(({ startElapsed: _, ...step }) => step);
}

/** Speed range in mm/s, slow end first, for a pace in seconds per unit. */
export function speedRange(pace: number, unit: Unit, windowSeconds = PACE_WINDOW_SECONDS) {
  const meters = UNIT_METERS[unit];
  const fastPace = Math.max(pace - windowSeconds, pace / 2);
  return {
    low: Math.ceil((meters / (pace + windowSeconds)) * 1000),
    high: Math.ceil((meters / fastPace) * 1000),
  };
}

export function fitFileName(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, MAX_NAME_LENGTH)
    .replace(/-+$/, "")
    .toLowerCase();
  return `${slug || "run"}.fit`;
}

/** Garmin structured workout: one distance step per pace, each with a speed target. */
export function workoutFitFile(name: string, state: PlanState, createdAt = new Date()) {
  const { plan } = planFor(state);
  if (!plan.length) throw new Error("This run has no splits to export.");

  const steps = workoutSteps(plan);
  if (steps.length > MAX_WORKOUT_STEPS) {
    throw new Error(`This run has ${steps.length} different paces. Garmin workouts allow up to ${MAX_WORKOUT_STEPS}.`);
  }

  const unit = state.unit;
  const meters = UNIT_METERS[unit];
  const strategy =
    state.planMode === "manual" ? "Custom splits" : STRATEGIES.find((item) => item.id === state.strategy)!.name;
  const finish = plan.at(-1)!.elapsed;
  const serial = crypto.getRandomValues(new Uint32Array(1))[0] || 1;

  const encoder = new Encoder();
  const fileId: FileIdMesg = {
    type: "workout",
    manufacturer: "development",
    product: 0,
    serialNumber: serial,
    timeCreated: createdAt,
  };
  const workout: WorkoutMesg = {
    wktName: name.trim().slice(0, MAX_NAME_LENGTH) || "dpacer run",
    wktDescription: `${strategy} · finish ${formatTime(finish)}`,
    sport: "running",
    subSport: "generic",
    numValidSteps: steps.length,
  };
  encoder.onMesg(Profile.MesgNum.FILE_ID, fileId);
  encoder.onMesg(Profile.MesgNum.WORKOUT, workout);
  steps.forEach((step, index) => {
    const isLast = index === steps.length - 1;
    const { low, high } = speedRange(step.pace, unit);
    const workoutStep: WorkoutStepMesg = {
      messageIndex: index,
      wktStepName: `${formatDistance(step.startUnits)}-${formatDistance(step.endUnits)} ${unit}`,
      notes: `${formatTime(step.pace)}/${unit}, ${isLast ? "finish" : "through"} ${formatTime(step.elapsed)}`,
      intensity: "active",
      durationType: "distance",
      durationValue: Math.round((step.endUnits - step.startUnits) * meters * 100),
      targetType: "speed",
      targetValue: 0,
      customTargetValueLow: low,
      customTargetValueHigh: high,
    };
    encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, workoutStep);
  });

  return { bytes: encoder.close(), fileName: fitFileName(name) };
}
