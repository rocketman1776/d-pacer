import { useEffect } from "react";
import dpacerLogo from "../assets/dpacer-logo.webp";
import dpacerLogoDark from "../assets/dpacer-logo-dark.webp";
import { MoonIcon, SunIcon } from "./icons";
import { isBeta } from "../lib/channel";
import useTheme from "../lib/useTheme";

export default function ErrorSplitPage({
  code,
  title,
  detail,
  result,
}: {
  code: string;
  title: string;
  detail: string;
  result: string;
}) {
  const { isDark, toggle } = useTheme();
  const home = import.meta.env.BASE_URL;

  useEffect(() => {
    document.title = isBeta ? `${code} – d-pacer Beta` : `${code} – d-pacer`;
  }, [code]);

  return (
    <main className={`app-shell ${isDark ? "dark" : ""}`}>
      <div aria-hidden="true" className="ambient ambient-one" />
      <div aria-hidden="true" className="ambient ambient-two" />
      <section className="phone-frame">
        <header className="topbar">
          <div className="brand">
            <a aria-label="DPACER" className="header-logo-crop" href={home}>
              <img alt="DPACER" className="header-logo" height={51} src={isDark ? dpacerLogoDark : dpacerLogo} width={180} />
            </a>
          </div>
          <div className="top-actions">
            <button aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} className="theme-button" onClick={toggle} type="button">
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        <article className="legal-page missed-page">
          <p className="missed-code">{code}</p>
          <h1>{title}</h1>
          <p>{detail}</p>

          <div aria-hidden="true" className="missed-card">
            <div className="missed-head">
              <span>Mile</span>
              <span>Target pace</span>
              <span>Elapsed</span>
            </div>
            <div className="missed-row dropped">
              <strong>{code}</strong>
              <span>— — —</span>
              <span>{result}</span>
            </div>
          </div>

          <p>
            <a className="missed-home" href={home}>
              Back to the planner
            </a>
          </p>
        </article>
      </section>
    </main>
  );
}
