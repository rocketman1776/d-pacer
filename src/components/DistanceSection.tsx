import { MAX_DISTANCE, MIN_DISTANCE, RACES, UNIT_LABELS, formatDistance, toUnits, type Unit } from "../lib/pace";
import type { PlanState } from "../lib/planState";
import { DecimalField } from "./fields";
import SectionTitle from "./SectionTitle";

export default function DistanceSection({
  state,
  update,
}: {
  state: PlanState;
  update: (patch: Partial<PlanState>) => void;
}) {
  const isCustom = state.race === "custom";

  return (
    <section aria-labelledby="distance-heading" className="flow-section">
      <SectionTitle eyebrow="Race distance" id="distance-heading" step={1} title="How far are you running?" />
      <div className="distance-grid">
        {isCustom ? (
          <div className="distance-card custom-card active">
            <div className="custom-card-copy">
              <strong>Custom distance</strong>
              <span>Choose miles or kilometers</span>
            </div>
            <div className="custom-distance">
              <label>
                <DecimalField
                  label="Custom race distance"
                  max={MAX_DISTANCE}
                  min={MIN_DISTANCE}
                  value={state.customDistance}
                  onChange={(customDistance) => update({ customDistance, unit: state.customUnit })}
                />
              </label>
              <div aria-label="Distance unit" className="unit-toggle" role="group">
                {(["mi", "km"] as Unit[]).map((unit) => (
                  <button
                    aria-pressed={state.customUnit === unit}
                    className={state.customUnit === unit ? "active" : ""}
                    key={unit}
                    onClick={() => update({ customUnit: unit, unit })}
                    type="button"
                  >
                    {UNIT_LABELS[unit].short}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button
            aria-pressed={false}
            className="distance-card custom-card"
            onClick={() => update({ race: "custom", unit: state.customUnit })}
            type="button"
          >
            <strong>Custom distance</strong>
            <span>Choose miles or kilometers</span>
          </button>
        )}
        {RACES.map((race) => (
          <button
            aria-pressed={state.race === race.id}
            className={`distance-card ${state.race === race.id ? "active" : ""}`}
            key={race.id}
            onClick={() => update({ race: race.id })}
            type="button"
          >
            <strong>{race.name}</strong>
            <span>
              {formatDistance(toUnits(race.meters, state.unit))} {UNIT_LABELS[state.unit].short}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
