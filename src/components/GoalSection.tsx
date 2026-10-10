import { UNIT_LABELS, formatTime } from "../lib/pace";
import { MAX_PACE_SECONDS, type GoalType, type PlanState } from "../lib/planState";
import { PaceInput, TimeField } from "./fields";
import SectionTitle from "./SectionTitle";

export default function GoalSection({
  state,
  step,
  goalSeconds,
  averagePace,
  update,
}: {
  state: PlanState;
  step: number;
  goalSeconds: number;
  averagePace: number;
  update: (patch: Partial<PlanState>) => void;
}) {
  const { finishSeconds, goalType, unit } = state;
  const hours = Math.floor(finishSeconds / 3600);
  const minutes = Math.floor((finishSeconds % 3600) / 60);
  const seconds = finishSeconds % 60;
  const setFinish = (h: number, m: number, s: number) => update({ finishSeconds: h * 3600 + m * 60 + s });
  const unitLabel = UNIT_LABELS[unit];
  const hasGoal = goalSeconds > 0;

  return (
    <section aria-labelledby="goal-heading" className="goal-card">
      <SectionTitle eyebrow="Your goal" id="goal-heading" light step={step} title="What are you aiming for?" />

      <div aria-label="Goal type" className="goal-tabs" role="group">
        {(
          [
            ["finish", "Finish time"],
            ["pace", "Average pace"],
          ] as [GoalType, string][]
        ).map(([id, label]) => (
          <button
            aria-pressed={goalType === id}
            className={goalType === id ? "active" : ""}
            key={id}
            onClick={() => update({ goalType: id })}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {goalType === "finish" ? (
        <div aria-label="Goal finish time" className="time-entry" role="group">
          <TimeField label="hours" max={99} value={hours} onChange={(h) => setFinish(h, minutes, seconds)} />
          <b aria-hidden="true">:</b>
          <TimeField label="minutes" max={59} value={minutes} onChange={(m) => setFinish(hours, m, seconds)} />
          <b aria-hidden="true">:</b>
          <TimeField label="seconds" max={59} value={seconds} onChange={(s) => setFinish(hours, minutes, s)} />
        </div>
      ) : (
        <div className="target-pace-entry">
          <PaceInput
            label="Goal pace"
            seconds={state.targetPace}
            onChange={(targetPace) => update({ targetPace: Math.min(MAX_PACE_SECONDS, targetPace) })}
          />
          <span>per {unitLabel.singular}</span>
        </div>
      )}

      <div aria-live="polite" className={`goal-summary ${hasGoal ? "" : "warning"}`}>
        {hasGoal ? (
          <>
            <span>{goalType === "finish" ? "Average needed" : "Estimated finish"}</span>
            <strong>
              {goalType === "finish" ? `${formatTime(averagePace)} /${unitLabel.short}` : formatTime(goalSeconds, true)}
            </strong>
          </>
        ) : (
          <span>{goalType === "finish" ? "Enter a goal finish time to build your plan." : "Enter a goal pace to build your plan."}</span>
        )}
      </div>
    </section>
  );
}
