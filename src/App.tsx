import { useEffect, useMemo, useState } from "react";
import dpacerLogo from "./assets/dpacer-logo.webp";
import dpacerLogoDark from "./assets/dpacer-logo-dark.webp";
import DistanceSection from "./components/DistanceSection";
import GoalSection from "./components/GoalSection";
import { MoonIcon, SunIcon } from "./components/icons";
import PaceBand from "./components/PaceBand";
import SectionTitle from "./components/SectionTitle";
import SplitsSection from "./components/SplitsSection";
import StrategySection from "./components/StrategySection";
import {
  RACES,
  STRATEGIES,
  UNIT_LABELS,
  checkpoints,
  convertPace,
  formatDistance,
  formatTime,
  generatePlan,
  manualPlan,
  maxHoldUnits,
  resamplePaces,
  segmentDistances,
  toUnits,
  type Unit,
} from "./lib/pace";
import {
  DEFAULT_STATE,
  decodeState,
  encodeState,
  loadStoredState,
  raceMeters,
  storeState,
  type PlanMode,
  type PlanState,
} from "./lib/planState";
import { isBeta } from "./lib/channel";
import useTheme from "./lib/useTheme";

function initialState(): { state: PlanState; fromLink: boolean } {
  const shared = decodeState(window.location.search);
  if (shared) {
    window.history.replaceState(null, "", window.location.pathname);
    return { state: shared, fromLink: true };
  }
  return { state: loadStoredState() ?? DEFAULT_STATE, fromLink: false };
}

export default function App() {
  const [{ state: initial, fromLink }] = useState(initialState);
  const [state, setState] = useState(initial);
  const [shareStatus, setShareStatus] = useState("");
  const { isDark, toggle: toggleTheme } = useTheme();

  useEffect(() => storeState(state), [state]);

  useEffect(() => {
    document.title = isBeta ? "DPACER Beta – Race pace planner" : "DPACER – Race pace planner";
  }, []);

  const update = (patch: Partial<PlanState>) => {
    setShareStatus("");
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (patch.unit && patch.unit !== prev.unit) {
        next.targetPace = Math.round(convertPace(prev.targetPace, prev.unit, patch.unit));
        next.manualPaces = resamplePaces(prev.manualPaces, prev.unit, patch.unit, raceMeters(prev));
      }
      return next;
    });
  };

  const { unit, planMode } = state;
  const unitLabel = UNIT_LABELS[unit];
  const totalMeters = raceMeters(state);
  const totalUnits = toUnits(totalMeters, unit);
  const rows = segmentDistances(totalUnits).length;
  const maxHold = maxHoldUnits(totalUnits);
  const goalSeconds = state.goalType === "finish" ? state.finishSeconds : state.targetPace * totalUnits;
  const averagePace = totalUnits > 0 ? goalSeconds / totalUnits : 0;
  const isManual = planMode === "manual";

  const raceName =
    state.race === "custom"
      ? `${formatDistance(state.customDistance)} ${UNIT_LABELS[state.customUnit].short}`
      : RACES.find((race) => race.id === state.race)!.name;
  const strategyName = isManual ? "Custom" : STRATEGIES.find((item) => item.id === state.strategy)!.name;

  // Unrounded so untouched splits add up exactly to the goal time.
  const fallbackPace = averagePace > 0 ? averagePace : state.targetPace;
  const manualPaces = useMemo(
    () => Array.from({ length: rows }, (_, index) => state.manualPaces[index] ?? fallbackPace),
    [rows, state.manualPaces, fallbackPace],
  );

  const plan = useMemo(
    () =>
      isManual
        ? manualPlan(totalUnits, manualPaces)
        : generatePlan({
            totalUnits,
            goalSeconds,
            strategy: state.strategy,
            strength: state.strength,
            holdUnits: state.holdUnits,
          }),
    [isManual, totalUnits, manualPaces, goalSeconds, state.strategy, state.strength, state.holdUnits],
  );
  const planCheckpoints = useMemo(() => checkpoints(plan, totalMeters, unit), [plan, totalMeters, unit]);
  const finalTime = plan.at(-1)?.elapsed ?? 0;

  const setManualPace = (index: number, pace: number) =>
    update({
      manualPaces: Array.from({ length: rows }, (_, i) => (i === index ? pace : (state.manualPaces[i] ?? null))),
    });

  const sharePlan = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${encodeState(state)}`;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: `DPACER plan · ${raceName}`, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied. Anyone who opens it will see this plan.");
    } catch {
      setShareStatus(`Copy this link to share your plan: ${url}`);
    }
  };

  return (
    <main className={`app-shell ${isDark ? "dark" : ""}`}>
      <div aria-hidden="true" className="ambient ambient-one" />
      <div aria-hidden="true" className="ambient ambient-two" />

      <section className="phone-frame">
        <header className="topbar">
          <div className="header-logo-crop">
            <img alt="DPACER" className="header-logo" height={51} src={isDark ? dpacerLogoDark : dpacerLogo} width={180} />
          </div>
          <div className="top-actions">
            <div aria-label="Pace units" className="unit-switch" role="group">
              {(["mi", "km"] as Unit[]).map((option) => (
                <button
                  aria-pressed={unit === option}
                  className={unit === option ? "active" : ""}
                  key={option}
                  onClick={() => update({ unit: option })}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              className="theme-button"
              onClick={toggleTheme}
              type="button"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        {isBeta && (
          <p className="beta-banner">
            <span>Beta. Try changes here. Plans you save stay off the live app.</span>
            <a href="/">Open live app</a>
          </p>
        )}

        <div className="intro">
          <p>
            {fromLink
              ? "You're viewing a shared plan. Any changes you make are saved on this device."
              : `Build a ${unitLabel.singular}-by-${unitLabel.singular} plan that matches how you want to run your race.`}
          </p>
        </div>

        <DistanceSection state={state} update={update} />

        <section aria-labelledby="method-heading" className="flow-section">
          <SectionTitle eyebrow="Plan method" id="method-heading" step={2} title="How do you want to plan?" />
          <div aria-label="Plan method" className="choice-toggle" role="group">
            {(
              [
                ["generated", "Generate for me", "Choose a goal and strategy"],
                ["manual", `Set each ${unitLabel.singular}`, "Enter every split yourself"],
              ] as [PlanMode, string, string][]
            ).map(([id, title, description]) => (
              <button
                aria-pressed={planMode === id}
                className={planMode === id ? "active" : ""}
                key={id}
                onClick={() => update({ planMode: id })}
                type="button"
              >
                <strong>{title}</strong>
                <span>{description}</span>
              </button>
            ))}
          </div>
        </section>

        <GoalSection averagePace={averagePace} goalSeconds={goalSeconds} state={state} step={3} update={update} />

        {!isManual && <StrategySection maxHold={maxHold} state={state} step={4} update={update} />}

        <SplitsSection
          averageGoalPace={averagePace}
          checkpoints={planCheckpoints}
          finalTime={finalTime}
          goalSeconds={goalSeconds}
          manual={isManual}
          onPaceChange={setManualPace}
          onPrint={() => window.print()}
          onResetPaces={() => update({ manualPaces: [] })}
          onShare={sharePlan}
          plan={plan}
          raceName={raceName}
          shareStatus={shareStatus}
          strategyName={strategyName}
          unit={unit}
        />

        <div className="bottom-summary">
          <div>
            <span>Estimated finish</span>
            <strong>{plan.length ? formatTime(finalTime, true) : "–"}</strong>
          </div>
          <div>
            <span>Average pace</span>
            <strong>{plan.length ? `${formatTime(finalTime / totalUnits)} /${unitLabel.short}` : "–"}</strong>
          </div>
        </div>
      </section>

      <PaceBand finalTime={finalTime} plan={plan} raceName={raceName} strategyName={strategyName} unit={unit} />
    </main>
  );
}
