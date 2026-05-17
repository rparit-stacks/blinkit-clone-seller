import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, ShoppingBag, Store, User, LogOut,
  Menu, X, Bell, Wallet, TrendingUp, ChevronRight
} from "lucide-react";
import { fetchNotifications, getUnreadCount } from "../lib/notificationsApi";
import clsx from "clsx";

const sideNav = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { to: "/orders",        icon: ShoppingBag,     label: "Orders" },
  { to: "/products",      icon: Package,         label: "Products" },
  { to: "/wallet",        icon: Wallet,          label: "Wallet" },
  { to: "/notifications", icon: Bell,            label: "Notifications", badge: true },
  { to: "/store",         icon: Store,           label: "My Store" },
  { to: "/profile",       icon: User,            label: "Profile" },
];

const bottomNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/orders",    icon: ShoppingBag,     label: "Orders" },
  { to: "/products",  icon: Package,         label: "Products" },
  { to: "/wallet",    icon: Wallet,          label: "Wallet" },
  { to: "/profile",   icon: User,            label: "Profile" },
];

function SidebarContent({ unread, onClose }: { unread: number; onClose?: () => void }) {
  const { seller, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm leading-tight truncate">
            {seller?.storeName ?? "Seller Panel"}
          </p>
          <p className="text-white/40 text-[10px] font-medium">Vendor Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {sideNav.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-white/55 hover:bg-white/[0.06] hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx("w-[15px] h-[15px] shrink-0", isActive ? "text-white" : "text-white/50")} />
                <span className="flex-1 truncate">{label}</span>
                {badge && unread > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
                {isActive && !badge && <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Account status badge */}
      {seller?.status && seller.status !== "APPROVED" && (
        <div className="px-3 pb-2">
          <div className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold",
            seller.status === "PENDING" ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
              : "bg-red-500/15 text-red-300 border border-red-500/20"
          )}>
            <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0",
              seller.status === "PENDING" ? "bg-amber-400 animate-pulse" : "bg-red-400"
            )} />
            {seller.status === "PENDING" ? "Pending Approval" : "Account Rejected"}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.07] space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-blue-600/25 flex items-center justify-center shrink-0">
            <span className="text-blue-400 font-bold text-xs">
              {seller?.fullName?.charAt(0).toUpperCase() ?? "S"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{seller?.fullName}</p>
            <p className="text-white/35 text-[10px] truncate">{seller?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { seller } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: notifItems = [] } = useQuery({
    queryKey: ["seller", "notifications"],
    queryFn: fetchNotifications,
    staleTime: 60_000,
    refetchInterval: 90_000,
  });
  const unread = getUnreadCount(notifItems);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 flex-col">
        <SidebarContent unread={unread} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-64 flex flex-col z-10 shadow-2xl">
            <SidebarContent unread={unread} onClose={() => setDrawerOpen(false)} />
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-3.5 right-3 w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 shrink-0 shadow-sm">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm truncate max-w-[140px]">
              {seller?.storeName ?? "Seller"}
            </span>
          </div>

          <NavLink
            to="/notifications"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 relative transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex items-stretch bg-white border-t border-slate-200 shrink-0">
          {bottomNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors relative",
                  isActive ? "text-blue-600" : "text-slate-400"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={clsx(
                    "flex items-center justify-center w-8 h-6 rounded-lg transition-colors",
                    isActive ? "bg-blue-50" : ""
                  )}>
                    <Icon className={clsx("w-[18px] h-[18px]", isActive ? "text-blue-600" : "text-slate-400")} />
                  </div>
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
