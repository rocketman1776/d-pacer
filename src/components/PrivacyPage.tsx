import { useEffect } from "react";
import dpacerLogo from "../assets/dpacer-logo.webp";
import dpacerLogoDark from "../assets/dpacer-logo-dark.webp";
import { MoonIcon, SunIcon } from "./icons";
import { isBeta } from "../lib/channel";
import useTheme from "../lib/useTheme";

export function isPrivacyPath(pathname = window.location.pathname) {
  return pathname.replace(/\/+$/, "").endsWith("/privacy");
}

export default function PrivacyPage() {
  const { isDark, toggle } = useTheme();
  const home = import.meta.env.BASE_URL;

  useEffect(() => {
    document.title = isBeta ? "Privacy – d-pacer Beta" : "Privacy – d-pacer";
  }, []);

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

        <article className="legal-page">
          <h1>Privacy</h1>
          <p className="updated">Last updated October 11, 2026</p>

          <h2>What we keep</h2>
          <p>
            Signing in creates an account with your name, email, and profile photo. Google sends those if you use Google. X sends your name and photo, and your email if you allow it. With email sign-in, we keep what you enter.
          </p>
          <p>
            That account is stored so we can sign you in and show the runs you save. A saved run is the name you give it and the plan: distance, pace, finish time, and strategy.
          </p>
          <p>
            The plan you are working on stays in this browser, so it is still here when you come back. If you share a link, anyone with that link can open the plan.
          </p>

          <h2>Visits</h2>
          <p>
            We count visits. A visit includes the page, where it came from, the browser, and the country. It does not include your name, email, or saved runs.
          </p>

          <h2>What we do not do</h2>
          <p>We do not sell your information or use it for ads.</p>

          <p>
            Questions about this page can go to <a href="mailto:support@dpacer.app">support@dpacer.app</a>.
          </p>
          <p>
            <a href={home}>Back to d-pacer</a>
          </p>
        </article>
      </section>
    </main>
  );
}
