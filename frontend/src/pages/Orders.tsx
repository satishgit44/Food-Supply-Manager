import React from "react";
import CrudPage, { CrudField } from "../components/CrudPage";
import { api } from "../api/client";

const loadCustomers = async () => {
  const data = await api.get<Record<string, any>[]>("/customers");
  return data.map((c) => ({ value: c.Customer_ID, label: c.Customer_Name }));
};

const loadProducts = async () => {
  const data = await api.get<Record<string, any>[]>("/products");
  return data.map((p) => ({ value: p.Product_ID, label: p.Product_Name }));
};

const loadDistributors = async () => {
  const data = await api.get<Record<string, any>[]>("/distributors");
  return data.map((d) => ({ value: d.Distributor_ID, label: d.Distributor_Name }));
};

const loadWarehouses = async () => {
  const data = await api.get<Record<string, any>[]>("/warehouses");
  return data.map((w) => ({ value: w.Warehouse_ID, label: w.Warehouse_Name }));
};

export default function Orders() {
  const fields: CrudField[] = [
    { name: "Order_ID", label: "Order ID", type: "number", isId: true, required: true },
    { name: "Customer_ID", label: "Customer", type: "select", optionsLoader: loadCustomers, required: true },
    { name: "Product_ID", label: "Product", type: "select", optionsLoader: loadProducts, required: true },
    { name: "Quantity", label: "Quantity", type: "number", required: true },
    { name: "Unit_Price", label: "Unit Price", type: "number" },
    { name: "Distributor_ID", label: "Distributor", type: "select", optionsLoader: loadDistributors },
    { name: "Warehouse_ID", label: "Warehouse", type: "select", optionsLoader: loadWarehouses },
    { name: "Order_Date", label: "Order Date", type: "date", required: true },
    { name: "Delivery_Date", label: "Delivery Date", type: "date" },
    {
      name: "Status",
      label: "Status",
      type: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    { name: "Notes", label: "Notes", type: "textarea" },
  ];

  return (
    <CrudPage
      title="Orders"
      apiPath="/orders"
      idField="Order_ID"
      columns={[
        { key: "Order_ID", label: "Order" },
        { key: "Customer_Name", label: "Customer" },
        { key: "Product_Name", label: "Product" },
        { key: "Quantity", label: "Qty" },
        { key: "Unit_Price", label: "Rate" },
        {
          key: "Total_Amount",
          label: "Total",
          render: (r) => "₹" + Number(r.Total_Amount || 0).toLocaleString("en-IN"),
        },
        { key: "Order_Date", label: "Date" },
        { key: "Status", label: "Status", status: true },
      ]}
      fields={fields}
    />
  );
}
