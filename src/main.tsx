import { ClerkProvider } from "@clerk/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const app = <App />;

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
