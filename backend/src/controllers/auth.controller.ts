import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";
import { config } from "../config";
import {
  AuthUser,
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from "../middleware/auth";

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "manager" | "viewer";
  is_active: number;
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ success: false, message: "Missing username or password" });
    return;
  }
  const { rows, err } = await dbQuery<UserRow>(
    "SELECT * FROM Users WHERE username=? AND is_active=1",
    [String(username).trim()],
    "one",
  );
  if (err) {
    res.status(500).json({ success: false, message: err });
    return;
  }
  const user = rows as UserRow | null;
  if (user && verifyPassword(String(password), user.password_hash)) {
    const authUser: AuthUser = { id: user.id, username: user.username, role: user.role };
    const token = signToken(authUser);
    setAuthCookie(res, token);
    res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    });
    return;
  }
  res.status(401).json({ success: false, message: "Invalid credentials" });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.json({ success: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.user });
}

export async function register(req: Request, res: Response): Promise<void> {
  if (!config.allowRegistration) {
    res.status(403).json({ success: false, message: "Registration is disabled" });
    return;
  }
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ success: false, message: "Missing fields" });
    return;
  }
  const existing = await dbQuery<{ id: number }>(
    "SELECT id FROM Users WHERE username=?",
    [String(username).trim()],
    "one",
  );
  if (existing.rows) {
    res.status(409).json({ success: false, message: "Username already exists" });
    return;
  }
  const { err } = await dbExecute(
    "INSERT INTO Users (username, password_hash, role) VALUES (?, ?, 'viewer')",
    [String(username).trim(), hashPassword(String(password))],
  );
  if (err) {
    res.status(500).json({ success: false, message: err });
    return;
  }
  res.json({ success: true });
}

// Re-export serialize for controller convenience
export { serialize };
