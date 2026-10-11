import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
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
  maxWarmUpSeconds,
  resamplePaces,
  segmentDistances,
  toUnits,
} from "./lib/pace";
import {
  DEFAULT_STATE,
  decodeState,
  encodeState,
  loadStoredState,
  raceMeters,
  storeState,
  syncGoal,
  type PlanMode,
  type PlanState,
} from "./lib/planState";
import { isBeta } from "./lib/channel";
import useTheme from "./lib/useTheme";

const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

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
        next.warmUpSeconds = Math.round(convertPace(prev.warmUpSeconds, prev.unit, patch.unit));
        next.manualPaces = resamplePaces(prev.manualPaces, prev.unit, patch.unit, raceMeters(prev));
      }
      if (patch.goalType && patch.goalType !== prev.goalType) {
        Object.assign(next, syncGoal(next, patch.goalType));
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
    state.race === "none"
      ? ""
      : state.race === "custom"
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
            warmUpSeconds: state.warmUpEnabled ? state.warmUpSeconds : undefined,
          }),
    [
      isManual,
      totalUnits,
      manualPaces,
      goalSeconds,
      state.strategy,
      state.strength,
      state.holdUnits,
      state.warmUpEnabled,
      state.warmUpSeconds,
    ],
  );
  const planCheckpoints = useMemo(() => checkpoints(plan, totalMeters, unit), [plan, totalMeters, unit]);
  const finalTime = plan.at(-1)?.elapsed ?? 0;

  const setManualPace = (index: number, pace: number) =>
    update({
      manualPaces: Array.from({ length: rows }, (_, i) => (i === index ? pace : (state.manualPaces[i] ?? null))),
    });

  const warmUpActive = state.warmUpEnabled && !isManual && maxWarmUpSeconds(totalUnits, goalSeconds) > 0;

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
          <div className="brand">
            <div className="header-logo-crop">
              <img alt="DPACER" className="header-logo" height={51} src={isDark ? dpacerLogoDark : dpacerLogo} width={180} />
            </div>
            {isBeta && <p className="beta-banner">Beta</p>}
          </div>
          <div className="top-actions">
            {clerkEnabled && (
              <div className="auth-controls">
                <Show when="signed-out">
                  <SignInButton>
                    <button className="auth-button" type="button">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="auth-button auth-button-primary" type="button">
                      Sign up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            )}
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

        <div className="intro">
          <p>
            {fromLink
              ? "You're viewing a shared plan. Any changes you make are saved on this device."
              : `Build a ${unitLabel.singular}-by-${unitLabel.singular} plan that matches how you want to pace your run.`}
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

        {!isManual && (
          <StrategySection
            goalSeconds={goalSeconds}
            maxHold={maxHold}
            state={state}
            step={4}
            totalUnits={totalUnits}
            update={update}
          />
        )}

        <SplitsSection
          averageGoalPace={averagePace}
          checkpoints={planCheckpoints}
          emptyHint={
            state.race === "none"
              ? "Choose a race distance and your splits will appear here."
              : undefined
          }
          finalTime={finalTime}
          goalSeconds={goalSeconds}
          manual={isManual}
          onPaceChange={setManualPace}
          onPrint={() => window.print()}
          onResetPaces={() => update({ manualPaces: [] })}
          onShare={sharePlan}
          plan={plan}
          warmUp={warmUpActive}
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
