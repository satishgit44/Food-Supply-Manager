import { Request, Response } from "express";
import { callProcedure, dbQuery, countRows } from "../db";
import { serialize } from "../utils/serialize";

interface StatsRow {
  active_suppliers: number;
  available_products: number;
  total_customers: number;
  total_orders: number;
  active_warehouses: number;
  active_distributors: number;
  total_revenue: number;
  pending_orders: number;
  low_stock_items: number;
}

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const proc = await callProcedure<StatsRow>("sp_DashboardStats");
  if (proc.err) {
    // Fallback if stored procedure unavailable
    const activeSuppliers = await countRows(
      "SELECT COUNT(*) AS c FROM Supplier WHERE Status='active'",
    );
    const availableProducts = await countRows(
      "SELECT COUNT(*) AS c FROM Product WHERE Status='available'",
    );
    const totalCustomers = await countRows("SELECT COUNT(*) AS c FROM Customer");
    const totalOrders = await countRows("SELECT COUNT(*) AS c FROM OrderDetails");
    const activeWarehouses = await countRows(
      "SELECT COUNT(*) AS c FROM Warehouse WHERE Status='operational'",
    );
    const activeDistributors = await countRows(
      "SELECT COUNT(*) AS c FROM Distributor WHERE Status='active'",
    );
    const rev = await dbQuery<{ t: number }>(
      "SELECT COALESCE(SUM(Total_Amount),0) AS t FROM OrderDetails",
      [],
      "one",
    );
    const pending = await countRows(
      "SELECT COUNT(*) AS c FROM OrderDetails WHERE Status='pending'",
    );
    const low = await countRows("SELECT COUNT(*) AS c FROM Inventory WHERE Quantity <= Reorder_Level");
    res.json({
      active_suppliers: activeSuppliers,
      available_products: availableProducts,
      total_customers: totalCustomers,
      total_orders: totalOrders,
      active_warehouses: activeWarehouses,
      active_distributors: activeDistributors,
      total_revenue: Number((rev.rows as { t: number } | null)?.t ?? 0),
      pending_orders: pending,
      low_stock_items: low,
    });
    return;
  }
  const row = proc.rows[0];
  res.json(
    row
      ? serialize(row)
      : {
          active_suppliers: 0,
          available_products: 0,
          total_customers: 0,
          total_orders: 0,
          active_warehouses: 0,
          active_distributors: 0,
          total_revenue: 0,
          pending_orders: 0,
          low_stock_items: 0,
        },
  );
}
