import React from "react";
import CrudPage from "../components/CrudPage";

export default function Suppliers() {
  return (
    <CrudPage
      title="Suppliers"
      apiPath="/suppliers"
      idField="Supplier_ID"
      columns={[
        { key: "Supplier_ID", label: "ID" },
        { key: "Supplier_Name", label: "Name" },
        { key: "City", label: "City" },
        { key: "Contact_No", label: "Contact" },
        { key: "Email", label: "Email" },
        { key: "Status", label: "Status", status: true },
      ]}
      fields={[
        { name: "Supplier_ID", label: "Supplier ID", type: "number", isId: true, required: true },
        { name: "Supplier_Name", label: "Name", required: true },
        { name: "City", label: "City" },
        { name: "Contact_No", label: "Contact No" },
        { name: "Email", label: "Email" },
        { name: "Address", label: "Address", type: "textarea" },
        {
          name: "Status",
          label: "Status",
          type: "select",
          options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "suspended", label: "Suspended" },
          ],
        },
      ]}
    />
  );
}
