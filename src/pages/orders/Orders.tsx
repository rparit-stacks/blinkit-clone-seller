import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrders, updateOrderStatus, type SubOrder } from "../../api/sellerApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { ShoppingBag, MapPin, CreditCard, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PAID: "bg-blue-100 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-100 text-purple-700 border-purple-200",
  DISPATCHED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

type FilterStatus = "ALL" | "PENDING" | "PAID" | "PROCESSING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

export default function Orders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [selected, setSelected] = useState<SubOrder | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller", "orders"],
    queryFn: fetchOrders,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "orders"] });
      qc.invalidateQueries({ queryKey: ["seller", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["seller", "wallet"] });
      toast.success("Order status updated");
      setSelected(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

  const parseAddress = (snap: string) => {
    try { return JSON.parse(snap); } catch { return null; }
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total order${orders.length !== 1 ? "s" : ""}`}
      />

      <div className="p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["ALL", "PENDING", "PAID", "PROCESSING", "DISPATCHED", "DELIVERED", "CANCELLED"] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border",
                filter === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {s === "ALL" ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No orders {filter !== "ALL" ? `with status ${filter}` : "yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const addr = parseAddress(order.addressSnapshot);
              const nextStatuses = NEXT_STATUSES[order.status] ?? [];
              return (
                <div
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {order.displayId || `#${order.id.slice(-8).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleString()} · {order.paymentMode.toUpperCase()}
                        </p>
                      </div>
                      <span className={clsx(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0",
                        STATUS_COLORS[order.status]
                      )}>
                        {order.status}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{item.productName} × {item.quantity}</span>
                          <span className="text-slate-900 font-medium">₹{item.lineTotal}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-slate-400">+{order.items.length - 2} more items</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[160px]">
                          {addr ? `${addr.city ?? ""} ${addr.pincode ?? ""}`.trim() : "Address on file"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">₹{order.total}</p>
                          <p className="text-[10px] text-green-600 font-medium">
                            You earn ₹{order.sellerEarning}
                          </p>
                        </div>
                        {nextStatuses.length > 0 && (
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            {nextStatuses.map(ns => (
                              <button
                                key={ns}
                                onClick={() => statusMut.mutate({ id: order.id, status: ns })}
                                disabled={statusMut.isPending}
                                className={clsx(
                                  "text-[10px] font-bold px-2 py-1 rounded-lg transition-colors border",
                                  ns === "CANCELLED"
                                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                    : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                )}
                              >
                                {statusMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : ns}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selected && (
        <Modal
          title={selected.displayId || `Order #${selected.id.slice(-8).toUpperCase()}`}
          open={!!selected}
          onClose={() => setSelected(null)}
          size="md"
        >
          <div className="space-y-5">
            {/* Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={clsx("text-xs font-bold px-3 py-1.5 rounded-full border", STATUS_COLORS[selected.status])}>
                {selected.status}
              </span>
              <span className="text-xs text-slate-500">{new Date(selected.createdAt).toLocaleString()}</span>
              {selected.earningCredited && (
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                  Earning credited
                </span>
              )}
            </div>

            {/* Earnings breakdown */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Earnings Breakdown
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Order Total</span>
                  <span className="font-semibold">₹{selected.total}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Platform Commission ({selected.commissionRate}%)</span>
                  <span>-₹{selected.commissionAmount}</span>
                </div>
                <div className="flex justify-between text-green-700 font-bold pt-1 border-t border-green-200">
                  <span>Your Earning</span>
                  <span>₹{selected.sellerEarning}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Items</p>
              <div className="space-y-2">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.unit} × {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">₹{item.lineTotal}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Summary</p>
              {[
                ["Subtotal", `₹${selected.subtotal}`],
                ["Delivery", `₹${selected.deliveryFee}`],
                ["Taxes", `₹${selected.taxes}`],
                ...(selected.discount > 0 ? [["Discount", `-₹${selected.discount}`]] : []),
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900">{val}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-blue-600">₹{selected.total}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CreditCard className="w-4 h-4" />
              <span>Payment: <span className="font-medium uppercase">{selected.paymentMode}</span></span>
              <span className={clsx(
                "ml-auto text-xs px-2 py-0.5 rounded-full font-semibold",
                selected.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              )}>
                {selected.paid ? "Paid" : "Unpaid"}
              </span>
            </div>

            {/* Address */}
            {(() => {
              const addr = (() => { try { return JSON.parse(selected.addressSnapshot); } catch { return null; } })();
              return addr ? (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Delivery Address
                  </p>
                  <p className="text-sm text-slate-600">
                    {[addr.name, addr.addressLine, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                  </p>
                  {addr.phone && <p className="text-xs text-slate-500 mt-0.5">{addr.phone}</p>}
                </div>
              ) : null;
            })()}

            {/* Actions */}
            {NEXT_STATUSES[selected.status]?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {NEXT_STATUSES[selected.status].map(ns => (
                    <button
                      key={ns}
                      onClick={() => statusMut.mutate({ id: selected.id, status: ns })}
                      disabled={statusMut.isPending}
                      className={clsx(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border disabled:opacity-60",
                        ns === "CANCELLED"
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {statusMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Mark as {ns}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
