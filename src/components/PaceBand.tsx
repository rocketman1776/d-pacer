import { UNIT_LABELS, formatTime, type Split, type Unit } from "../lib/pace";

/** Print-only wristband: hidden on screen, shown by the print stylesheet. */
export default function PaceBand({
  plan,
  unit,
  raceName,
  strategyName,
  finalTime,
}: {
  plan: Split[];
  unit: Unit;
  raceName: string;
  strategyName: string;
  finalTime: number;
}) {
  const unitLabel = UNIT_LABELS[unit];

  return (
    <aside aria-hidden="true" className="pace-band">
      <header>
        <strong>DPACER · {raceName}</strong>
        <span>
          Goal {formatTime(finalTime, true)} · {strategyName}
        </span>
      </header>
      <table>
        <thead>
          <tr>
            <th>{unit === "mi" ? "Mile" : "Km"}</th>
            <th>Pace /{unitLabel.short}</th>
            <th>Elapsed</th>
          </tr>
        </thead>
        <tbody>
          {plan.map((split) => (
            <tr key={split.index}>
              <td>{split.distance < 0.999 ? `${split.distance.toFixed(2)}` : split.index + 1}</td>
              <td>{formatTime(split.pace)}</td>
              <td>{formatTime(split.elapsed, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Cut along the border and tape around your wrist.</p>
    </aside>
  );
}
