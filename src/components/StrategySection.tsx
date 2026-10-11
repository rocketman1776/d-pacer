import { MAX_STRENGTH, MIN_STRENGTH, STRATEGIES, UNIT_LABELS, maxWarmUpSeconds } from "../lib/pace";
import type { PlanState } from "../lib/planState";
import { PaceInput } from "./fields";
import SectionTitle from "./SectionTitle";

export default function StrategySection({
  state,
  step,
  maxHold,
  totalUnits,
  goalSeconds,
  update,
}: {
  state: PlanState;
  step: number;
  maxHold: number;
  totalUnits: number;
  goalSeconds: number;
  update: (patch: Partial<PlanState>) => void;
}) {
  const { strategy, strength, unit, warmUpEnabled } = state;
  const hold = Math.min(state.holdUnits, maxHold);
  const unitLabel = UNIT_LABELS[unit];
  const warmUpLimit = maxWarmUpSeconds(totalUnits, goalSeconds);
  const warmUpSeconds = Math.min(state.warmUpSeconds, warmUpLimit || state.warmUpSeconds);
  const showStrength = strategy !== "even";
  const showWarmUp = warmUpLimit > 0;

  return (
    <section aria-labelledby="strategy-heading" className="flow-section">
      <SectionTitle eyebrow="Race strategy" id="strategy-heading" step={step} title="How do you want to run?" />
      <div className="strategy-grid">
        {STRATEGIES.map((item) => (
          <button
            aria-pressed={strategy === item.id}
            className={`strategy-card ${strategy === item.id ? "active" : ""}`}
            key={item.id}
            onClick={() => update({ strategy: item.id })}
            type="button"
          >
            <span aria-hidden="true" className="strategy-radio" />
            <strong>{item.name}</strong>
            <small>{item.description}</small>
          </button>
        ))}
      </div>

      {(showStrength || showWarmUp) && (
      <div className="strategy-controls">
        {showStrength && (
          <>
          <div className="control-heading">
            <div>
              <strong id="strength-label">{strategy === "progression" ? "Progression strength" : "Split strength"}</strong>
              <span>
                How much faster or slower the first and last {unitLabel.plural} are than your average
              </span>
            </div>
            <b>±{strength}%</b>
          </div>
          <input
            aria-labelledby="strength-label"
            aria-valuetext={`${strength} percent`}
            className="strength-slider"
            max={MAX_STRENGTH}
            min={MIN_STRENGTH}
            onChange={(event) => update({ strength: Number(event.target.value) })}
            style={{ "--value": `${((strength - MIN_STRENGTH) / (MAX_STRENGTH - MIN_STRENGTH)) * 100}%` } as React.CSSProperties}
            type="range"
            value={strength}
          />
          <div aria-hidden="true" className="range-labels">
            <span>Gentle</span>
            <span>Strong</span>
          </div>

          {strategy === "progression" && (
            <div className="hold-control">
              <div>
                <strong id="hold-label">Hold each pace for</strong>
                <span>Keep a steady rhythm before speeding up</span>
              </div>
              <select aria-labelledby="hold-label" value={hold} onChange={(event) => update({ holdUnits: Number(event.target.value) })}>
                {Array.from({ length: maxHold }, (_, index) => index + 1).map((units) => (
                  <option key={units} value={units}>
                    {units} {units === 1 ? unitLabel.singular : unitLabel.plural}
                  </option>
                ))}
              </select>
            </div>
          )}
          </>
        )}

        {showWarmUp && (
          <div className={`warm-up-control ${strategy === "even" ? "" : "divided"}`}>
            <button
              aria-pressed={warmUpEnabled}
              className={`warm-up-toggle ${warmUpEnabled ? "active" : ""}`}
              onClick={() => update({ warmUpEnabled: !warmUpEnabled })}
              type="button"
            >
              <span>
                <strong>Warm-up {unitLabel.singular}</strong>
                <span>Start easier so your legs can warm up. Your goal time and pace stay the same.</span>
              </span>
              <span aria-hidden="true" className="warm-up-switch" />
            </button>
            {warmUpEnabled && (
              <div className="warm-up-entry">
                <span>This {unitLabel.singular}</span>
                <PaceInput
                  label={`Warm-up ${unitLabel.singular}`}
                  seconds={warmUpSeconds}
                  onChange={(seconds) => update({ warmUpSeconds: Math.min(warmUpLimit, Math.max(1, Math.round(seconds))) })}
                />
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </section>
  );
}
