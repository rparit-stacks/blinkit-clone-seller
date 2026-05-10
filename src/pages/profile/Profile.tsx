import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile } from "../../api/sellerApi";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import {
  User, Building2, CreditCard, Shield, CheckCircle, Clock,
  XCircle, Edit2, Save, X, Loader2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
      <span className="text-xs text-slate-400 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value || <span className="text-slate-400 font-normal">Not set</span>}</span>
    </div>
  );
}

export default function Profile() {
  const { logout } = useAuth();
  const qc = useQueryClient();
  const [editSection, setEditSection] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ["seller", "profile"],
    queryFn: fetchProfile,
  });

  const updateMut = useMutation({
    mutationFn: (data: Record<string, string | number | undefined>) => updateProfile(data as Parameters<typeof updateProfile>[0]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "profile"] });
      setEditSection(null);
      toast.success("Profile updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const startEdit = (section: string, fields: Record<string, string>) => {
    setForm(fields);
    setEditSection(section);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!profile) return null;

  const statusInfo = {
    APPROVED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Account Approved" },
    PENDING: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Pending Approval" },
    REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Application Rejected" },
  }[profile.status];

  return (
    <div className="min-h-full">
      <PageHeader title="Profile" subtitle="Manage your seller account" />

      <div className="p-6 space-y-5 max-w-2xl">
        {/* Status card */}
        <div className={clsx("flex items-start gap-3 p-4 rounded-2xl border", statusInfo.bg)}>
          <statusInfo.icon className={clsx("w-5 h-5 mt-0.5 shrink-0", statusInfo.color)} />
          <div>
            <p className={clsx("font-semibold text-sm", statusInfo.color)}>{statusInfo.label}</p>
            {profile.status === "PENDING" && (
              <p className="text-xs text-yellow-700 mt-0.5">Your application is under review. Usually takes 24-48 hours.</p>
            )}
            {profile.status === "REJECTED" && profile.rejectionReason && (
              <p className="text-xs text-red-700 mt-0.5">Reason: {profile.rejectionReason}</p>
            )}
            {profile.status === "APPROVED" && (
              <p className="text-xs text-green-700 mt-0.5">Your account is active. You can start selling!</p>
            )}
          </div>
        </div>

        {/* Personal Info */}
        <Section
          title="Personal Information"
          icon={User}
          onEdit={() => startEdit("personal", {
            fullName: profile.fullName ?? "",
            phone: profile.phone ?? "",
          })}
          editing={editSection === "personal"}
          onSave={() => updateMut.mutate({ fullName: form.fullName, phone: form.phone })}
          onCancel={() => setEditSection(null)}
          saving={updateMut.isPending}
        >
          {editSection === "personal" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Full Name</label>
                <input className={INPUT} value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input className={INPUT} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Full Name" value={profile.fullName} />
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Phone" value={profile.phone} />
              <InfoRow label="Member Since" value={new Date(profile.createdAt).toLocaleDateString()} />
            </div>
          )}
        </Section>

        {/* Business Details */}
        <Section title="Business Details" icon={Building2} editing={false} saving={false} onEdit={() => {}} onSave={() => {}} onCancel={() => {}}>
          <div className="space-y-3">
            <InfoRow label="Store Name" value={profile.storeName} />
            <InfoRow label="Category" value={profile.storeCategory} />
            <InfoRow label="GST Number" value={profile.gstNumber} />
            <InfoRow label="PAN Number" value={profile.panNumber} />
            <InfoRow label="Business Reg." value={profile.businessRegNumber} />
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Business details cannot be changed after registration. Contact support if needed.
          </p>
        </Section>

        {/* Bank Details */}
        <Section title="Bank Account" icon={CreditCard} editing={false} saving={false} onEdit={() => {}} onSave={() => {}} onCancel={() => {}}>
          <div className="space-y-3">
            <InfoRow label="Account Holder" value={profile.bankAccountHolderName} />
            <InfoRow label="Account Number" value={profile.bankAccountNumber ? `••••${profile.bankAccountNumber.slice(-4)}` : undefined} />
            <InfoRow label="IFSC Code" value={profile.bankIfsc} />
            <InfoRow label="Bank Name" value={profile.bankName} />
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Contact support to update banking details.
          </p>
        </Section>

        {/* Documents */}
        <Section title="KYC Documents" icon={Shield} editing={false} saving={false} onEdit={() => {}} onSave={() => {}} onCancel={() => {}}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "GST Certificate", url: profile.gstCertificateUrl },
              { label: "PAN Card", url: profile.panCardUrl },
              { label: "License", url: profile.licenseUrl },
              { label: "Business Proof", url: profile.businessProofUrl },
              { label: "ID Proof", url: profile.idProofUrl },
            ].map(({ label, url }) => (
              <div key={label} className={clsx(
                "flex items-center gap-2 p-3 rounded-xl border text-sm",
                url ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"
              )}>
                {url ? (
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={clsx("text-xs font-medium", url ? "text-green-700" : "text-slate-500")}>{label}</p>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-600 hover:underline">
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Logout */}
        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full py-3 border-2 border-red-200 text-red-600 rounded-2xl text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title, icon: Icon, children, editing, onEdit, onSave, onCancel, saving,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" /> {title}
        </h2>
        {!editing ? (
          <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
          </div>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
