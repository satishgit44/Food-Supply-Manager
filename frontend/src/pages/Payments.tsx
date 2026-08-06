import React from "react";
import CrudPage, { CrudField } from "../components/CrudPage";
import { api } from "../api/client";

const loadOrders = async () => {
  const data = await api.get<Record<string, any>[]>("/orders");
  return data.map((o) => ({ value: o.Order_ID, label: `#${o.Order_ID} - ${o.Customer_Name || ""}` }));
};

export default function Payments() {
  const fields: CrudField[] = [
    { name: "Order_ID", label: "Order", type: "select", optionsLoader: loadOrders, required: true },
    { name: "Amount", label: "Amount", type: "number", required: true },
    { name: "Payment_Date", label: "Payment Date", type: "date", required: true },
    {
      name: "Payment_Method",
      label: "Method",
      type: "select",
      options: [
        { value: "cash", label: "Cash" },
        { value: "card", label: "Card" },
        { value: "upi", label: "UPI" },
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "cheque", label: "Cheque" },
      ],
    },
    {
      name: "Payment_Status",
      label: "Status",
      type: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "completed", label: "Completed" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
      ],
    },
    { name: "Transaction_Ref", label: "Transaction Ref" },
    { name: "Notes", label: "Notes", type: "textarea" },
  ];

  return (
    <CrudPage
      title="Payments"
      apiPath="/payments"
      idField="Payment_ID"
      columns={[
        { key: "Payment_ID", label: "ID" },
        { key: "Order_ID", label: "Order" },
        { key: "Customer_Name", label: "Customer" },
        {
          key: "Amount",
          label: "Amount",
          render: (r) => "₹" + Number(r.Amount || 0).toLocaleString("en-IN"),
        },
        { key: "Payment_Date", label: "Date" },
        { key: "Payment_Method", label: "Method" },
        { key: "Payment_Status", label: "Status", status: true },
      ]}
      fields={fields}
    />
  );
}
