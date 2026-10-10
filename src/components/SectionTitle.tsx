export default function SectionTitle({
  step,
  eyebrow,
  title,
  id,
  light = false,
}: {
  step: number;
  eyebrow: string;
  title: string;
  id: string;
  light?: boolean;
}) {
  return (
    <div className={`section-title ${light ? "light" : ""}`}>
      <span aria-hidden="true">{step}</span>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
    </div>
  );
}
