import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config, WRITE_ROLES, ADMIN_ROLES } from "../config";

export interface AuthUser {
  id: number;
  username: string;
  role: "admin" | "manager" | "viewer";
}

// Extend Express Request with an optional authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const COOKIE_NAME = "fsm_token";

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"] },
  );
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 12 * 60 * 60 * 1000, // 12h
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, path: "/" });
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Constant-time compare of a derived buffer against a hex digest string. */
function hexDigestEqual(derived: Buffer, expectedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/**
 * Verify a Werkzeug `pbkdf2:...` hash produced by the original Flask app.
 * Format: `pbkdf2:<hash>:<iterations>$<salt_string>$<digest_hex>`
 * The salt is the raw ASCII salt text (utf8) and the digest is hex.
 */
function verifyWerkzeugPkdf2(plain: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    const params = parts[0].split(":");
    if (params[0] !== "pbkdf2") return false;
    const method = params[1] ?? "sha256";
    const iterations = parseInt(params[2] ?? "1", 10);
    const salt = Buffer.from(parts[1], "utf8");
    const expectedHex = parts[2].toLowerCase();
    const keyLen = Buffer.from(expectedHex, "hex").length;
    const derived = crypto.pbkdf2Sync(plain, salt, iterations, keyLen, method);
    return hexDigestEqual(derived, expectedHex);
  } catch {
    return false;
  }
}

/**
 * Verify a Werkzeug `scrypt:...` hash produced by the original Flask app.
 * Format: `scrypt:<n>:<r>:<p>$<salt_string>$<digest_hex>`
 * Werkzeug derives a 64-byte key with `hashlib.scrypt(password, salt=salt_text_bytes,
 * n, r, p)` and stores the hex digest; the salt is the raw ASCII salt text (utf8).
 */
function verifyWerkzeugScrypt(plain: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    const params = parts[0].split(":");
    if (params[0] !== "scrypt") return false;
    const n = parseInt(params[1] ?? "32768", 10);
    const r = parseInt(params[2] ?? "8", 10);
    const p = parseInt(params[3] ?? "1", 10);
    const salt = Buffer.from(parts[1], "utf8");
    const expectedHex = parts[2].toLowerCase();
    // Node defaults to a 32MB maxmem cap which is too low for n=32768,r=8.
    // Replicate Werkzeug's memory allowance (132 * n * r * p).
    const derived = crypto.scryptSync(plain, salt, 64, {
      N: n,
      r,
      p,
      maxmem: 132 * n * r * p,
    });
    return hexDigestEqual(derived, expectedHex);
  } catch {
    return false;
  }
}

/**
 * Verify a password against:
 *  - a bcrypt hash (new accounts created by this API), or
 *  - a Werkzeug pbkdf2 / scrypt hash (accounts created by the original Flask
 *    app via setup_users.py), so existing users keep working without rehashing.
 */
export function verifyPassword(plain: string, hash: string): boolean {
  if (!hash) return false;
  if (hash.startsWith("pbkdf2:")) return verifyWerkzeugPkdf2(plain, hash);
  if (hash.startsWith("scrypt:")) return verifyWerkzeugScrypt(plain, hash);
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireWrite(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!WRITE_ROLES.has(req.user.role)) {
    res.status(403).json({ error: "You do not have permission to perform this action" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!ADMIN_ROLES.has(req.user.role)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
