import { execSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const head = tryGit(["rev-parse", "HEAD"]);
const repo = "rocketman1776/d-pacer";

function vite(args, extraEnv, cwd = root) {
  const result = spawnSync("pnpm", ["exec", "vite", ...args], {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function tryGit(args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function redact(text) {
  return String(text ?? "").replace(/x-access-token:[^@\s]+/g, "x-access-token:****");
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  const output = redact(`${result.stdout ?? ""}${result.stderr ?? ""}`).trim();
  if (output) console.log(output);
  return result.status === 0;
}

function fetchRef(ref) {
  const destination = `refs/remotes/origin/${ref}`;
  const refspec = `+refs/heads/${ref}:${destination}`;
  const attempts = [
    ["fetch", "--depth=1", "origin", refspec],
    ["fetch", "--depth=1", `https://github.com/${repo}.git`, refspec],
  ];
  const token = process.env.BETA_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    attempts.push([
      "fetch",
      "--depth=1",
      `https://x-access-token:${token}@github.com/${repo}.git`,
      refspec,
    ]);
  }

  for (const args of attempts) {
    if (runGit(args) && tryGit(["rev-parse", destination])) {
      return tryGit(["rev-parse", destination]);
    }
  }
  console.warn(`Could not fetch origin/${ref}.`);
  return null;
}

// Archive builds write outside the temp project, so Vite builds there and the
// result is copied into dist. In-place builds already empty their own outDir.
function buildSha(sha, { outDir, basePath }) {
  const target = outDir ?? join(root, "dist");
  if (!sha || sha === head) {
    const args = ["build", "--emptyOutDir"];
    if (outDir) args.push("--outDir", outDir);
    vite(args, { BASE_PATH: basePath });
    return;
  }

  const dir = mkdtempSync(join(tmpdir(), "dpacer-build-"));
  try {
    const archive = spawnSync("git", ["archive", sha], { cwd: root, encoding: "buffer" });
    if (archive.status !== 0) process.exit(archive.status ?? 1);
    const extract = spawnSync("tar", ["-x", "-C", dir], { input: archive.stdout });
    if (extract.status !== 0) process.exit(extract.status ?? 1);
    const install = spawnSync("pnpm", ["install", "--frozen-lockfile"], { cwd: dir, stdio: "inherit" });
    if (install.status !== 0) process.exit(install.status ?? 1);
    vite(["build", "--emptyOutDir"], { BASE_PATH: basePath }, dir);
    rmSync(target, { recursive: true, force: true });
    cpSync(join(dir, "dist"), target, { recursive: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Production always publishes main at / and beta at /beta, including when the
// deploy was started by a push to beta. Preview and local builds publish the
// checked-out commit at /, and nest beta at /beta when that branch differs.
const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.VERCEL_ENV === "production";
const branch = process.env.VERCEL_GIT_COMMIT_REF || tryGit(["rev-parse", "--abbrev-ref", "HEAD"]);

let liveSha = head;
let betaSha = head;

if (isProduction) {
  const mainSha = fetchRef("main");
  if (mainSha) {
    liveSha = mainSha;
  } else if (branch !== "main") {
    console.error("Could not fetch origin/main. Refusing to publish this branch at /.");
    process.exit(1);
  }

  const remoteBeta = fetchRef("beta");
  if (remoteBeta) {
    betaSha = remoteBeta;
  } else if (branch === "beta") {
    betaSha = head;
    console.warn("No beta branch on the remote. /beta will match this commit.");
  } else {
    console.warn("No beta branch on the remote. /beta will match the live app until that branch exists.");
    betaSha = liveSha;
  }
} else if (isVercel) {
  const remoteBeta = fetchRef("beta");
  if (remoteBeta) betaSha = remoteBeta;
  else console.warn("No beta branch on the remote. /beta will match this commit.");
}

console.log(`Building / from ${liveSha}`);
console.log(`Building /beta from ${betaSha}`);

buildSha(liveSha, { basePath: "/" });
buildSha(betaSha, { outDir: join(root, "dist/beta"), basePath: "/beta/" });
