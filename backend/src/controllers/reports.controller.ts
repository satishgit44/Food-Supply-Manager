import { Request, Response } from "express";
import { dbQuery, getConnection } from "../db";
import { serialize } from "../utils/serialize";

export async function reportInventory(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery(
    "SELECT * FROM vw_InventoryStatus ORDER BY Stock_Status, Product_Name",
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function reportPayments(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery("SELECT * FROM vw_PaymentSummary ORDER BY Order_ID");
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function reportSuppliers(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery(
    "SELECT * FROM vw_SupplierPerformance ORDER BY Total_Revenue DESC",
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function reportRevenueByCategory(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery(
    `SELECT p.Category, COUNT(od.Order_ID) AS Orders,
            SUM(od.Quantity) AS Units_Sold,
            COALESCE(SUM(od.Total_Amount), 0) AS Revenue
     FROM OrderDetails od
     JOIN Product p ON od.Product_ID = p.Product_ID
     GROUP BY p.Category
     ORDER BY Revenue DESC`,
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function reportTopCustomers(_req: Request, res: Response): Promise<void> {
  const { rows, err } = await dbQuery(
    `SELECT c.Customer_Name, c.City, c.Customer_Type,
            COUNT(od.Order_ID) AS Total_Orders,
            COALESCE(SUM(od.Total_Amount), 0) AS Total_Spent
     FROM Customer c
     JOIN OrderDetails od ON c.Customer_ID = od.Customer_ID
     GROUP BY c.Customer_ID, c.Customer_Name, c.City, c.Customer_Type
     ORDER BY Total_Spent DESC
     LIMIT 10`,
  );
  if (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.json(serialize(rows));
}

export async function reportMonthlySales(req: Request, res: Response): Promise<void> {
  const today = new Date();
  const year = parseInt(String(req.query.year ?? today.getFullYear()), 10);
  const month = parseInt(String(req.query.month ?? today.getMonth() + 1), 10);
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.query("CALL sp_MonthlySalesReport(?, ?)", [year, month]);
    // `rows` is the procedure's result set; some mysql2/promise versions wrap
    // CALL results in an extra array, so unwrap one level if present.
    const anyRows = rows as unknown;
    const result = Array.isArray(anyRows) && Array.isArray((anyRows as unknown[])[0])
      ? (anyRows as unknown[][])[0]
      : anyRows;
    res.json(serialize(result));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  } finally {
    if (conn) conn.release();
  }
}
