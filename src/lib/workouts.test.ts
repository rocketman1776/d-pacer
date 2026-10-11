import { describe, expect, it } from "vitest";
import { DEFAULT_STATE } from "./planState";
import { deleteWorkout, readWorkouts, renameWorkout, replaceWorkout, savedRunPreview, withWorkouts } from "./workouts";

describe("readWorkouts", () => {
  it("keeps named workouts and drops garbage", () => {
    const workouts = readWorkouts({
      workouts: [
        { id: "a", name: " Half marathon ", savedAt: 5, state: { ...DEFAULT_STATE, race: "half" } },
        { id: "", name: "Skip" },
        null,
      ],
    });
    expect(workouts).toHaveLength(1);
    expect(workouts[0]?.name).toBe("Half marathon");
    expect(workouts[0]?.state.race).toBe("half");
  });

  it("stores the list without dropping other account fields", () => {
    const metadata = withWorkouts({ theme: "dark" }, [
      { id: "a", name: "5K easy", savedAt: 1, state: DEFAULT_STATE },
    ]);
    expect(metadata.theme).toBe("dark");
    expect(readWorkouts(metadata)[0]?.name).toBe("5K easy");
  });

  it("renames one run and deletes another", () => {
    const workouts = [
      { id: "a", name: "Easy", savedAt: 1, state: DEFAULT_STATE },
      { id: "b", name: "Long", savedAt: 2, state: DEFAULT_STATE },
    ];
    expect(renameWorkout(workouts, "a", "  Park loop  ")[0]?.name).toBe("Park loop");
    expect(deleteWorkout(workouts, "a").map((workout) => workout.id)).toEqual(["b"]);
    expect(renameWorkout(workouts, "a", "   ")).toEqual(workouts);
  });

  it("replaces the plan on one run and keeps its name", () => {
    const workouts = [
      { id: "a", name: "Easy", savedAt: 1, state: DEFAULT_STATE },
      { id: "b", name: "Long", savedAt: 2, state: DEFAULT_STATE },
    ];
    const next = replaceWorkout(workouts, "a", { ...DEFAULT_STATE, race: "5k" });
    expect(next[0]?.name).toBe("Easy");
    expect(next[0]?.state.race).toBe("5k");
    expect(next[0]?.savedAt).toBeGreaterThan(1);
    expect(next[1]).toEqual(workouts[1]);
    expect(replaceWorkout(workouts, "missing", DEFAULT_STATE)).toBe(workouts);
  });

  it("includes average pace and total time for a saved run", () => {
    const preview = savedRunPreview({ ...DEFAULT_STATE, race: "5k", finishSeconds: 30 * 60, strategy: "even" });
    expect(preview.distance).toBe("5K");
    expect(preview.strategy).toBe("Even pace");
    expect(preview.averagePace).toBe("9:39 /mi");
    expect(preview.totalTime).toBe("0:30:00");
  });
});
