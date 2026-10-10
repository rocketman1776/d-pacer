import { useState, type KeyboardEvent } from "react";

const blurOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") event.currentTarget.blur();
};

/**
 * Whole-number field that keeps the user's raw text while focused, so clearing or
 * retyping never fights with the formatted value. Valid input updates live.
 */
export function IntegerField({
  label,
  value,
  max,
  pad = 2,
  maxLength = 2,
  className,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  pad?: number;
  maxLength?: number;
  className?: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const formatted = String(value).padStart(pad, "0");

  return (
    <input
      aria-label={label}
      autoComplete="off"
      className={className}
      inputMode="numeric"
      pattern="[0-9]*"
      type="text"
      value={draft ?? formatted}
      onFocus={(event) => {
        setDraft(formatted);
        event.currentTarget.select();
      }}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(-maxLength);
        if (digits === "") {
          setDraft("");
          return;
        }
        const next = Math.min(max, Number(digits));
        setDraft(Number(digits) > max ? String(max) : digits);
        onChange(next);
      }}
      onBlur={() => {
        if (draft === "") onChange(0);
        setDraft(null);
      }}
      onKeyDown={blurOnEnter}
    />
  );
}

export function TimeField({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="number-field">
      <IntegerField label={label} max={max} value={value} onChange={onChange} />
      <span aria-hidden="true">{label}</span>
    </label>
  );
}

export function PaceInput({
  seconds,
  onChange,
  label = "Pace",
  compact = false,
}: {
  seconds: number;
  onChange: (seconds: number) => void;
  label?: string;
  compact?: boolean;
}) {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;

  return (
    <div aria-label={label} className={`pace-input ${compact ? "compact" : ""}`} role="group">
      <IntegerField
        label={`${label} minutes`}
        max={99}
        value={minutes}
        onChange={(next) => onChange(next * 60 + remainder)}
      />
      <span aria-hidden="true">:</span>
      <IntegerField
        label={`${label} seconds`}
        max={59}
        value={remainder}
        onChange={(next) => onChange(minutes * 60 + next)}
      />
    </div>
  );
}

/** Decimal field that only commits values within range; invalid text reverts on blur. */
export function DecimalField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [valueOnFocus, setValueOnFocus] = useState(value);
  const parsed = draft === null ? value : Number(draft);
  const invalid = draft !== null && (draft.trim() === "" || !(parsed >= min && parsed <= max));
  const errorId = `${label.replace(/\s+/g, "-").toLowerCase()}-error`;

  return (
    <>
      <input
        aria-describedby={invalid ? errorId : undefined}
        aria-invalid={invalid}
        aria-label={label}
        autoComplete="off"
        inputMode="decimal"
        type="text"
        value={draft ?? String(value)}
        onFocus={() => {
          setDraft(String(value));
          setValueOnFocus(value);
        }}
        onChange={(event) => {
          const text = event.target.value.replace(",", ".");
          if (!/^\d*\.?\d{0,2}$/.test(text)) return;
          setDraft(text);
          const next = Number(text);
          if (text !== "" && next >= min && next <= max) onChange(next);
        }}
        onBlur={() => {
          if (invalid) onChange(valueOnFocus);
          setDraft(null);
        }}
        onKeyDown={blurOnEnter}
      />
      {invalid && (
        <small className="field-error" id={errorId} role="alert">
          Enter a distance between {min} and {max}
        </small>
      )}
    </>
  );
}
