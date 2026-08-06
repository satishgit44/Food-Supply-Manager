import React from "react";
import CrudPage from "../components/CrudPage";

export default function Categories() {
  return (
    <CrudPage
      title="Categories"
      apiPath="/categories"
      idField="Category_ID"
      columns={[
        { key: "Category_ID", label: "ID" },
        { key: "Category_Name", label: "Name" },
        { key: "Description", label: "Description" },
      ]}
      fields={[
        { name: "Category_Name", label: "Category Name", required: true },
        { name: "Description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
