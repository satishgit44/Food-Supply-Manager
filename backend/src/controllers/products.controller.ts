import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";

interface ProductRow {
  Product_ID: number;
  Product_Name: string;
  Category: string | null;
  Category_ID: number | null;
  Price: number;
  Unit: string;
  Supplier_ID: number | null;
  Status: string;
  Supplier_Name?: string | null;
  Category_Name?: string | null;
}

async function resolveCategoryName(categoryId: unknown): Promise<string | null> {
  if (!categoryId) return null;
  const { rows } = await dbQuery<{ Category_Name: string }>(
    "SELECT Category_Name FROM Category WHERE Category_ID=?",
    [categoryId],
    "one",
  );
  const r = rows as { Category_Name: string } | null;
  return r ? r.Category_Name : null;
}

export async function getProducts(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<ProductRow>(
    `SELECT p.*, s.Supplier_Name, c.Category_Name
     FROM Product p
     LEFT JOIN Supplier s ON p.Supplier_ID = s.Supplier_ID
     LEFT JOIN Category c ON p.Category_ID = c.Category_ID
     ORDER BY p.Product_ID`,
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addProduct(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const catId = d.Category_ID ?? null;
  let categoryName = d.Category ?? null;
  if (catId && !categoryName) {
    categoryName = await resolveCategoryName(catId);
  }
  const { err } = await dbExecute(
    `INSERT INTO Product (Product_ID, Product_Name, Category, Category_ID, Price, Unit, Supplier_ID, Status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.Product_ID,
      d.Product_Name,
      categoryName,
      catId,
      d.Price ?? 0,
      d.Unit ?? "kg",
      d.Supplier_ID ?? null,
      d.Status ?? "available",
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const catId = d.Category_ID ?? null;
  let categoryName = d.Category ?? null;
  if (catId) {
    const resolved = await resolveCategoryName(catId);
    if (resolved) categoryName = resolved;
  }
  const { err } = await dbExecute(
    `UPDATE Product SET Product_Name=?, Category=?, Category_ID=?, Price=?, Unit=?, Supplier_ID=?, Status=?
     WHERE Product_ID=?`,
    [
      d.Product_Name,
      categoryName,
      catId,
      d.Price ?? 0,
      d.Unit ?? "kg",
      d.Supplier_ID ?? null,
      d.Status ?? "available",
      req.params.pId,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM Product WHERE Product_ID=?", [req.params.pId]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
