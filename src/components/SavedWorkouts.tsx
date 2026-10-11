import { RACES, STRATEGIES, UNIT_LABELS, formatDistance } from "../lib/pace";
import type { SavedWorkout } from "../lib/workouts";

function workoutDetail(workout: SavedWorkout) {
  const { state } = workout;
  const distance =
    state.race === "none"
      ? "No distance"
      : state.race === "custom"
        ? `${formatDistance(state.customDistance)} ${UNIT_LABELS[state.customUnit].short}`
        : RACES.find((race) => race.id === state.race)!.name;
  const strategy = state.planMode === "manual" ? "Custom" : STRATEGIES.find((item) => item.id === state.strategy)!.name;
  return `${distance} · ${strategy}`;
}

export default function SavedWorkouts({
  workouts,
  activeId,
  onOpen,
}: {
  workouts: SavedWorkout[];
  activeId: string;
  onOpen: (workout: SavedWorkout) => void;
}) {
  return (
    <section className="saved-workouts" aria-labelledby="saved-workouts-heading">
      <h3 id="saved-workouts-heading">Saved workouts</h3>
      {workouts.length === 0 ? (
        <p>Save a workout and it will show up here.</p>
      ) : (
        <div className="saved-workout-list">
          {workouts.map((workout) => (
            <button
              className={workout.id === activeId ? "active" : ""}
              key={workout.id}
              onClick={() => onOpen(workout)}
              type="button"
            >
              <strong>{workout.name}</strong>
              <span>{workoutDetail(workout)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
