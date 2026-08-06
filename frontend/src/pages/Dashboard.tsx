import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Badge, Spinner } from "../components/ui";

interface Stats {
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

interface Order {
  Order_ID: number;
  Customer_Name?: string;
  Total_Amount: number;
  Status: string;
}

interface LowStock {
  Product_Name: string;
  Warehouse_Name?: string;
  Quantity: number;
  Stock_Status: string;
}

const inr = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, o, l] = await Promise.all([
          api.get<Stats>("/dashboard/stats"),
          api.get<Order[]>("/orders"),
          api.get<LowStock[]>("/inventory/low-stock"),
        ]);
        setStats(s);
        setOrders(Array.isArray(o) ? o.slice(0, 6) : []);
        setLowStock(Array.isArray(l) ? l : []);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  const cards = [
    { label: "Suppliers", value: stats?.active_suppliers, tone: "bg-green-100 text-green-700" },
    { label: "Products", value: stats?.available_products, tone: "bg-blue-100 text-blue-700" },
    { label: "Customers", value: stats?.total_customers, tone: "bg-purple-100 text-purple-700" },
    { label: "Total Orders", value: stats?.total_orders, tone: "bg-orange-100 text-orange-700" },
    { label: "Warehouses", value: stats?.active_warehouses, tone: "bg-teal-100 text-teal-700" },
    { label: "Distributors", value: stats?.active_distributors, tone: "bg-rose-100 text-rose-700" },
    { label: "Total Revenue", value: stats ? inr(stats.total_revenue) : undefined, tone: "bg-indigo-100 text-indigo-700" },
    { label: "Pending Orders", value: stats?.pending_orders, tone: "bg-yellow-100 text-yellow-700" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, <strong className="text-gray-800">{user?.username}</strong> 👋
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!stats && !error && <Spinner />}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-3 p-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-lg ${c.tone}`}>
              {c.value ?? "–"}
            </div>
            <div>
              <div className="text-[13px] font-medium text-gray-500">{c.label}</div>
              <div className="text-xl font-bold text-gray-800">{c.value ?? "–"}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Low stock warning */}
      <div className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Low Stock Alerts</h2>
        <div className="card overflow-hidden">
          {lowStock.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-green-600">
              All stock levels OK
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th-sort">Product</th>
                  <th className="th-sort">Warehouse</th>
                  <th className="th-sort">Qty</th>
                  <th className="th-sort">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStock.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm font-medium">{r.Product_Name}</td>
                    <td className="px-4 py-3 text-sm">{r.Warehouse_Name || "—"}</td>
                    <td className="px-4 py-3 text-sm">{r.Quantity}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge tone={r.Stock_Status === "OUT OF STOCK" ? "red" : "yellow"}>
                        {r.Stock_Status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Recent orders */}
      <div className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Recent Orders</h2>
        <div className="card overflow-hidden">
          {orders.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No orders yet</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th-sort">Order</th>
                  <th className="th-sort">Customer</th>
                  <th className="th-sort">Total</th>
                  <th className="th-sort">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.Order_ID}>
                    <td className="px-4 py-3 text-sm font-semibold">#{o.Order_ID}</td>
                    <td className="px-4 py-3 text-sm">{o.Customer_Name || o.Customer_ID}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{inr(o.Total_Amount)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        tone={
                          o.Status === "delivered"
                            ? "green"
                            : o.Status === "cancelled"
                            ? "red"
                            : "yellow"
                        }
                      >
                        {o.Status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/*__D3__*/}


    </div>
  );
}
