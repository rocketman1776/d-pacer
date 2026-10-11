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
            Signing in creates an account with your name, email address, and profile photo. If you sign in with Google, Google sends those details so we can open your account. Email sign-in keeps the name and email you enter.
          </p>
          <p>
            That account is stored with Clerk, the sign-in service d-pacer uses. We use it to sign you in and to show the runs you save.
          </p>
          <p>
            A saved run keeps the name you give it and the plan: distance, pace, finish time, and strategy. You can save up to 12 runs. You can delete a saved run from your list.
          </p>
          <p>
            The plan you are working on is also kept in this browser, so it is still here when you come back. A shared plan link contains that plan, so anyone with the link can open it.
          </p>

          <h2>What we do not do</h2>
          <p>We do not sell your information. We do not use it for ads.</p>

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
