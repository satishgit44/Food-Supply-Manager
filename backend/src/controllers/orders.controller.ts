import { Request, Response } from "express";
import { dbQuery, dbExecute, getConnection } from "../db";
import { serialize } from "../utils/serialize";
import { ApiError } from "../middleware/error";

interface OrderRow {
  Order_ID: number;
  Customer_ID: number | null;
  Product_ID: number | null;
  Quantity: number;
  Unit_Price: number;
  Total_Amount: number;
  Distributor_ID: number | null;
  Warehouse_ID: number | null;
  Order_Date: string;
  Delivery_Date: string | null;
  Status: string;
  Notes: string | null;
  Customer_Name?: string | null;
  Product_Name?: string | null;
  Distributor_Name?: string | null;
  Warehouse_Name?: string | null;
}

export async function getOrders(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery<OrderRow>(
    `SELECT od.*, c.Customer_Name, p.Product_Name,
            d.Distributor_Name, w.Warehouse_Name
     FROM OrderDetails od
     LEFT JOIN Customer c ON od.Customer_ID = c.Customer_ID
     LEFT JOIN Product p ON od.Product_ID = p.Product_ID
     LEFT JOIN Distributor d ON od.Distributor_ID = d.Distributor_ID
     LEFT JOIN Warehouse w ON od.Warehouse_ID = w.Warehouse_ID
     ORDER BY od.Order_ID DESC`,
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function addOrder(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const useProc = d.use_inventory_check !== false;

  if (useProc && d.Warehouse_ID) {
    let conn;
    try {
      conn = await getConnection();
      await conn.query(
        `CALL sp_PlaceOrder(?, ?, ?, ?, ?, ?, ?)`,
        [
          d.Order_ID,
          d.Customer_ID,
          d.Product_ID,
          d.Quantity,
          d.Distributor_ID ?? null,
          d.Warehouse_ID,
          d.Order_Date,
        ],
      );
      res.json({ success: true, message: "Order placed with inventory update" });
      return;
    } catch (e) {
      throw new ApiError((e as Error).message, 400);
    } finally {
      if (conn) conn.release();
    }
  }

  // Fallback direct insert (bypasses inventory check), like the original app.
  const product = await dbQuery<{ Price: number }>(
    "SELECT Price FROM Product WHERE Product_ID=?",
    [d.Product_ID],
    "one",
  );
  const unitPrice =
    d.Unit_Price ?? (product.rows as { Price: number } | null)?.Price ?? 0;

  const { err } = await dbExecute(
    `INSERT INTO OrderDetails (Order_ID, Customer_ID, Product_ID, Quantity, Unit_Price,
                               Distributor_ID, Warehouse_ID, Order_Date, Delivery_Date, Status, Notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.Order_ID,
      d.Customer_ID,
      d.Product_ID,
      d.Quantity,
      unitPrice,
      d.Distributor_ID ?? null,
      d.Warehouse_ID ?? null,
      d.Order_Date,
      d.Delivery_Date ?? null,
      d.Status ?? "pending",
      d.Notes ?? null,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function updateOrder(req: Request, res: Response): Promise<void> {
  const d = req.body ?? {};
  const { err } = await dbExecute(
    `UPDATE OrderDetails SET Customer_ID=?, Product_ID=?, Quantity=?, Unit_Price=?,
            Distributor_ID=?, Warehouse_ID=?, Order_Date=?, Delivery_Date=?, Status=?, Notes=?
     WHERE Order_ID=?`,
    [
      d.Customer_ID,
      d.Product_ID,
      d.Quantity,
      d.Unit_Price ?? 0,
      d.Distributor_ID ?? null,
      d.Warehouse_ID ?? null,
      d.Order_Date,
      d.Delivery_Date ?? null,
      d.Status ?? "pending",
      d.Notes ?? null,
      req.params.oId,
    ],
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}

export async function deleteOrder(req: Request, res: Response): Promise<void> {
  const { err } = await dbExecute("DELETE FROM OrderDetails WHERE Order_ID=?", [req.params.oId]);
  if (err) {
    // Order may have payment rows referenced (FK RESTRICT on cascade delete)
    res.status(500).json({ error: err });
    return;
  }
  res.json({ success: true });
}
