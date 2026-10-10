import { UNIT_LABELS, formatDistance, formatTime, type Split, type Unit } from "../lib/pace";

const WIDTH = 340;
const HEIGHT = 176;
const PAD = { left: 40, right: 8, top: 12, bottom: 26 };

function distanceTicks(total: number) {
  const step = total <= 6 ? 1 : total <= 16 ? 5 : 10;
  const marks = [0];
  for (let value = step; value < total; value += step) {
    if (total - value > step * 0.45) marks.push(value);
  }
  if (total > 0) marks.push(total);
  return marks;
}

export default function PaceChart({ plan, unit }: { plan: Split[]; unit: Unit }) {
  if (plan.length === 0) return null;

  const unitLabel = UNIT_LABELS[unit];
  let covered = 0;
  const segments = plan.map((split) => {
    const start = covered;
    covered += split.distance;
    return { start, end: covered, pace: split.pace, index: split.index };
  });
  const total = segments[segments.length - 1].end;
  if (!(total > 0)) return null;

  const paces = segments.map((segment) => segment.pace);
  const fastest = Math.min(...paces);
  const slowest = Math.max(...paces);
  const padPace = Math.max((slowest - fastest) * 0.22, 6);
  const yFast = fastest - padPace;
  const ySlow = slowest + padPace;
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const xOf = (distance: number) => PAD.left + (distance / total) * plotWidth;
  const yOf = (pace: number) => PAD.top + ((pace - yFast) / (ySlow - yFast)) * plotHeight;

  const points: { x: number; y: number }[] = [];
  segments.forEach((segment, index) => {
    const y = yOf(segment.pace);
    if (index === 0) points.push({ x: xOf(segment.start), y });
    points.push({ x: xOf(segment.end), y });
    const next = segments[index + 1];
    if (next) points.push({ x: xOf(segment.end), y: yOf(next.pace) });
  });

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const paceLabels =
    Math.abs(yOf(fastest) - yOf(slowest)) < 16
      ? [fastest]
      : [fastest, slowest];

  return (
    <div className="checkpoints pace-chart">
      <h3>Pace / {unitLabel.short}</h3>
      <svg
        aria-label={`Target pace by distance. Faster pace is higher. The pace runs from ${formatTime(fastest)} to ${formatTime(slowest)} per ${unitLabel.short} over ${formatDistance(total)} ${unitLabel.short}.`}
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        {paceLabels.map((pace) => (
          <line
            key={pace}
            stroke="rgba(255,255,255,.12)"
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={yOf(pace)}
            y2={yOf(pace)}
          />
        ))}
        <path d={line} fill="none" stroke="#f75f20" strokeLinejoin="round" strokeWidth="2.5" />
        {segments.map((segment) => (
          <circle
            key={segment.index}
            cx={xOf(segment.end)}
            cy={yOf(segment.pace)}
            fill="#fff"
            r="2.4"
          >
            <title>
              {formatDistance(segment.end)} {unitLabel.short} · {formatTime(segment.pace)} /{unitLabel.short}
            </title>
          </circle>
        ))}
        {paceLabels.map((pace) => (
          <text key={`label-${pace}`} textAnchor="end" x={PAD.left - 6} y={yOf(pace) + 3}>
            {formatTime(pace)}
          </text>
        ))}
        {distanceTicks(total).map((distance, index, ticks) => (
          <text
            key={distance}
            textAnchor={index === ticks.length - 1 ? "end" : "middle"}
            x={xOf(distance)}
            y={HEIGHT - 8}
          >
            {formatDistance(distance)}
            {index === ticks.length - 1 ? ` ${unitLabel.short}` : ""}
          </text>
        ))}
      </svg>
    </div>
  );
}
