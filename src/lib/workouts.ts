import {
  RACES,
  STRATEGIES,
  UNIT_LABELS,
  formatDistance,
  formatTime,
  generatePlan,
  manualPlan,
  segmentDistances,
  toUnits,
} from "./pace";
import { raceMeters, sanitizeState, type PlanState } from "./planState";

export interface SavedWorkout {
  id: string;
  name: string;
  savedAt: number;
  state: PlanState;
}

export const MAX_SAVED_WORKOUTS = 12;
const META_KEY = "workouts";

export function readWorkouts(metadata: Record<string, unknown> | null | undefined): SavedWorkout[] {
  const raw = metadata?.[META_KEY];
  if (!Array.isArray(raw)) return [];
  const workouts: SavedWorkout[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim().slice(0, 80) : "";
    const id = typeof record.id === "string" ? record.id : "";
    if (!name || !id) continue;
    workouts.push({
      id,
      name,
      savedAt: typeof record.savedAt === "number" ? record.savedAt : 0,
      state: sanitizeState(record.state),
    });
    if (workouts.length === MAX_SAVED_WORKOUTS) break;
  }
  return workouts;
}

export function planFor(state: PlanState) {
  const totalUnits = toUnits(raceMeters(state), state.unit);
  const goalSeconds = state.goalType === "finish" ? state.finishSeconds : state.targetPace * totalUnits;
  const fallbackPace = totalUnits > 0 && goalSeconds > 0 ? goalSeconds / totalUnits : state.targetPace;
  const rows = segmentDistances(totalUnits).length;
  const manualPaces = Array.from({ length: rows }, (_, index) => state.manualPaces[index] ?? fallbackPace);
  const plan =
    state.planMode === "manual"
      ? manualPlan(totalUnits, manualPaces)
      : generatePlan({
          totalUnits,
          goalSeconds,
          strategy: state.strategy,
          strength: state.strength,
          holdUnits: state.holdUnits,
          warmUpSeconds: state.warmUpEnabled ? state.warmUpSeconds : undefined,
        });
  return { plan, totalUnits };
}

export function savedRunPreview(state: PlanState) {
  const distance =
    state.race === "none"
      ? "No distance"
      : state.race === "custom"
        ? `${formatDistance(state.customDistance)} ${UNIT_LABELS[state.customUnit].short}`
        : RACES.find((race) => race.id === state.race)!.name;
  const strategy = state.planMode === "manual" ? "Custom" : STRATEGIES.find((item) => item.id === state.strategy)!.name;
  const { plan, totalUnits } = planFor(state);
  const finalTime = plan.at(-1)?.elapsed ?? 0;
  const average = totalUnits > 0 ? finalTime / totalUnits : 0;
  return {
    distance,
    strategy,
    averagePace: plan.length ? `${formatTime(average)} /${UNIT_LABELS[state.unit].short}` : "–",
    totalTime: plan.length ? formatTime(finalTime, true) : "–",
  };
}

export function replaceWorkout(workouts: SavedWorkout[], id: string, state: PlanState): SavedWorkout[] {
  if (!workouts.some((workout) => workout.id === id)) return workouts;
  return workouts.map((workout) => (workout.id === id ? { ...workout, state, savedAt: Date.now() } : workout));
}

export function renameWorkout(workouts: SavedWorkout[], id: string, name: string): SavedWorkout[] {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return workouts;
  return workouts.map((workout) => (workout.id === id ? { ...workout, name: trimmed } : workout));
}

export function deleteWorkout(workouts: SavedWorkout[], id: string): SavedWorkout[] {
  return workouts.filter((workout) => workout.id !== id);
}

export function withWorkouts(
  metadata: Record<string, unknown> | null | undefined,
  workouts: SavedWorkout[],
): Record<string, unknown> {
  return { ...(metadata ?? {}), [META_KEY]: workouts.slice(0, MAX_SAVED_WORKOUTS) };
}
