import type { NextFunction, Request, Response } from "express";
import { verifyAdminToken } from "../lib/jwt";

export interface AuthedRequest extends Request {
  admin?: { sub: string; role: "admin" };
}

export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const session = await verifyAdminToken(header.slice("Bearer ".length));
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.admin = session;
  next();
}
