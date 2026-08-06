import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";

interface CategoryRow {
  Category_ID: number;
  Category_Name: string;
  Description: string | null;
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<CategoryRow>("SELECT * FROM Category ORDER BY Category_Name");
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addCategory(req: Request, res: Response): Promise<void> {
  const data = req.body ?? {};
  const { err } = await dbExecute(
    "INSERT INTO Category (Category_Name, Description) VALUES (?, ?)",
    [data.Category_Name ?? null, data.Description ?? null],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const data = req.body ?? {};
  const { err } = await dbExecute(
    "UPDATE Category SET Category_Name=?, Description=? WHERE Category_ID=?",
    [data.Category_Name ?? null, data.Description ?? null, req.params.catId],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM Category WHERE Category_ID=?", [req.params.catId]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
