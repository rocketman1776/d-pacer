import { storageKey } from "./channel";
import {
  MAX_DISTANCE,
  MAX_STRENGTH,
  MIN_DISTANCE,
  MIN_STRENGTH,
  RACES,
  STRATEGIES,
  UNIT_METERS,
  toUnits,
  type RaceId,
  type Strategy,
  type Unit,
} from "./pace";

export type PlanMode = "generated" | "manual";
export type GoalType = "finish" | "pace";

export interface PlanState {
  race: RaceId | "custom" | "none";
  customDistance: number;
  customUnit: Unit;
  unit: Unit;
  planMode: PlanMode;
  goalType: GoalType;
  /** Goal finish time in seconds. */
  finishSeconds: number;
  /** Goal pace in seconds per display unit. */
  targetPace: number;
  strategy: Strategy;
  strength: number;
  holdUnits: number;
  /** Seconds per display unit; null means "use the goal pace". */
  manualPaces: (number | null)[];
  warmUpEnabled: boolean;
  /** Seconds for the first mile or kilometer when the warm-up is on. */
  warmUpSeconds: number;
}

export const DEFAULT_STATE: PlanState = {
  race: "none",
  customDistance: 15,
  customUnit: "mi",
  unit: "mi",
  planMode: "generated",
  goalType: "finish",
  finishSeconds: 0,
  targetPace: 0,
  strategy: "even",
  strength: 5,
  holdUnits: 2,
  manualPaces: [],
  warmUpEnabled: false,
  warmUpSeconds: 10 * 60,
};

export const MAX_GOAL_SECONDS = 99 * 3600 + 59 * 60 + 59;
export const MAX_PACE_SECONDS = 99 * 60 + 59;

export function raceMeters(state: Pick<PlanState, "race" | "customDistance" | "customUnit">) {
  if (state.race === "none") return 0;
  if (state.race === "custom") return state.customDistance * UNIT_METERS[state.customUnit];
  return RACES.find((race) => race.id === state.race)!.meters;
}

/** Keep finish time and average pace describing the same goal when the tab changes. */
export function syncGoal(state: PlanState, goalType: GoalType): Pick<PlanState, "finishSeconds" | "targetPace"> {
  const units = toUnits(raceMeters(state), state.unit);
  if (!(units > 0)) return { finishSeconds: state.finishSeconds, targetPace: state.targetPace };
  if (goalType === "finish") {
    return {
      finishSeconds: Math.min(MAX_GOAL_SECONDS, Math.round(state.targetPace * units)),
      targetPace: state.targetPace,
    };
  }
  return {
    finishSeconds: state.finishSeconds,
    targetPace: Math.min(MAX_PACE_SECONDS, Math.max(0, Math.round(state.finishSeconds / units))),
  };
}

const isUnit = (value: unknown): value is Unit => value === "mi" || value === "km";
const isRace = (value: unknown): value is PlanState["race"] =>
  value === "custom" || value === "none" || RACES.some((race) => race.id === value);
const isStrategy = (value: unknown): value is Strategy =>
  STRATEGIES.some((strategy) => strategy.id === value);

function numberIn(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number >= min && number <= max
    ? number
    : fallback;
}

/** Coerce untrusted data (localStorage, URL) into a valid PlanState. */
export function sanitizeState(raw: unknown): PlanState {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_STATE;
  return {
    race: isRace(input.race) ? input.race : d.race,
    customDistance: numberIn(input.customDistance, MIN_DISTANCE, MAX_DISTANCE, d.customDistance),
    customUnit: isUnit(input.customUnit) ? input.customUnit : d.customUnit,
    unit: isUnit(input.unit) ? input.unit : d.unit,
    planMode: input.planMode === "manual" ? "manual" : "generated",
    goalType: input.goalType === "pace" ? "pace" : "finish",
    finishSeconds: Math.round(numberIn(input.finishSeconds, 0, MAX_GOAL_SECONDS, d.finishSeconds)),
    targetPace: Math.round(numberIn(input.targetPace, 0, MAX_PACE_SECONDS, d.targetPace)),
    strategy: isStrategy(input.strategy) ? input.strategy : d.strategy,
    strength: Math.round(numberIn(input.strength, MIN_STRENGTH, MAX_STRENGTH, d.strength)),
    holdUnits: Math.round(numberIn(input.holdUnits, 1, MAX_DISTANCE, d.holdUnits)),
    manualPaces: Array.isArray(input.manualPaces)
      ? input.manualPaces
          .slice(0, Math.ceil(MAX_DISTANCE * (UNIT_METERS.mi / UNIT_METERS.km)))
          .map((pace) => {
            const value = numberIn(pace, 1, MAX_PACE_SECONDS, NaN);
            return Number.isNaN(value) ? null : Math.round(value);
          })
      : [],
    warmUpEnabled: input.warmUpEnabled === true || input.warmUpEnabled === "1" || input.warmUpEnabled === "true",
    warmUpSeconds: Math.round(numberIn(input.warmUpSeconds, 1, MAX_PACE_SECONDS, d.warmUpSeconds)),
  };
}

const STORAGE_KEY = storageKey("plan:v2");

export function loadStoredState(): PlanState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? sanitizeState(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export function storeState(state: PlanState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, quota); the plan still works in memory.
  }
}

const PARAM_KEYS = {
  race: "d",
  customDistance: "cd",
  customUnit: "cu",
  unit: "u",
  planMode: "m",
  goalType: "g",
  finishSeconds: "t",
  targetPace: "p",
  strategy: "s",
  strength: "k",
  holdUnits: "h",
  manualPaces: "mp",
  warmUpEnabled: "w",
  warmUpSeconds: "ws",
} as const satisfies Record<keyof PlanState, string>;

export function encodeState(state: PlanState) {
  const params = new URLSearchParams();
  params.set(PARAM_KEYS.race, state.race);
  if (state.race === "custom") {
    params.set(PARAM_KEYS.customDistance, String(state.customDistance));
    params.set(PARAM_KEYS.customUnit, state.customUnit);
  }
  params.set(PARAM_KEYS.unit, state.unit);
  params.set(PARAM_KEYS.planMode, state.planMode);
  params.set(PARAM_KEYS.goalType, state.goalType);
  if (state.goalType === "finish") params.set(PARAM_KEYS.finishSeconds, String(state.finishSeconds));
  else params.set(PARAM_KEYS.targetPace, String(state.targetPace));
  if (state.planMode === "generated") {
    params.set(PARAM_KEYS.strategy, state.strategy);
    params.set(PARAM_KEYS.strength, String(state.strength));
    if (state.strategy === "progression") params.set(PARAM_KEYS.holdUnits, String(state.holdUnits));
    if (state.warmUpEnabled) {
      params.set(PARAM_KEYS.warmUpEnabled, "1");
      params.set(PARAM_KEYS.warmUpSeconds, String(state.warmUpSeconds));
    }
  } else {
    params.set(PARAM_KEYS.manualPaces, state.manualPaces.map((pace) => pace ?? "").join("."));
  }
  return params.toString();
}

/** Returns null when the query string does not describe a plan. */
export function decodeState(search: string): PlanState | null {
  const params = new URLSearchParams(search);
  if (!params.has(PARAM_KEYS.race)) return null;

  const raw: Record<string, unknown> = {};
  for (const [field, key] of Object.entries(PARAM_KEYS)) {
    const value = params.get(key);
    if (value !== null) raw[field] = value;
  }
  if (typeof raw.manualPaces === "string") {
    raw.manualPaces = raw.manualPaces === "" ? [] : raw.manualPaces.split(".");
  }
  return sanitizeState(raw);
}
