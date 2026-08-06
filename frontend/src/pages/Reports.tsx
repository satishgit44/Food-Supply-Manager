import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Spinner } from "../components/ui";

type Row = Record<string, any>;

function ReportTable({ title, rows }: { title: string; rows: Row[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="card mb-5 p-6 text-sm text-gray-400">
        <h3 className="mb-2 font-semibold text-gray-700">{title}</h3>
        No data
      </div>
    );
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="card mb-5 overflow-hidden">
      <h3 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-700">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c) => (
                <th key={c} className="th-sort">
                  {c.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {cols.map((c) => (
                  <td key={c} className="px-4 py-3 text-sm text-gray-700">
                    {r[c] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("inventory");
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [inv, sup, rev, top] = await Promise.all([
          api.get<Row[]>("/reports/inventory-status"),
          api.get<Row[]>("/reports/supplier-performance"),
          api.get<Row[]>("/reports/revenue-by-category"),
          api.get<Row[]>("/reports/top-customers"),
        ]);
        setData({
          inventory: Array.isArray(inv) ? inv : [],
          suppliers: Array.isArray(sup) ? sup : [],
          revenue: Array.isArray(rev) ? rev : [],
          customers: Array.isArray(top) ? top : [],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadMonthly() {
    setLoading(true);
    try {
      const rows = await api.get<Row[]>(`/reports/monthly-sales?year=${year}&month=${month}`);
      setData((d) => ({ ...d, monthly: Array.isArray(rows) ? rows : [] }));
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "inventory", label: "Inventory Status" },
    { id: "suppliers", label: "Supplier Performance" },
    { id: "revenue", label: "Revenue by Category" },
    { id: "customers", label: "Top Customers" },
    { id: "monthly", label: "Monthly Sales" },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Reports</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "monthly" && (
        <div className="mb-4 flex items-end gap-2">
          <div>
            <label className="label">Year</label>
            <input className="input w-32" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div>
            <label className="label">Month</label>
            <input className="input w-32" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={loadMonthly}>
            Load
          </button>
        </div>
      )}

      {loading && <Spinner />}

      {tab === "inventory" && <ReportTable title="Inventory Status" rows={data.inventory ?? []} />}
      {tab === "suppliers" && <ReportTable title="Supplier Performance" rows={data.suppliers ?? []} />}
      {tab === "revenue" && <ReportTable title="Revenue by Category" rows={data.revenue ?? []} />}
      {tab === "customers" && <ReportTable title="Top Customers" rows={data.customers ?? []} />}
      {tab === "monthly" && <ReportTable title={`Monthly Sales (${year}-${month})`} rows={data.monthly ?? []} />}
    </div>
  );
}
