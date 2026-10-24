import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function betaContentSecurityPolicy() {
  const config = JSON.parse(readFileSync(path.join(projectRoot, "vercel.json"), "utf8")) as {
    headers?: { headers: { key: string; value: string }[] }[];
  };
  for (const group of config.headers ?? []) {
    const policy = group.headers.find((header) => header.key === "Content-Security-Policy");
    if (policy) return policy.value;
  }
  return "";
}

/** The beta pages are served from the same site as the live app, so lock the beta document itself. */
function betaCspMeta(): Plugin {
  const policy = betaContentSecurityPolicy();
  return {
    name: "beta-csp-meta",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if ((process.env.BASE_PATH || "/") !== "/beta/" || !policy) return html;
        const tag = `    <meta http-equiv="Content-Security-Policy" content="${policy}" />`;
        return html.replace("</head>", `${tag}\n  </head>`);
      },
    },
  };
}

/** Vercel and CloudFront serve privacy, terms, 403, and 404 from copied index.html files. */
function legalPageFiles(): Plugin {
  return {
    name: "legal-page-files",
    apply: "build",
    writeBundle(options) {
      if (!options.dir) return;
      const indexHtml = path.join(options.dir, "index.html");
      copyFileSync(indexHtml, path.join(options.dir, "403.html"));
      copyFileSync(indexHtml, path.join(options.dir, "404.html"));
      for (const page of ["privacy", "terms", "403", "404"]) {
        const pageDir = path.join(options.dir, page);
        mkdirSync(pageDir, { recursive: true });
        copyFileSync(indexHtml, path.join(pageDir, "index.html"));
      }
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [betaCspMeta(), legalPageFiles(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8443"),
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8443"),
  },
});
