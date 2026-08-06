import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";

interface InventoryRow {
  Inventory_ID: number;
  Product_ID: number;
  Warehouse_ID: number;
  Quantity: number;
  Reorder_Level: number;
  Last_Restocked: string | null;
  Product_Name?: string;
  Warehouse_Name?: string;
  Stock_Status?: string;
}

export async function getInventory(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<InventoryRow>(
    "SELECT * FROM vw_InventoryStatus ORDER BY Product_Name",
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function getLowStock(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<InventoryRow>(
    "SELECT * FROM vw_InventoryStatus WHERE Stock_Status IN ('LOW STOCK', 'OUT OF STOCK')",
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addInventory(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `INSERT INTO Inventory (Product_ID, Warehouse_ID, Quantity, Reorder_Level, Last_Restocked)
     VALUES (?, ?, ?, ?, ?)`,
    [
      d.Product_ID,
      d.Warehouse_ID,
      d.Quantity ?? 0,
      d.Reorder_Level ?? 10,
      d.Last_Restocked ?? null,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updateInventory(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `UPDATE Inventory SET Quantity=?, Reorder_Level=?, Last_Restocked=? WHERE Inventory_ID=?`,
    [d.Quantity ?? 0, d.Reorder_Level ?? 10, d.Last_Restocked ?? null, req.params.invId],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteInventory(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM Inventory WHERE Inventory_ID=?", [req.params.invId]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
