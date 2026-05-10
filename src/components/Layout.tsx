import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Package, ShoppingBag, Store, User, LogOut,
  Menu, X, ChevronRight, Bell, Wallet
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/store", icon: Store, label: "My Store" },
  { to: "/profile", icon: User, label: "Profile" },
];

const mobileNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const { seller, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">
              {seller?.storeName ?? "Seller Panel"}
            </p>
            <p className="text-white/40 text-[10px]">Vendor Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status badge */}
      {seller?.status && (
        <div className="px-4 pb-2">
          <div className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
            seller.status === "APPROVED" ? "bg-green-500/20 text-green-300" :
            seller.status === "PENDING" ? "bg-yellow-500/20 text-yellow-300" :
            "bg-red-500/20 text-red-300"
          )}>
            <div className={clsx(
              "w-2 h-2 rounded-full",
              seller.status === "APPROVED" ? "bg-green-400 animate-pulse" :
              seller.status === "PENDING" ? "bg-yellow-400" : "bg-red-400"
            )} />
            {seller.status === "APPROVED" ? "Account Active" :
             seller.status === "PENDING" ? "Pending Approval" : "Account Rejected"}
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0">
            <span className="text-blue-400 font-bold text-xs">
              {seller?.fullName?.charAt(0).toUpperCase() ?? "S"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{seller?.fullName}</p>
            <p className="text-white/40 text-[10px] truncate">{seller?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-slate-900 flex flex-col z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">{seller?.storeName ?? "Seller"}</span>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 relative">
            <Bell className="w-5 h-5 text-slate-700" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden flex items-center bg-white border-t border-slate-200 safe-area-pb shrink-0">
          {mobileNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-blue-600" : "text-slate-400"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={clsx("w-5 h-5", isActive && "stroke-[2.5]")} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
