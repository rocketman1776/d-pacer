import { sanitizeState, type PlanState } from "./planState";

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

export function withWorkouts(
  metadata: Record<string, unknown> | null | undefined,
  workouts: SavedWorkout[],
): Record<string, unknown> {
  return { ...(metadata ?? {}), [META_KEY]: workouts.slice(0, MAX_SAVED_WORKOUTS) };
}
