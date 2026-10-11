import { useEffect } from "react";
import dpacerLogo from "../assets/dpacer-logo.webp";
import dpacerLogoDark from "../assets/dpacer-logo-dark.webp";
import { MoonIcon, SunIcon } from "./icons";
import { isBeta } from "../lib/channel";
import useTheme from "../lib/useTheme";

export function isTermsPath(pathname = window.location.pathname) {
  return pathname.replace(/\/+$/, "").endsWith("/terms");
}

export default function TermsPage() {
  const { isDark, toggle } = useTheme();
  const home = import.meta.env.BASE_URL;

  useEffect(() => {
    document.title = isBeta ? "Terms – d-pacer Beta" : "Terms – d-pacer";
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
          <h1>Terms</h1>
          <p className="updated">Last updated October 11, 2026</p>

          <h2>Using d-pacer</h2>
          <p>
            d-pacer is a race pace planner. You can build a plan, save it to your account, and share a link to it. Using the site means you agree to these terms.
          </p>
          <p>You can use the planner without an account. To sign in, you need to be 13 or older.</p>

          <h2>Your account</h2>
          <p>
            You can sign in with Google or with email. You are responsible for the account you use. A saved run keeps the name you give it and the plan. You can save up to 12 runs, and you can delete a saved run from your list.
          </p>

          <h2>Your plans</h2>
          <p>
            A plan is an estimate from the distance, pace, and strategy you enter. It is not coaching, medical advice, or a promise of a finish time. You decide how you run.
          </p>

          <h2>Sharing</h2>
          <p>A shared plan link contains that plan. Anyone with the link can open it.</p>

          <h2>What you should not do</h2>
          <p>Do not misuse the site, try to break it, or use it to harm someone else.</p>

          <h2>Changes</h2>
          <p>
            We can change these terms or the site. The date at the top is the latest version. If you keep using d-pacer after a change, the new terms apply. We can also pause or stop the site.
          </p>

          <h2>The service</h2>
          <p>
            d-pacer is offered as it is. We are not responsible for a race result, an injury, or a plan that does not match how the race goes.
          </p>

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
