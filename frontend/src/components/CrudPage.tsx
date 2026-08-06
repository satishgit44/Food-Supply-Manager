import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth, canWrite } from "../context/AuthContext";
import { Modal, StatusBadge, Spinner } from "./ui";

export interface CrudField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  options?: { value: string | number; label: string }[];
  optionsLoader?: () => Promise<{ value: string | number; label: string }[]>;
  required?: boolean;
  isId?: boolean; // the manual primary key, only editable when creating
}

export interface CrudColumn {
  key: string;
  label: string;
  render?: (row: Record<string, any>) => React.ReactNode;
  status?: boolean; // render as StatusBadge
}

interface CrudPageProps {
  title: string;
  apiPath: string;
  idField: string;
  columns: CrudColumn[];
  fields: CrudField[];
  defaultValues?: Record<string, any>;
  rowSelection?: boolean; // show a checkbox column
}

export default function CrudPage({
  title,
  apiPath,
  idField,
  columns,
  fields,
  defaultValues = {},
  rowSelection = false,
}: CrudPageProps) {
  const { user } = useAuth();
  const write = canWrite(user?.role);

  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [optionCache, setOptionCache] = useState<
    Record<string, { value: string | number; label: string }[]>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Record<string, any>[]>(apiPath);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  // Resolve dynamic (loader-based) select options once per open.
  useEffect(() => {
    (async () => {
      const cache: typeof optionCache = {};
      for (const f of fields) {
        if (f.optionsLoader) {
          try {
            cache[f.name] = await f.optionsLoader();
          } catch {
            cache[f.name] = [];
          }
        }
      }
      setOptionCache(cache);
    })();
  }, [fields, creating, editing]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      Object.values(r).some((v) =>
        v != null && String(v).toLowerCase().includes(q),
      ),
    );
  }, [rows, search]);

  function openCreate() {
    const base: Record<string, any> = { ...defaultValues };
    for (const f of fields) {
      if (base[f.name] === undefined) base[f.name] = "";
    }
    setForm(base);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(row: Record<string, any>) {
    const base: Record<string, any> = {};
    for (const f of fields) base[f.name] = row[f.name] ?? "";
    setForm(base);
    setEditing(row);
    setCreating(false);
  }

  function setField(name: string, value: any) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editing;
      const target = isEdit ? editing[idField] : form[idField];
      if (isEdit) {
        await api.put(`${apiPath}/${target}`, form);
      } else {
        await api.post(apiPath, form);
      }
      await load();
      setCreating(false);
      setEditing(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Record<string, any>) {
    if (!window.confirm(`Delete this record (${row[idField]})?`)) return;
    try {
      await api.del(`${apiPath}/${row[idField]}`);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function toggle(rowId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  const optionsFor = (f: CrudField) => f.options ?? optionCache[f.name] ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-gray-500">{filtered.length} record(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input max-w-xs"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {write && (
            <button className="btn-primary" onClick={openCreate}>
              + Add
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {rowSelection && <th className="th-sort w-10"></th>}
                {columns.map((c) => (
                  <th key={c.key} className="th-sort">
                    {c.label}
                  </th>
                ))}
                {write && <th className="th-sort text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={columns.length + (write ? 1 : 0) + (rowSelection ? 1 : 0)}>
                    <Spinner />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + (write ? 1 : 0) + (rowSelection ? 1 : 0)}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No records found
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((row) => (
                  <tr key={row[idField]} className="hover:bg-gray-50">
                    {rowSelection && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(Number(row[idField]))}
                          onChange={() => toggle(Number(row[idField]))}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-sm text-gray-700">
                        {c.status ? (
                          <StatusBadge status={row[c.key]} />
                        ) : c.render ? (
                          c.render(row)
                        ) : (
                          (row[c.key] ?? "—")
                        )}
                      </td>
                    ))}
                    {write && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button className="btn-ghost !px-2" onClick={() => openEdit(row)}>
                          Edit
                        </button>
                        <button
                          className="btn-ghost !px-2 !text-red-600"
                          onClick={() => remove(row)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal form */}
      <Modal
        open={creating || !!editing}
        title={editing ? `Edit ${title}` : `Add ${title}`}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      >
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => {
            const opts = optionsFor(f);
            const disabledId = f.isId && !!editing;
            return (
              <div key={f.name}>
                <label className="label">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                {f.type === "select" ? (
                  <select
                    className="input"
                    value={form[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                    required={f.required}
                  >
                    <option value="">— select —</option>
                    {opts.map((o) => (
                      <option key={String(o.value)} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    className="input"
                    rows={3}
                    value={form[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                  />
                ) : (
                  <input
                    className="input"
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={form[f.name] ?? ""}
                    onChange={(e) =>
                      setField(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)
                    }
                    required={f.required && !disabledId}
                    disabled={disabledId}
                    step={f.type === "number" ? "any" : undefined}
                  />
                )}
              </div>
            );
          })}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
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


