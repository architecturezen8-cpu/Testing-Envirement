import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

const server = app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`[admin-backend] listening on port ${config.PORT} (${config.NODE_ENV})`);
});

server.on("error", (error) => {
  console.error("[admin-backend] failed to start:", error);
  process.exit(1);
});
