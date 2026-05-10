import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, toggleStore } from "../../api/sellerApi";
import PageHeader from "../../components/PageHeader";
import {
  Store, MapPin, Clock, Power, Loader2, Edit2, Save, X, Globe
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

export default function MyStore() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ["seller", "profile"],
    queryFn: async () => {
      const data = await fetchProfile();
      setForm({
        description: data.description ?? "",
        addressLine: data.addressLine ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        pincode: data.pincode ?? "",
        openTime: data.openTime ?? "09:00",
        closeTime: data.closeTime ?? "22:00",
        logoUrl: data.logoUrl ?? "",
        bannerUrl: data.bannerUrl ?? "",
        latitude: data.latitude?.toString() ?? "",
        longitude: data.longitude?.toString() ?? "",
      });
      return data;
    },
  });

  const toggleMut = useMutation({
    mutationFn: toggleStore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "profile"] });
      toast.success("Store status updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const updateMut = useMutation({
    mutationFn: () => updateProfile({
      description: form.description,
      addressLine: form.addressLine,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      openTime: form.openTime,
      closeTime: form.closeTime,
      logoUrl: form.logoUrl,
      bannerUrl: form.bannerUrl,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "profile"] });
      setEditing(false);
      toast.success("Store updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const getLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        }));
        toast.success("Location updated");
      },
      () => toast.error("Could not get location")
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!profile) return null;

  const isApproved = profile.status === "APPROVED";

  return (
    <div className="min-h-full">
      <PageHeader
        title="My Store"
        subtitle={profile.storeName}
        action={
          isApproved && !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit Store
            </button>
          ) : editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          ) : null
        }
      />

      <div className="p-6 space-y-5">
        {/* Banner preview */}
        <div className="relative h-36 sm:h-48 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl overflow-hidden">
          {(editing ? form.bannerUrl : profile.bannerUrl) && (
            <img
              src={editing ? form.bannerUrl : profile.bannerUrl}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-end p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white overflow-hidden shadow-lg">
                {(editing ? form.logoUrl : profile.logoUrl) ? (
                  <img
                    src={editing ? form.logoUrl : profile.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">{profile.storeName}</p>
                <p className="text-white/70 text-xs capitalize">{profile.storeCategory}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store on/off toggle */}
        {isApproved && (
          <div className={clsx(
            "flex items-center justify-between p-4 rounded-2xl border-2 transition-colors",
            profile.storeOpen
              ? "border-green-200 bg-green-50"
              : "border-slate-200 bg-white"
          )}>
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                profile.storeOpen ? "bg-green-500" : "bg-slate-300"
              )}>
                <Power className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {profile.storeOpen ? "Store is Open" : "Store is Closed"}
                </p>
                <p className="text-xs text-slate-500">
                  {profile.storeOpen ? "Customers can place orders" : "Toggle to start accepting orders"}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleMut.mutate()}
              disabled={toggleMut.isPending}
              className={clsx(
                "relative w-12 h-6 rounded-full transition-colors disabled:opacity-60",
                profile.storeOpen ? "bg-green-500" : "bg-slate-300"
              )}
            >
              <div className={clsx(
                "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                profile.storeOpen ? "translate-x-6" : "translate-x-0.5"
              )} />
            </button>
          </div>
        )}

        {!isApproved && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-yellow-800">Store not yet active</p>
            <p className="text-xs text-yellow-700 mt-1">Your account is {profile.status.toLowerCase()}. Store controls will be available after approval.</p>
          </div>
        )}

        {/* Store details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Store Information</h2>
          </div>
          <div className="p-5 space-y-4">
            {editing ? (
              <>
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea rows={3} className={INPUT} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Logo URL</label>
                  <input className={INPUT} value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <label className={LABEL}>Banner URL</label>
                  <input className={INPUT} value={form.bannerUrl} onChange={e => setForm(f => ({ ...f, bannerUrl: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Open Time</label>
                    <input type="time" className={INPUT} value={form.openTime} onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Close Time</label>
                    <input type="time" className={INPUT} value={form.closeTime} onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))} />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {profile.description && (
                  <p className="text-sm text-slate-600">{profile.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {profile.openTime && profile.closeTime
                    ? `${profile.openTime} – ${profile.closeTime}`
                    : "Business hours not set"
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" /> Address & Location
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {editing ? (
              <>
                <div>
                  <label className={LABEL}>Address Line</label>
                  <input className={INPUT} value={form.addressLine} onChange={e => setForm(f => ({ ...f, addressLine: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>City</label>
                    <input className={INPUT} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className={LABEL}>State</label>
                    <input className={INPUT} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Pincode</label>
                  <input className={INPUT} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={LABEL + " mb-0"}>GPS Coordinates</label>
                    <button type="button" onClick={getLocation} className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Use current
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className={INPUT} value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="Latitude" />
                    <input className={INPUT} value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="Longitude" />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {[profile.addressLine, `${profile.city ?? ""} ${profile.state ?? ""}`.trim(), profile.pincode]
                  .filter(Boolean)
                  .map((line, i) => (
                    <p key={i} className="text-sm text-slate-600">{line}</p>
                  ))
                }
                {profile.latitude && profile.longitude && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                    <Globe className="w-3 h-3" />
                    {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                  </p>
                )}
                {!profile.addressLine && <p className="text-sm text-slate-400">No address set</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
