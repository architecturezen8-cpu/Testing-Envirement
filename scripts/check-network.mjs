/**
 * Checks outbound connectivity from your machine.
 *
 * Run this if the local site cannot load products, or ticket emails are
 * skipped — it tells you which of the three services the app talks to is
 * actually reachable.
 *
 * Usage: npx tsx scripts/check-network.mjs
 */
import dns from "node:dns/promises";
import net from "node:net";
import "dotenv/config";

const TARGETS = [
  { label: "Database (Supabase)", host: "aws-0-ap-northeast-2.pooler.supabase.com", port: 5432 },
  { label: "Email (Gmail SMTP)", host: "smtp.gmail.com", port: 465 },
  { label: "Images (Pexels)", host: "images.pexels.com", port: 443 },
];

function probe(host, port, timeout = 8000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = net.connect({ host, port, timeout });
    const done = (ok, detail) => {
      socket.destroy();
      resolve({ ok, ms: Date.now() - started, detail });
    };
    socket.on("connect", () => done(true, "connected"));
    socket.on("timeout", () => done(false, "timed out"));
    socket.on("error", (e) => done(false, e.code || e.message));
  });
}

console.log("\n--- Network check ---\n");

const url = (process.env.DATABASE_URL || "").match(/@([^:]+):(\d+)/);
if (url) {
  TARGETS[0].host = url[1];
  TARGETS[0].port = Number(url[2]);
  console.log(`(using DB host from .env: ${url[1]}:${url[2]})\n`);
}

for (const t of TARGETS) {
  process.stdout.write(`${t.label.padEnd(24)} ${t.host}:${t.port} … `);

  let ips = [];
  try {
    const r = await dns.lookup(t.host, { all: true });
    ips = r.map((x) => x.address);
  } catch (e) {
    console.log(`✗ DNS FAILED (${e.code})`);
    continue;
  }

  const suspicious = ips.filter((ip) => /^(127\.|10\.|192\.168\.|fd00:)/.test(ip));
  if (suspicious.length) {
    console.log(`✗ RESOLVED TO PRIVATE IP: ${ips.join(", ")}`);
    console.log("   → Your network/DNS is intercepting this hostname.");
    continue;
  }

  const r = await probe(t.host, t.port);
  console.log(r.ok ? `✓ reachable (${r.ms}ms)` : `✗ ${r.detail}`);
}

console.log(
  "\nIf any row shows a private IP or a timeout:\n" +
    "  • Try a different network (mobile hotspot is the quickest test)\n" +
    "  • School/office networks often block outbound port 5432 (Postgres)\n" +
    "  • A VPN or DNS filtering service can intercept hostnames\n\n",
);
