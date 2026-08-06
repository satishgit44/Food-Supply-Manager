import React from "react";
import CrudPage, { CrudField } from "../components/CrudPage";
import { api } from "../api/client";

const loadCategories = async () => {
  const data = await api.get<Record<string, any>[]>("/categories");
  return data.map((c) => ({ value: c.Category_ID, label: c.Category_Name }));
};

const loadSuppliers = async () => {
  const data = await api.get<Record<string, any>[]>("/suppliers");
  return data.map((s) => ({ value: s.Supplier_ID, label: s.Supplier_Name }));
};

export default function Products() {
  const fields: CrudField[] = [
    { name: "Product_ID", label: "Product ID", type: "number", isId: true, required: true },
    { name: "Product_Name", label: "Product Name", required: true },
    { name: "Category_ID", label: "Category", type: "select", optionsLoader: loadCategories },
    { name: "Supplier_ID", label: "Supplier", type: "select", optionsLoader: loadSuppliers },
    { name: "Price", label: "Price", type: "number" },
    { name: "Unit", label: "Unit" },
    {
      name: "Status",
      label: "Status",
      type: "select",
      options: [
        { value: "available", label: "Available" },
        { value: "out_of_stock", label: "Out of Stock" },
        { value: "discontinued", label: "Discontinued" },
      ],
    },
  ];

  return (
    <CrudPage
      title="Products"
      apiPath="/products"
      idField="Product_ID"
      columns={[
        { key: "Product_ID", label: "ID" },
        { key: "Product_Name", label: "Name" },
        { key: "Category_Name", label: "Category" },
        { key: "Price", label: "Price", render: (r) => "₹" + Number(r.Price || 0) },
        { key: "Unit", label: "Unit" },
        { key: "Supplier_Name", label: "Supplier" },
        { key: "Status", label: "Status", status: true },
      ]}
      fields={fields}
    />
  );
}
