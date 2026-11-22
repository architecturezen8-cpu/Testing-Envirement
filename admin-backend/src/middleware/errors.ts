import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const e = err as ErrorWithStatus;
  const status = typeof e?.status === "number" ? e.status : 500;

  if (status >= 500) {
    console.error("[admin-backend] Unhandled error:", err);
  }

  res.status(status).json({
    error: status >= 500 ? "Internal server error" : e.message || "Bad request",
  });
}
