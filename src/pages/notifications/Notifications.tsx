import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronLeft, CheckCheck } from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../lib/notificationsApi";

export default function Notifications() {
  const qc = useQueryClient();
  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ["seller", "notifications"],
    queryFn: fetchNotifications,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller", "notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller", "notifications"] }),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/dashboard"
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Bell className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
        </div>
        <button
          type="button"
          disabled={markAll.isPending || items.length === 0}
          onClick={() => markAll.mutate()}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium disabled:opacity-50"
        >
          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-slate-500 text-center py-12">Loading…</p>}
        {isError && (
          <p className="text-sm text-red-600 text-center py-12">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        )}
        {!isLoading &&
          !isError &&
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (!n.read) markOne.mutate(n.id);
              }}
              className={`w-full text-left bg-white rounded-2xl border p-4 shadow-sm ${
                !n.read ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-100"
              }`}
            >
              <h3 className="text-sm font-semibold text-slate-900">{n.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-2">{n.time}</p>
            </button>
          ))}
        {!isLoading && !isError && items.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-16">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
