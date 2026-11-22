import express from "express";
import { requireAdmin } from "./middleware/auth";
import { notFoundHandler, errorHandler } from "./middleware/errors";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { productsRouter } from "./routes/products";
import { collectionsRouter } from "./routes/collections";
import { categoriesRouter } from "./routes/categories";
import { discountsRouter } from "./routes/discounts";
import { reviewsRouter } from "./routes/reviews";
import { ordersRouter } from "./routes/orders";
import { stockRouter } from "./routes/stock";
import { ticketsRouter } from "./routes/tickets";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  // Unauthenticated health probe — for load balancers / monitoring.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "stv-matale-admin-backend" });
  });

  // Auth routes (login is public, /me requires a token)
  app.use("/api/auth", authRouter);

  // Admin routes — all require a Bearer admin token
  app.use("/api/dashboard", requireAdmin, dashboardRouter);
  app.use("/api/products", requireAdmin, productsRouter);
  app.use("/api/collections", requireAdmin, collectionsRouter);
  app.use("/api/categories", requireAdmin, categoriesRouter);
  app.use("/api/discounts", requireAdmin, discountsRouter);
  app.use("/api/reviews", requireAdmin, reviewsRouter);
  app.use("/api/orders", requireAdmin, ordersRouter);
  app.use("/api/stock", requireAdmin, stockRouter);
  app.use("/api/tickets", requireAdmin, ticketsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
