import { ClerkProvider } from "@clerk/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const analyticsToken = import.meta.env.VITE_CLOUDFLARE_ANALYTICS_TOKEN;
const app = <App />;

if (analyticsToken) {
  const beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = JSON.stringify({ token: analyticsToken });
  document.head.appendChild(beacon);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {publishableKey ? (
      <ClerkProvider afterSignOutUrl={import.meta.env.BASE_URL} publishableKey={publishableKey}>
        {app}
      </ClerkProvider>
    ) : (
      app
    )}
  </React.StrictMode>,
);
