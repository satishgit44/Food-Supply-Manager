import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";

interface CustomerRow {
  Customer_ID: number;
  Customer_Name: string;
  City: string;
  Contact_No: string | null;
  Email: string | null;
  Address: string | null;
  Customer_Type: string;
}

export async function getCustomers(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<CustomerRow>("SELECT * FROM Customer ORDER BY Customer_ID");
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addCustomer(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const city = (d.City || "").trim() || "Mumbai";
  const { err } = await dbExecute(
    `INSERT INTO Customer (Customer_ID, Customer_Name, City, Contact_No, Email, Address, Customer_Type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      d.Customer_ID,
      d.Customer_Name,
      city,
      d.Contact_No ?? null,
      d.Email ?? null,
      d.Address ?? null,
      d.Customer_Type ?? "retail",
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const city = (d.City || "").trim() || "Mumbai";
  const { err } = await dbExecute(
    `UPDATE Customer SET Customer_Name=?, City=?, Contact_No=?, Email=?, Address=?, Customer_Type=?
     WHERE Customer_ID=?`,
    [
      d.Customer_Name,
      city,
      d.Contact_No ?? null,
      d.Email ?? null,
      d.Address ?? null,
      d.Customer_Type ?? "retail",
      req.params.cId,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM Customer WHERE Customer_ID=?", [req.params.cId]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
