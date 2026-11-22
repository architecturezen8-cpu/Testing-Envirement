import { SignJWT, jwtVerify } from "jose";
import { config } from "../config";

const secret = new TextEncoder().encode(config.JWT_SECRET);

export interface AdminTokenPayload {
  sub: string;
  role: "admin";
}

export async function signAdminToken(username: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${config.TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub === "string" && payload.role === "admin") {
      return { sub: payload.sub, role: "admin" };
    }
    return null;
  } catch {
    return null;
  }
}
