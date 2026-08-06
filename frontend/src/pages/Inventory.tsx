import React from "react";
import CrudPage, { CrudField } from "../components/CrudPage";
import { api } from "../api/client";

const loadProducts = async () => {
  const data = await api.get<Record<string, any>[]>("/products");
  return data.map((p) => ({ value: p.Product_ID, label: `${p.Product_ID} - ${p.Product_Name}` }));
};

const loadWarehouses = async () => {
  const data = await api.get<Record<string, any>[]>("/warehouses");
  return data.map((w) => ({ value: w.Warehouse_ID, label: w.Warehouse_Name }));
};

export default function Inventory() {
  const fields: CrudField[] = [
    { name: "Product_ID", label: "Product", type: "select", optionsLoader: loadProducts, required: true },
    { name: "Warehouse_ID", label: "Warehouse", type: "select", optionsLoader: loadWarehouses, required: true },
    { name: "Quantity", label: "Quantity", type: "number", required: true },
    { name: "Reorder_Level", label: "Reorder Level", type: "number" },
    { name: "Last_Restocked", label: "Last Restocked", type: "date" },
  ];

  return (
    <CrudPage
      title="Inventory"
      apiPath="/inventory"
      idField="Inventory_ID"
      columns={[
        { key: "Product_Name", label: "Product" },
        { key: "Warehouse_Name", label: "Warehouse" },
        { key: "Quantity", label: "Quantity" },
        { key: "Reorder_Level", label: "Reorder Lvl" },
        { key: "Stock_Status", label: "Status", status: true },
      ]}
      fields={fields}
    />
  );
}
