import React from "react";
import CrudPage from "../components/CrudPage";

export default function Warehouses() {
  return (
    <CrudPage
      title="Warehouses"
      apiPath="/warehouses"
      idField="Warehouse_ID"
      columns={[
        { key: "Warehouse_ID", label: "ID" },
        { key: "Warehouse_Name", label: "Name" },
        { key: "City", label: "City" },
        { key: "Capacity_Tons", label: "Capacity (T)" },
        { key: "Manager_Name", label: "Manager" },
        { key: "Status", label: "Status", status: true },
      ]}
      fields={[
        { name: "Warehouse_ID", label: "Warehouse ID", type: "number", isId: true, required: true },
        { name: "Warehouse_Name", label: "Name", required: true },
        { name: "City", label: "City" },
        { name: "Address", label: "Address", type: "textarea" },
        { name: "Capacity_Tons", label: "Capacity (Tons)", type: "number" },
        { name: "Manager_Name", label: "Manager Name" },
        { name: "Contact_No", label: "Contact No" },
        {
          name: "Status",
          label: "Status",
          type: "select",
          options: [
            { value: "operational", label: "Operational" },
            { value: "maintenance", label: "Maintenance" },
            { value: "closed", label: "Closed" },
          ],
        },
      ]}
    />
  );
}
