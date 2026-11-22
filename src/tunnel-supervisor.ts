import { spawn, type ChildProcess } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import os from "node:os";
import { openSync } from "node:fs";

/**
 * In-process tunnel supervisor.
 *
 * The sandbox kills external background processes (which is what caused
 * Cloudflare tunnel error 1033: cloudflared died and the edge could no longer
 * resolve the hostname). The one process the platform *does* keep alive is the
 * Next.js server itself, because the preview depends on it.
 *
 * So the tunnel is supervised from inside the server: as long as the app is
 * up, cloudflared is up. An already-running cloudflared is adopted rather than
 * replaced, which keeps the public URL stable across app restarts.
 */

/**
 * State directory.
 *
 * - Linux / CI: `/tmp/tunnel` (matches the shell scripts in scripts/)
 * - Windows: `%LOCALAPPDATA%\nova\tunnel` — `/tmp` does not exist there, and
 *   the download URL would otherwise be served as `\tmp\tunnel\cloudflared`
 *   (the ENOENT seen on Windows).
 */
const STATE_DIR =
  process.platform === "win32"
    ? path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "nova", "tunnel")
    : path.join(os.tmpdir(), "tunnel");

/** cloudflared binary name + download URL, per platform. */
const BIN_NAME = process.platform === "win32" ? "cloudflared.exe" : "cloudflared";
const DOWNLOAD_URL =
  process.platform === "win32"
    ? "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    : "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64";

const BIN = path.join(STATE_DIR, BIN_NAME);
const LOG_FILE = path.join(STATE_DIR, "tunnel.log");
const URL_FILE = path.join(STATE_DIR, "PUBLIC_URL");
const PID_FILE = path.join(STATE_DIR, "tunnel.pid");

const CHECK_MS = 15_000;
const MAX_CONSECUTIVE_RESTARTS = 4;

let child: ChildProcess | null = null;
let restarts = 0;
let lastSpawnAt = 0;
let lastLoggedAppDown = 0;

function log(message: string) {
  try {
    appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`);
  } catch {
    /* logging must never break the app */
  }
}

function pidAlive(pid: number): boolean {
  if (!pid || pid <= 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid(): number {
  try {
    return Number.parseInt(readFileSync(PID_FILE, "utf8").trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/** GET a URL and resolve with the status code (never throws). */
function statusOf(url: string, timeoutMs = 8000): Promise<number> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (code: number) => {
      if (!settled) {
        settled = true;
        resolve(code);
      }
    };
    try {
      const req = (url.startsWith("https:") ? https : http).get(url, { timeout: timeoutMs }, (res) => {
        res.resume();
        done(res.statusCode ?? 0);
      });
      req.on("timeout", () => {
        req.destroy();
        done(0);
      });
      req.on("error", () => done(0));
    } catch {
      done(0);
    }
  });
}

async function appHealthy(port: number): Promise<boolean> {
  const code = await statusOf(`http://127.0.0.1:${port}/api/health`, 6000);
  return code === 200;
}

function currentUrl(): string {
  try {
    return readFileSync(URL_FILE, "utf8").trim();
  } catch {
    return "";
  }
}

function downloadBinary(): Promise<void> {
  return new Promise((resolve, reject) => {
    mkdirSync(STATE_DIR, { recursive: true });
    const get = (url: string, depth = 0) => {
      if (depth > 5) return reject(new Error("too many redirects"));
      https
        .get(url, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return get(res.headers.location, depth + 1);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`download failed: ${res.statusCode}`));
          }
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("end", () => {
            try {
              writeFileSync(BIN, Buffer.concat(chunks), { mode: 0o755 });
              chmodSync(BIN, 0o755);
              resolve();
            } catch (e) {
              reject(e as Error);
            }
          });
          res.on("error", reject);
        })
        .on("error", reject);
    };
    get(DOWNLOAD_URL);
  });
}

/**
 * Kill any cloudflared left over from a previous server instance that is not
 * the one we are about to adopt. Without this, every app restart would leak
 * another detached process.
 */
function killStale(keepPid: number, port: number): void {
  let entries: string[] = [];
  try {
    entries = readdirSync("/proc").filter((n) => /^\d+$/.test(n));
  } catch {
    return;
  }

  for (const entry of entries) {
    const pid = Number.parseInt(entry, 10);
    if (!pid || pid === keepPid || pid === process.pid) continue;

    let cmdline = "";
    try {
      cmdline = readFileSync(`/proc/${entry}/cmdline`, "utf8").replace(/\0/g, " ");
    } catch {
      continue;
    }

    const isOurs =
      cmdline.includes("cloudflared") &&
      cmdline.includes("tunnel") &&
      cmdline.includes(`localhost:${port}`);

    if (isOurs) {
      try {
        process.kill(pid, "SIGKILL");
        log(`killed stale cloudflared pid ${pid}`);
      } catch {
        /* already gone */
      }
    }
  }
}

function spawnTunnel(port: number): void {
  mkdirSync(STATE_DIR, { recursive: true });

  try {
    rmSync(URL_FILE, { force: true });
  } catch {
    /* ignore */
  }

  log(`spawning cloudflared -> http://localhost:${port}`);
  // Truncate, then stream cloudflared's output into the log so the hostname
  // can be picked out of it.
  try {
    writeFileSync(LOG_FILE, "");
  } catch {
    /* ignore */
  }

  let outFd: number;
  try {
    outFd = openSync(LOG_FILE, "a");
  } catch {
    outFd = 1;
  }

  const proc = spawn(
    BIN,
    ["tunnel", "--url", `http://localhost:${port}`, "--no-autoupdate", "--protocol", "http2"],
    {
      detached: true,
      stdio: ["ignore", outFd, outFd],
    },
  );
  proc.unref();

  child = proc;
  lastSpawnAt = Date.now();
  try {
    writeFileSync(PID_FILE, String(proc.pid ?? 0));
  } catch {
    /* ignore */
  }

  // Watch the log for the assigned hostname.
  let seen = 0;
  const timer = setInterval(() => {
    seen += 1;
    try {
      const text = existsSync(LOG_FILE) ? readFileSync(LOG_FILE, "utf8") : "";
      const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        writeFileSync(URL_FILE, match[0]);
        log(`tunnel up: ${match[0]}`);
        clearInterval(timer);
        return;
      }
    } catch {
      /* ignore */
    }
    if (seen > 30) clearInterval(timer);
  }, 1000);
  timer.unref();
}

async function restartTunnel(port: number): Promise<void> {
  const pid = readPid();
  killStale(pid, port);
  if (pidAlive(pid)) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      /* ignore */
    }
  }
  if (child) {
    try {
      child.kill("SIGKILL");
    } catch {
      /* ignore */
    }
    child = null;
  }
  await new Promise((r) => setTimeout(r, 2500));

  if (!existsSync(BIN)) {
    log("cloudflared binary missing — downloading");
    await downloadBinary();
  }
  spawnTunnel(port);
}

export function startTunnelSupervisor(): void {
  const port = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;

  // Local Windows development has no need for a public tunnel, and spawning a
  // downloaded binary there requires extra setup. The sandbox (Linux) is where
  // the public URL matters.
  if (process.platform === "win32") {
    log("skipped on win32 — run scripts/tunnel.sh manually if you need a public URL");
    return;
  }

  try {
    mkdirSync(STATE_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
  log(`supervisor attached to Next.js server (port ${port})`);

  const tick = async () => {
    try {
      // The platform keeps the app alive; if it is down we must NOT churn the
      // tunnel (that would rotate the URL for no reason).
      if (!(await appHealthy(port))) {
        if (Date.now() - lastLoggedAppDown > 60_000) {
          lastLoggedAppDown = Date.now();
          log("app not healthy yet — leaving the tunnel alone");
        }
        return;
      }

      const pid = readPid();
      const url = currentUrl();
      const alive = pidAlive(pid) || Boolean(child?.pid && pidAlive(child.pid));

      // Healthy case: a live tunnel whose hostname we know AND that Cloudflare
      // can actually serve through.
      if (alive && url) {
        const code = await statusOf(`${url}/api/health`, 10_000);
        if (code === 200) {
          restarts = 0;
          return;
        }
        log(`edge returned ${code} (1033 symptom) — recycling tunnel`);
      } else if (alive && !url) {
        // A tunnel we just spawned may still be negotiating its hostname.
        if (Date.now() - lastSpawnAt < 60_000) return;
        log("tunnel alive but no hostname recorded — recycling");
      } else {
        log("no live cloudflared — starting one");
      }

      restarts += 1;
      if (restarts > MAX_CONSECUTIVE_RESTARTS) {
        log("too many restart attempts — backing off until next check");
        restarts = MAX_CONSECUTIVE_RESTARTS;
        return;
      }
      await restartTunnel(port);
    } catch (e) {
      log(`supervisor error: ${(e as Error).message}`);
    }
  };

  // Initial check shortly after boot so the server is not slowed down.
  setTimeout(() => void tick(), 4000).unref();
  setInterval(() => void tick(), CHECK_MS).unref();

  // Keep the adopted tunnel across restarts, but never leak a process if the
  // whole server is being torn down for good.
  const cleanup = () => {
    try {
      const pid = readPid();
      if (pidAlive(pid) && pid !== process.pid) {
        log(`server exiting — leaving cloudflared (${pid}) running for reuse`);
      }
    } catch {
      /* ignore */
    }
  };
  process.on("exit", cleanup);
}
