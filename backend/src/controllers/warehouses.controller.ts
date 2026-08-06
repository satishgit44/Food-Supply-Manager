import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";

interface WarehouseRow {
  Warehouse_ID: number;
  Warehouse_Name: string;
  City: string | null;
  Address: string | null;
  Capacity_Tons: number;
  Manager_Name: string | null;
  Contact_No: string | null;
  Status: string;
}

export async function getWarehouses(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<WarehouseRow>("SELECT * FROM Warehouse ORDER BY Warehouse_ID");
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addWarehouse(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `INSERT INTO Warehouse (Warehouse_ID, Warehouse_Name, City, Address, Capacity_Tons,
                            Manager_Name, Contact_No, Status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.Warehouse_ID,
      d.Warehouse_Name,
      d.City ?? null,
      d.Address ?? null,
      d.Capacity_Tons ?? 0,
      d.Manager_Name ?? null,
      d.Contact_No ?? null,
      d.Status ?? "operational",
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updateWarehouse(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `UPDATE Warehouse SET Warehouse_Name=?, City=?, Address=?, Capacity_Tons=?,
            Manager_Name=?, Contact_No=?, Status=? WHERE Warehouse_ID=?`,
    [
      d.Warehouse_Name,
      d.City ?? null,
      d.Address ?? null,
      d.Capacity_Tons ?? 0,
      d.Manager_Name ?? null,
      d.Contact_No ?? null,
      d.Status ?? "operational",
      req.params.wId,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteWarehouse(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM Warehouse WHERE Warehouse_ID=?", [req.params.wId]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
