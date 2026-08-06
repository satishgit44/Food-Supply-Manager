import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";

interface PaymentRow {
  Payment_ID: number;
  Order_ID: number;
  Amount: number;
  Payment_Date: string;
  Payment_Method: string;
  Payment_Status: string;
  Transaction_Ref: string | null;
  Notes: string | null;
  Order_Total?: number;
  Customer_Name?: string | null;
}

export async function getPayments(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<PaymentRow>(
    `SELECT py.*, od.Total_Amount AS Order_Total, c.Customer_Name
     FROM Payment py
     JOIN OrderDetails od ON py.Order_ID = od.Order_ID
     LEFT JOIN Customer c ON od.Customer_ID = c.Customer_ID
     ORDER BY py.Payment_Date DESC`,
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addPayment(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `INSERT INTO Payment (Order_ID, Amount, Payment_Date, Payment_Method,
                          Payment_Status, Transaction_Ref, Notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      d.Order_ID,
      d.Amount,
      d.Payment_Date,
      d.Payment_Method ?? "cash",
      d.Payment_Status ?? "completed",
      d.Transaction_Ref ?? null,
      d.Notes ?? null,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updatePayment(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `UPDATE Payment SET Amount=?, Payment_Date=?, Payment_Method=?, Payment_Status=?,
            Transaction_Ref=?, Notes=? WHERE Payment_ID=?`,
    [
      d.Amount,
      d.Payment_Date,
      d.Payment_Method ?? null,
      d.Payment_Status ?? null,
      d.Transaction_Ref ?? null,
      d.Notes ?? null,
      req.params.payId,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deletePayment(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM Payment WHERE Payment_ID=?", [req.params.payId]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
