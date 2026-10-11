import { UNIT_LABELS, formatDelta, formatDistance, formatTime, type Checkpoint, type Split, type Unit } from "../lib/pace";
import { PaceInput } from "./fields";
import { FlagIcon, PrintIcon, ShareIcon } from "./icons";

export default function SplitsSection({
  plan,
  checkpoints,
  unit,
  raceName,
  strategyName,
  manual,
  goalSeconds,
  averageGoalPace,
  finalTime,
  shareStatus,
  onPaceChange,
  onResetPaces,
  onShare,
  onPrint,
  onUnitChange,
  onSave,
  onSaveAsNew,
  saveBusy = false,
  saving,
  warmUp = false,
  emptyHint = "Set a goal above and your splits will appear here.",
}: {
  plan: Split[];
  checkpoints: Checkpoint[];
  unit: Unit;
  raceName: string;
  strategyName: string;
  manual: boolean;
  goalSeconds: number;
  averageGoalPace: number;
  finalTime: number;
  shareStatus: string;
  onPaceChange: (index: number, pace: number) => void;
  onResetPaces: () => void;
  onShare: () => void;
  onPrint: () => void;
  onUnitChange: (unit: Unit) => void;
  onSave?: () => void;
  onSaveAsNew?: () => void;
  saveBusy?: boolean;
  saving?: {
    name: string;
    error: string;
    busy: boolean;
    onName: (name: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
  };
  warmUp?: boolean;
  emptyHint?: string;
}) {
  const unitLabel = UNIT_LABELS[unit];
  const totalUnits = plan.reduce((sum, split) => sum + split.distance, 0);
  const finalAverage = totalUnits ? finalTime / totalUnits : 0;
  const hasGoal = goalSeconds > 0;
  const delta = finalTime - goalSeconds;
  let covered = 0;

  return (
    <section aria-labelledby="plan-heading" className="plan-section">
      <div className="plan-header">
        <div className="plan-title">
          <p className="eyebrow">{manual ? "Live calculation" : "Your run plan"}</p>
          <div className="plan-heading-row">
            <h2 id="plan-heading">{unit === "mi" ? "Mile" : "Kilometer"} splits</h2>
            <div aria-label="Split unit" className="unit-toggle plan-unit" role="group">
              {(["mi", "km"] as Unit[]).map((option) => (
                <button
                  aria-pressed={unit === option}
                  className={unit === option ? "active" : ""}
                  key={option}
                  onClick={() => onUnitChange(option)}
                  type="button"
                >
                  {UNIT_LABELS[option].short}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div aria-live="polite" className="finish-chip">
          <span>Finish</span>
          <strong>{plan.length ? formatTime(finalTime, true) : "–"}</strong>
          {manual && hasGoal && plan.length > 0 && (
            <small className={`delta ${Math.round(delta) > 0 ? "behind" : "ahead"}`}>
              {formatDelta(delta)}
              {Math.round(delta) !== 0 && " vs goal"}
            </small>
          )}
        </div>
      </div>

      {plan.length === 0 ? (
        <p className="plan-empty">{emptyHint}</p>
      ) : (
        <>
          <div className="plan-summary">
            <div>
              <span>Distance</span>
              <strong>{raceName}</strong>
            </div>
            <div>
              <span>Avg pace</span>
              <strong>
                {formatTime(finalAverage)} /{unitLabel.short}
              </strong>
            </div>
            <div>
              <span>Strategy</span>
              <strong>{strategyName}</strong>
            </div>
          </div>

          {manual && (
            <div className="manual-tools">
              <p>Tap a pace to edit it. The difference column shows how far ahead or behind your goal you are.</p>
              <button onClick={onResetPaces} type="button">
                Reset to goal pace
              </button>
            </div>
          )}

          <div className="splits-table" role="table" aria-label="Splits">
            <div className="table-head" role="row">
              <span role="columnheader">{unit === "mi" ? "Mile" : "Km"}</span>
              <span role="columnheader">Target pace</span>
              <span role="columnheader">Avg pace</span>
              <span role="columnheader">Elapsed</span>
            </div>
            {plan.map((split) => {
              covered += split.distance;
              const isHalf = Math.abs(split.distance - 0.5) < 0.001;
              const isPartial = !isHalf && split.distance < 0.999;
              const rowDelta = split.elapsed - averageGoalPace * covered;
              return (
                <div className="table-row" key={split.index} role="row">
                  <div className="mile-cell" role="cell">
                    <span>{isPartial ? <FlagIcon /> : split.index + 1}</span>
                    <small>
                      {warmUp && split.index === 0 && !isPartial && !isHalf
                        ? "warm-up"
                        : isHalf
                          ? `${formatDistance(split.distance)} ${unitLabel.short}`
                          : isPartial
                            ? `${split.distance.toFixed(2)} ${unitLabel.short}`
                            : unitLabel.singular}
                    </small>
                  </div>
                  <div role="cell">
                    {manual ? (
                      <div className="manual-pace">
                        <PaceInput
                          compact
                          label={`${unit === "mi" ? "Mile" : "Kilometer"} ${split.index + 1} pace`}
                          seconds={split.pace}
                          onChange={(pace) => onPaceChange(split.index, pace)}
                        />
                        <small>/{unitLabel.short}</small>
                      </div>
                    ) : (
                      <strong className={`pace-value${warmUp && split.index === 0 && !isPartial && !isHalf ? " warm-up-pace" : ""}`}>
                        {formatTime(split.pace)} <small>/{unitLabel.short}</small>
                      </strong>
                    )}
                  </div>
                  <div className="elapsed-cell" role="cell">
                    <strong>{formatTime(split.average)}</strong>
                    <small>/{unitLabel.short}</small>
                  </div>
                  <div className="elapsed-cell" role="cell">
                    <strong>{formatTime(split.elapsed, true)}</strong>
                    {manual && hasGoal ? (
                      <small className={`delta ${Math.round(rowDelta) > 0 ? "behind" : "ahead"}`}>{formatDelta(rowDelta)}</small>
                    ) : (
                      <small>total</small>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {checkpoints.length > 0 && (
            <div className="checkpoints">
              <h3>Checkpoints</h3>
              <ul>
                {checkpoints.map((point) => (
                  <li key={point.label}>
                    <span>
                      {point.label}
                      <small>
                        {point.units.toFixed(2)} {unitLabel.short}
                      </small>
                    </span>
                    <strong>{formatTime(point.elapsed, true)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="plan-actions">
            <button onClick={onShare} type="button">
              <ShareIcon />
              Share plan
            </button>
            <button onClick={onPrint} type="button">
              <PrintIcon />
              Print pace band
            </button>
            {onSave && !saving && (
              <>
                <button className="wide" disabled={saveBusy} onClick={onSave} type="button">
                  {saveBusy ? "Saving" : "Save run"}
                </button>
                {onSaveAsNew && (
                  <button className="wide" disabled={saveBusy} onClick={onSaveAsNew} type="button">
                    Save as new
                  </button>
                )}
              </>
            )}
            {saving && (
              <form
                className="save-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saving.onConfirm();
                }}
              >
                <label>
                  Name
                  <input
                    aria-label="Run name"
                    maxLength={80}
                    onChange={(event) => saving.onName(event.target.value)}
                    value={saving.name}
                  />
                </label>
                {saving.error && <p className="field-error">{saving.error}</p>}
                <div className="save-form-actions">
                  <button disabled={saving.busy} type="submit">
                    {saving.busy ? "Saving" : "Save"}
                  </button>
                  <button onClick={saving.onCancel} type="button">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          <p aria-live="polite" className="share-status">
            {shareStatus}
          </p>
        </>
      )}
    </section>
  );
}
