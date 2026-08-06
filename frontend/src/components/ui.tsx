import React, { ReactNode } from "react";

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone] ?? map.gray}`}
    >
      {children}
    </span>
  );
}

/** Map common statuses to badge tones (mirrors the original UI colours). */
export function statusTone(status?: string): string {
  switch (status) {
    case "delivered":
    case "available":
    case "operational":
    case "active":
    case "completed":
    case "IN STOCK":
      return "green";
    case "pending":
    case "shipped":
    case "LOW STOCK":
    case "confirmed":
      return "yellow";
    case "cancelled":
    case "suspended":
    case "closed":
    case "failed":
    case "OUT OF STOCK":
    case "discontinued":
      return "red";
    case "maintenance":
    case "refunded":
      return "purple";
    default:
      return "gray";
  }
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-gray-400">—</span>;
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16 text-gray-400">Loading…</div>
  );
}
