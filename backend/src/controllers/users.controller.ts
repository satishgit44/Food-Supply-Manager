import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";
import { hashPassword, verifyPassword } from "../middleware/auth";

interface UserRow {
  id: number;
  username: string;
  role: string;
  is_active: number;
  created_at: string | null;
  full_name: string | null;
  email: string | null;
  password_hash?: string;
}

export async function getUsers(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<UserRow>(
    "SELECT id, username, role, is_active, created_at FROM Users ORDER BY id",
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { role, is_active } = d;
  if (role && !["admin", "manager", "viewer"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  const { err } = await dbExecute(
    "UPDATE Users SET role=COALESCE(?, role), is_active=COALESCE(?, is_active) WHERE id=?",
    [role ?? null, is_active ?? null, req.params.userId],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  if (req.user && Number(req.params.userId) === req.user.id) {
    res.status(403).json({ error: "You cannot delete yourself" });
    return;
  }
  const { err } = await dbExecute("DELETE FROM Users WHERE id=?", [req.params.userId]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function changeOwnPassword(req: Request, res: Response): Promise<void> {
  const { current_password, new_password } = req.body ?? {};
  if (!current_password || !new_password) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const userId = req.user?.id;
  const { rows } = await dbQuery<{ password_hash: string }>(
    "SELECT password_hash FROM Users WHERE id=?",
    [userId],
    "one",
  );
  const user = rows as { password_hash: string } | null;
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (!verifyPassword(String(current_password), user.password_hash)) {
    res.status(400).json({ error: "Incorrect current password" });
    return;
  }
  const { err } = await dbExecute("UPDATE Users SET password_hash=? WHERE id=?", [
    hashPassword(String(new_password)),
    userId,
  ]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
