import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, isAdmin } from "../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "◧", end: true },
  { to: "/suppliers", label: "Suppliers", icon: "🚚" },
  { to: "/products", label: "Products", icon: "📦" },
  { to: "/categories", label: "Categories", icon: "🗂️" },
  { to: "/inventory", label: "Inventory", icon: "🏬" },
  { to: "/warehouses", label: "Warehouses", icon: "🏗️" },
  { to: "/distributors", label: "Distributors", icon: "🚛" },
  { to: "/customers", label: "Customers", icon: "🧑‍🤝‍🧑" },
  { to: "/orders", label: "Orders", icon: "🛒" },
  { to: "/payments", label: "Payments", icon: "💳" },
  { to: "/reports", label: "Reports", icon: "📊" },
  { to: "/users", label: "Users", icon: "👤", adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col bg-gray-900 text-gray-200">
        <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-4">
          <span className="text-xl">🥘</span>
          <span className="text-sm font-bold">Food Supply Manager</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.filter((n) => !n.adminOnly || isAdmin(user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-700 p-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user?.username}</div>
              <div className="text-xs capitalize text-gray-400">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto text-xs text-gray-400 hover:text-white"
              title="Sign out"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
