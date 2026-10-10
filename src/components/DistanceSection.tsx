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
        <button
          aria-pressed={isCustom}
          className={`distance-card custom-card ${isCustom ? "active" : ""}`}
          onClick={() => update({ race: "custom" })}
          type="button"
        >
          <strong>Custom distance</strong>
          <span>Choose miles or kilometers</span>
        </button>
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
      {isCustom && (
        <div className="custom-distance">
          <label>
            <span>Distance</span>
            <DecimalField
              label="Custom race distance"
              max={MAX_DISTANCE}
              min={MIN_DISTANCE}
              value={state.customDistance}
              onChange={(customDistance) =>
                update(customDistance === 1 ? { customDistance, unit: state.customUnit } : { customDistance })
              }
            />
          </label>
          <div aria-label="Distance unit" className="unit-toggle" role="group">
            {(["mi", "km"] as Unit[]).map((unit) => (
              <button
                aria-pressed={state.customUnit === unit}
                className={state.customUnit === unit ? "active" : ""}
                key={unit}
                onClick={() => update(state.customDistance === 1 ? { customUnit: unit, unit } : { customUnit: unit })}
                type="button"
              >
                {unit === "mi" ? "Miles" : "Kilometers"}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
