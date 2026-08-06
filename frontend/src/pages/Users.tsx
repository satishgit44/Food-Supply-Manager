import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth, isAdmin } from "../context/AuthContext";
import { Badge, Modal, Spinner } from "../components/ui";
import { Navigate } from "react-router-dom";

interface UserRow {
  id: number;
  username: string;
  role: string;
  is_active: number;
  created_at: string | null;
}

export default function Users() {
  const { user } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [role, setRole] = useState("viewer");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<UserRow[]>("/users");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAdmin(user?.role)) return <Navigate to="/" replace />;

  function openEdit(row: UserRow) {
    setRole(row.role);
    setActive(!!row.is_active);
    setEditing(row);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/users/${editing.id}`, { role, is_active: active ? 1 : 0 });
      setEditing(null);
      await load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: UserRow) {
    if (!window.confirm(`Delete user '${row.username}'?`)) return;
    try {
      await api.del(`/users/${row.id}`);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold">Users</h1>
      <p className="mb-5 text-sm text-gray-500">Manage user roles and access (admin only)</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="th-sort">ID</th>
                <th className="th-sort">Username</th>
                <th className="th-sort">Role</th>
                <th className="th-sort">Status</th>
                <th className="th-sort text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={5}><Spinner /></td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{r.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{r.username}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge tone={r.role === "admin" ? "purple" : r.role === "manager" ? "blue" : "gray"}>
                        {r.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge tone={r.is_active ? "green" : "red"}>
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button className="btn-ghost !px-2" onClick={() => openEdit(r)}>
                        Edit
                      </button>
                      {r.id !== user?.id && (
                        <button className="btn-ghost !px-2 !text-red-600" onClick={() => remove(r)}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!editing}
        title={`Edit User: ${editing?.username ?? ""}`}
        onClose={() => setEditing(null)}
      >
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Account Active</label>
            <select className="input" value={active ? 1 : 0} onChange={(e) => setActive(e.target.value === "1")}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
