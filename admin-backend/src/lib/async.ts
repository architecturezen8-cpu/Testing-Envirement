import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async route handler so rejections reach the error middleware
 * instead of becoming unhandled promise rejections (Express 4).
 */
export function asyncHandler(
  fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
