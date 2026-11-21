/**
 * Next.js instrumentation hook — runs once when the server process boots.
 *
 * Used to attach the Cloudflare tunnel supervisor to the app's own lifetime.
 * The sandbox reaps external background jobs, which left the tunnel dead and
 * produced error 1033. Because the platform keeps this server process alive
 * (the preview depends on it), supervising cloudflared from here keeps the
 * public URL working whenever the app is up.
 *
 * Set NOVA_TUNNEL_DISABLE=1 to opt out.
 */
export async function register() {
  // eslint-disable-next-line no-console
  console.log("[nova-tunnel] instrumentation register() invoked, runtime =", process.env.NEXT_RUNTIME);
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NOVATUNNEL_DISABLE === "1") return;

  try {
    const { startTunnelSupervisor } = await import("./tunnel-supervisor");
    startTunnelSupervisor();
  } catch (e) {
    // Never let tunnel supervision break the application.
    // eslint-disable-next-line no-console
    console.error("[nova-tunnel] supervisor failed to start:", (e as Error).message);
  }
}
