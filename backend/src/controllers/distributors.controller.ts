import { Request, Response } from "express";
import { dbQuery, dbExecute } from "../db";
import { serialize } from "../utils/serialize";

interface DistributorRow {
  Distributor_ID: number;
  Distributor_Name: string;
  City: string | null;
  Contact_No: string | null;
  Email: string | null;
  Region: string | null;
  Vehicle_Count: number;
  Status: string;
}

export async function getDistributors(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<DistributorRow>(
    "SELECT * FROM Distributor ORDER BY Distributor_ID",
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addDistributor(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `INSERT INTO Distributor (Distributor_ID, Distributor_Name, City, Contact_No,
                              Email, Region, Vehicle_Count, Status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.Distributor_ID,
      d.Distributor_Name,
      d.City ?? null,
      d.Contact_No ?? null,
      d.Email ?? null,
      d.Region ?? null,
      d.Vehicle_Count ?? 0,
      d.Status ?? "active",
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updateDistributor(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `UPDATE Distributor SET Distributor_Name=?, City=?, Contact_No=?, Email=?, Region=?,
            Vehicle_Count=?, Status=? WHERE Distributor_ID=?`,
    [
      d.Distributor_Name,
      d.City ?? null,
      d.Contact_No ?? null,
      d.Email ?? null,
      d.Region ?? null,
      d.Vehicle_Count ?? 0,
      d.Status ?? "active",
      req.params.dId,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteDistributor(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM Distributor WHERE Distributor_ID=?", [
    req.params.dId,
  ]);
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
