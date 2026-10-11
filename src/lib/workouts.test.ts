import { describe, expect, it } from "vitest";
import { DEFAULT_STATE } from "./planState";
import { readWorkouts, withWorkouts } from "./workouts";

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
});
