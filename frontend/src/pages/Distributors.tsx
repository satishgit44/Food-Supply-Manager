import React from "react";
import CrudPage from "../components/CrudPage";

export default function Distributors() {
  return (
    <CrudPage
      title="Distributors"
      apiPath="/distributors"
      idField="Distributor_ID"
      columns={[
        { key: "Distributor_ID", label: "ID" },
        { key: "Distributor_Name", label: "Name" },
        { key: "City", label: "City" },
        { key: "Region", label: "Region" },
        { key: "Vehicle_Count", label: "Vehicles" },
        { key: "Status", label: "Status", status: true },
      ]}
      fields={[
        {
          name: "Distributor_ID",
          label: "Distributor ID",
          type: "number",
          isId: true,
          required: true,
        },
        { name: "Distributor_Name", label: "Name", required: true },
        { name: "City", label: "City" },
        { name: "Contact_No", label: "Contact No" },
        { name: "Email", label: "Email" },
        { name: "Region", label: "Region" },
        { name: "Vehicle_Count", label: "Vehicle Count", type: "number" },
        {
          name: "Status",
          label: "Status",
          type: "select",
          options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ],
        },
      ]}
    />
  );
}
