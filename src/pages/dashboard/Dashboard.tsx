import { useQuery } from "@tanstack/react-query";
import { fetchDashboard, fetchOrders, fetchProfile } from "../../api/sellerApi";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/StatCard";
import {
  ShoppingBag, TrendingUp, Clock, CheckCircle, XCircle,
  IndianRupee, Package, AlertTriangle, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  DISPATCHED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const { seller } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["seller", "dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: profile } = useQuery({
    queryKey: ["seller", "profile"],
    queryFn: fetchProfile,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["seller", "orders"],
    queryFn: fetchOrders,
    enabled: seller?.status === "APPROVED",
  });

  const recentOrders = orders.slice(0, 5);

  // Pending approval state
  if (profile?.status === "PENDING") {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Application Under Review</h2>
          <p className="text-slate-500 mb-6">
            Your seller application is being reviewed by our team. You'll be notified once approved.
            This usually takes 24-48 hours.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-yellow-800">What happens next?</p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Our team reviews your submitted documents</li>
              <li>We verify your business details</li>
              <li>Once approved, your store goes live</li>
            </ul>
          </div>
          <Link to="/profile" className="mt-5 inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700">
            View your profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (profile?.status === "REJECTED") {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Application Not Approved</h2>
          {profile.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-5">
              <p className="text-sm font-semibold text-red-800 mb-1">Reason:</p>
              <p className="text-sm text-red-700">{profile.rejectionReason}</p>
            </div>
          )}
          <p className="text-slate-500 text-sm">Please contact support to resolve this or update your profile.</p>
          <Link to="/profile" className="mt-5 inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700">
            Update profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Good {getGreeting()}, {seller?.fullName?.split(" ")[0] ?? "Seller"} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Here's how your store is doing today</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
              profile?.storeOpen ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
            )}>
              <div className={clsx("w-2 h-2 rounded-full", profile?.storeOpen ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
              {profile?.storeOpen ? "Store Open" : "Store Closed"}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={IndianRupee} color="green" />
              <StatCard label="Total Orders" value={stats.totalOrders} icon={ShoppingBag} color="blue" />
              <StatCard label="Pending Orders" value={stats.pendingOrders} icon={Clock} color="yellow" />
              <StatCard label="Completed" value={stats.completedOrders} icon={CheckCircle} color="green" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Today's Orders" value={stats.todayOrders} icon={TrendingUp} color="purple" sub="vs yesterday" />
              <StatCard label="Today's Revenue" value={`₹${stats.todayRevenue.toLocaleString()}`} icon={IndianRupee} color="purple" />
              <StatCard label="Total Products" value={stats.totalProducts} icon={Package} color="blue" />
              <StatCard label="Active Products" value={stats.activeProducts} icon={Package} color="green" sub={`of ${stats.totalProducts} total`} />
            </div>
          </>
        ) : null}

        {/* Alert if no products */}
        {stats && stats.totalProducts === 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">No products yet</p>
              <p className="text-sm text-amber-700 mt-0.5">Start by adding products to your store.</p>
              <Link to="/products" className="text-sm text-amber-800 font-semibold underline mt-1 inline-block">
                Add your first product →
              </Link>
            </div>
          </div>
        )}

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-slate-500">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">₹{order.total}</p>
                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600")}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
