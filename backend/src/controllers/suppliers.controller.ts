import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";

interface SupplierRow {
  Supplier_ID: number;
  Supplier_Name: string;
  City: string | null;
  Contact_No: string | null;
  Email: string | null;
  Address: string | null;
  Status: string;
}

export async function getSuppliers(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<SupplierRow>("SELECT * FROM Supplier ORDER BY Supplier_ID");
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addSupplier(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `INSERT INTO Supplier (Supplier_ID, Supplier_Name, City, Contact_No, Email, Address, Status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      d.Supplier_ID,
      d.Supplier_Name,
      d.City ?? null,
      d.Contact_No ?? null,
      d.Email ?? null,
      d.Address ?? null,
      d.Status ?? "active",
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updateSupplier(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `UPDATE Supplier SET Supplier_Name=?, City=?, Contact_No=?, Email=?, Address=?, Status=?
     WHERE Supplier_ID=?`,
    [
      d.Supplier_Name,
      d.City ?? null,
      d.Contact_No ?? null,
      d.Email ?? null,
      d.Address ?? null,
      d.Status ?? "active",
      req.params.sId,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteSupplier(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM Supplier WHERE Supplier_ID=?", [req.params.sId]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
