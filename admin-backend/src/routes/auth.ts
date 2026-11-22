import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import { signAdminToken } from "../lib/jwt";
import { requireAdmin, type AuthedRequest } from "../middleware/auth";
import { asyncHandler } from "../lib/async";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.issues.map((issue) => issue.message),
      });
      return;
    }

    const { username, password } = parsed.data;

    if (username !== config.ADMIN_USERNAME || password !== config.ADMIN_PASSWORD) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = await signAdminToken(username);
    res.json({
      token,
      expiresInSeconds: config.TOKEN_TTL_SECONDS,
      username,
    });
  })
);

authRouter.get(
  "/me",
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ username: req.admin!.sub, role: req.admin!.role });
  })
);
