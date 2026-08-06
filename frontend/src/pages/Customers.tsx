import React from "react";
import CrudPage from "../components/CrudPage";

export default function Customers() {
  return (
    <CrudPage
      title="Customers"
      apiPath="/customers"
      idField="Customer_ID"
      columns={[
        { key: "Customer_ID", label: "ID" },
        { key: "Customer_Name", label: "Name" },
        { key: "City", label: "City" },
        { key: "Contact_No", label: "Contact" },
        { key: "Email", label: "Email" },
        { key: "Customer_Type", label: "Type", status: true },
      ]}
      fields={[
        { name: "Customer_ID", label: "Customer ID", type: "number", isId: true, required: true },
        { name: "Customer_Name", label: "Name", required: true },
        { name: "City", label: "City" },
        { name: "Contact_No", label: "Contact No" },
        { name: "Email", label: "Email" },
        { name: "Address", label: "Address", type: "textarea" },
        {
          name: "Customer_Type",
          label: "Customer Type",
          type: "select",
          options: [
            { value: "retail", label: "Retail" },
            { value: "wholesale", label: "Wholesale" },
            { value: "institutional", label: "Institutional" },
          ],
        },
      ]}
    />
  );
}
