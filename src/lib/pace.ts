export type Unit = "mi" | "km";
export type Strategy = "even" | "negative" | "positive" | "progression";

export const UNIT_METERS: Record<Unit, number> = { mi: 1609.344, km: 1000 };

export const UNIT_LABELS: Record<Unit, { short: string; singular: string; plural: string }> = {
  mi: { short: "mi", singular: "mile", plural: "miles" },
  km: { short: "km", singular: "km", plural: "km" },
};

export const RACES = [
  { id: "5k", name: "5K", meters: 5000 },
  { id: "10k", name: "10K", meters: 10000 },
  { id: "half", name: "Half marathon", meters: 21097.5 },
  { id: "marathon", name: "Marathon", meters: 42195 },
] as const;

export type RaceId = (typeof RACES)[number]["id"];

export const STRATEGIES: { id: Strategy; name: string; description: string }[] = [
  { id: "even", name: "Even pace", description: "Hold one steady effort" },
  { id: "positive", name: "Positive split", description: "Start faster, ease later" },
  { id: "negative", name: "Negative split", description: "Finish faster than you start" },
  { id: "progression", name: "Progression", description: "Increase pace in stages" },
];

export const MIN_DISTANCE = 1;
export const MAX_DISTANCE = 200;
export const MIN_STRENGTH = 2;
export const MAX_STRENGTH = 12;

// Floating-point unit conversions can leave e.g. 3.0000000000000004 miles,
// which would otherwise produce an extra near-zero segment.
const EPSILON = 1e-6;

export interface Split {
  index: number;
  /** Segment length in units; 1 except for a final partial segment. */
  distance: number;
  /** Seconds per unit. */
  pace: number;
  /** Cumulative seconds at the end of the segment. */
  elapsed: number;
  /** Rolling average seconds per unit. */
  average: number;
}

export function toUnits(meters: number, unit: Unit) {
  return meters / UNIT_METERS[unit];
}

export function convertPace(secondsPerUnit: number, from: Unit, to: Unit) {
  return (secondsPerUnit * UNIT_METERS[to]) / UNIT_METERS[from];
}

export function segmentDistances(totalUnits: number): number[] {
  if (!(totalUnits > EPSILON)) return [];
  const rows = Math.ceil(totalUnits - EPSILON);
  return Array.from({ length: rows }, (_, index) => Math.min(1, totalUnits - index));
}

/** One mile or kilometer is two half splits, except even pace, which stays one segment. */
function planDistances(totalUnits: number, strategy: Strategy): number[] {
  if (strategy !== "even" && Math.abs(totalUnits - 1) <= 0.001) return [0.5, 0.5];
  return segmentDistances(totalUnits);
}

export function maxHoldUnits(totalUnits: number) {
  return Math.max(1, Math.floor(totalUnits / 2));
}

function paceFactor(strategy: Strategy, index: number, rows: number, hold: number, intensity: number) {
  const progress = rows === 1 ? 0.5 : index / (rows - 1);
  if (strategy === "negative") return 1 + (0.5 - progress) * 2 * intensity;
  if (strategy === "positive") return 1 - (0.5 - progress) * 2 * intensity;
  if (strategy === "progression") {
    const group = Math.floor(index / hold);
    const groups = Math.max(1, Math.ceil(rows / hold) - 1);
    return 1 + (0.5 - group / groups) * 2 * intensity;
  }
  return 1;
}

function accumulate(distances: number[], paces: number[]): Split[] {
  let elapsed = 0;
  let covered = 0;
  return distances.map((distance, index) => {
    const pace = paces[index];
    elapsed += pace * distance;
    covered += distance;
    return { index, distance, pace, elapsed, average: elapsed / covered };
  });
}

/** Longest warm-up, in seconds, that still leaves a runnable pace for the rest of the race. */
export function maxWarmUpSeconds(totalUnits: number, goalSeconds: number) {
  if (!(totalUnits > 1 + EPSILON) || !(goalSeconds > 0)) return 0;
  return Math.max(0, Math.floor(goalSeconds - (totalUnits - 1)));
}

export function generatePlan({
  totalUnits,
  goalSeconds,
  strategy,
  strength,
  holdUnits,
  warmUpSeconds,
}: {
  totalUnits: number;
  goalSeconds: number;
  strategy: Strategy;
  /** Percent difference between the first and last segment, e.g. 5. */
  strength: number;
  holdUnits: number;
  /** Seconds for the first full unit. Omitted when the warm-up mile is off. */
  warmUpSeconds?: number;
}): Split[] {
  const distances = planDistances(totalUnits, strategy);
  if (distances.length === 0 || !(goalSeconds > 0)) return [];

  const intensity = strength / 100;
  const hold = Math.max(1, Math.min(holdUnits, maxHoldUnits(totalUnits)));
  const warmUpDistance = distances[0];
  const warmUpLimit = maxWarmUpSeconds(totalUnits, goalSeconds);
  const useWarmUp =
    warmUpSeconds != null && warmUpSeconds > 0 && warmUpLimit > 0 && warmUpDistance >= 1 - EPSILON;

  const lockedTime = useWarmUp ? Math.min(warmUpSeconds * warmUpDistance, warmUpLimit) : 0;
  const freeDistances = useWarmUp ? distances.slice(1) : distances;
  const freeUnits = totalUnits - (useWarmUp ? warmUpDistance : 0);
  const freeGoal = goalSeconds - lockedTime;
  const factors = freeDistances.map((_, index) => paceFactor(strategy, index, freeDistances.length, hold, intensity));

  // Normalise so the distance-weighted average pace hits the goal exactly.
  const weightedAverage =
    factors.reduce((sum, factor, index) => sum + factor * freeDistances[index], 0) / freeUnits;
  const averagePace = freeGoal / freeUnits;
  const freePaces = factors.map((factor) => (averagePace * factor) / weightedAverage);
  const paces = useWarmUp ? [lockedTime / warmUpDistance, ...freePaces] : freePaces;

  return accumulate(distances, paces);
}

export function manualPlan(totalUnits: number, paces: number[]): Split[] {
  const distances = segmentDistances(totalUnits);
  return accumulate(
    distances,
    distances.map((_, index) => paces[index] ?? 0),
  );
}

/** Elapsed seconds at an arbitrary distance along the plan (linear within a segment). */
export function elapsedAt(plan: Split[], units: number) {
  let covered = 0;
  let elapsed = 0;
  for (const split of plan) {
    if (units <= covered + split.distance + EPSILON) {
      return elapsed + split.pace * Math.max(0, units - covered);
    }
    covered += split.distance;
    elapsed = split.elapsed;
  }
  return elapsed;
}

export interface Checkpoint {
  label: string;
  /** Distance in the display unit. */
  units: number;
  elapsed: number;
}

const NAMED_CHECKPOINTS = [{ label: "Half marathon", meters: 21097.5 }];

export function checkpoints(plan: Split[], totalMeters: number, unit: Unit): Checkpoint[] {
  if (plan.length === 0) return [];

  const points: { label: string; meters: number }[] = [];
  for (let meters = 5000; meters < totalMeters - 1; meters += 5000) {
    points.push({ label: `${meters / 1000}K`, meters });
  }
  for (const checkpoint of NAMED_CHECKPOINTS) {
    if (checkpoint.meters < totalMeters - 1) points.push({ ...checkpoint });
  }

  const halfway = totalMeters / 2;
  const sameAsHalfway = points.find(({ meters }) => Math.abs(meters - halfway) < 50);
  if (sameAsHalfway) {
    sameAsHalfway.label = `${sameAsHalfway.label} · halfway`;
  } else {
    points.push({ label: "Halfway", meters: halfway });
  }

  return points
    .sort((a, b) => a.meters - b.meters)
    .map(({ label, meters }) => {
      const units = toUnits(meters, unit);
      return { label, units, elapsed: elapsedAt(plan, units) };
    });
}

/**
 * Carry manual paces across a unit or distance change: each new segment takes the
 * pace of the old segment covering its midpoint, converted to the new unit.
 */
export function resamplePaces(
  paces: (number | null)[],
  fromUnit: Unit,
  toUnit: Unit,
  totalMeters: number,
): (number | null)[] {
  const distances = segmentDistances(toUnits(totalMeters, toUnit));
  return distances.map((distance, index) => {
    const midpointMeters = (index + distance / 2) * UNIT_METERS[toUnit];
    const oldIndex = Math.floor(midpointMeters / UNIT_METERS[fromUnit]);
    const old = paces[Math.min(oldIndex, paces.length - 1)];
    return old == null ? null : Math.round(convertPace(old, fromUnit, toUnit));
  });
}

export function formatTime(totalSeconds: number, forceHours = false) {
  const rounded = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours || forceHours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Signed difference against a goal, e.g. "+1:12" or "−0:30". */
export function formatDelta(seconds: number) {
  const rounded = Math.round(seconds);
  if (rounded === 0) return "On goal";
  return `${rounded > 0 ? "+" : "−"}${formatTime(Math.abs(rounded))}`;
}

export function formatDistance(units: number) {
  return Number.isInteger(Math.round(units * 100) / 100)
    ? String(Math.round(units))
    : (Math.round(units * 10) / 10).toFixed(1);
}
