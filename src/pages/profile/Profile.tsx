import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, uploadFile, uploadDocument } from "../../api/sellerApi";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import {
  User, Building2, CreditCard, Shield, CheckCircle, Clock,
  XCircle, Edit2, Save, X, Loader2, AlertCircle, Upload,
  FileText, Image, MapPin, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

type DocField = { key: string; label: string; desc: string; required: boolean };

const DOC_FIELDS: DocField[] = [
  { key: "idProofUrl", label: "ID Proof", desc: "Aadhaar / Voter ID / Passport", required: true },
  { key: "panCardUrl", label: "PAN Card", desc: "Business or personal PAN card", required: true },
  { key: "logoUrl", label: "Store Photo / Logo", desc: "Store front image or logo", required: true },
  { key: "gstCertificateUrl", label: "GST Certificate", desc: "GST registration certificate", required: false },
  { key: "businessProofUrl", label: "Business Proof", desc: "Udyam / MSME / Shop license", required: false },
  { key: "licenseUrl", label: "Trade License", desc: "Local municipal trade license", required: false },
];

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
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const handleDocUpload = async (key: string, file: File) => {
    setUploadingDoc(key);
    try {
      const url = await uploadFile(file, "seller-docs");
      await uploadDocument(key, url);
      qc.invalidateQueries({ queryKey: ["seller", "profile"] });
      toast.success("Document uploaded successfully");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadingDoc(null);
    }
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
    APPROVED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Account Approved", sub: "Your account is active. You can start selling!" },
    PENDING: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Pending Verification", sub: "Your application is under review. Usually takes 24-48 hours." },
    REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Application Rejected", sub: profile.rejectionReason ? `Reason: ${profile.rejectionReason}` : "Contact support for assistance." },
  }[profile.status];

  const uploadedDocCount = DOC_FIELDS.filter(d => !!(profile as unknown as Record<string, unknown>)[d.key]).length;
  const requiredMissing = DOC_FIELDS.filter(d => d.required && !(profile as unknown as Record<string, unknown>)[d.key]);

  return (
    <div className="min-h-full">
      <PageHeader title="My Profile" subtitle="Manage your seller account" />

      <div className="p-6 space-y-5 max-w-2xl">
        {/* Status card */}
        <div className={clsx("flex items-start gap-3 p-4 rounded-2xl border", statusInfo.bg)}>
          <statusInfo.icon className={clsx("w-5 h-5 mt-0.5 shrink-0", statusInfo.color)} />
          <div className="flex-1">
            <p className={clsx("font-semibold text-sm", statusInfo.color)}>{statusInfo.label}</p>
            <p className={clsx("text-xs mt-0.5", statusInfo.color, "opacity-80")}>{statusInfo.sub}</p>
          </div>
        </div>

        {/* KYC alert for PENDING sellers with missing required docs */}
        {profile.status === "PENDING" && requiredMissing.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-300 bg-amber-50">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-amber-800">KYC Documents Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Upload the following required documents so admin can review and approve your account: <strong>{requiredMissing.map(d => d.label).join(", ")}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Personal Info */}
        <Section
          title="Personal Information" icon={User}
          onEdit={() => startEdit("personal", { fullName: profile.fullName ?? "", phone: profile.phone ?? "" })}
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
            <InfoRow label="Description" value={profile.description} />
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Contact support to change business details.
          </p>
        </Section>

        {/* Location */}
        <Section
          title="Store Address" icon={MapPin}
          onEdit={() => startEdit("address", {
            addressLine: profile.addressLine ?? "", city: profile.city ?? "",
            state: profile.state ?? "", pincode: profile.pincode ?? "",
          })}
          editing={editSection === "address"}
          onSave={() => updateMut.mutate({ addressLine: form.addressLine, city: form.city, state: form.state, pincode: form.pincode })}
          onCancel={() => setEditSection(null)}
          saving={updateMut.isPending}
        >
          {editSection === "address" ? (
            <div className="space-y-3">
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
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Address" value={profile.addressLine} />
              <InfoRow label="City" value={profile.city} />
              <InfoRow label="State" value={profile.state} />
              <InfoRow label="Pincode" value={profile.pincode} />
            </div>
          )}
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

        {/* KYC Documents */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" /> KYC Documents
            </h2>
            <span className="text-xs font-medium text-slate-500">{uploadedDocCount}/{DOC_FIELDS.length} uploaded</span>
          </div>
          <div className="p-5 space-y-3">
            {DOC_FIELDS.map(({ key, label, desc, required }) => {
              const url = (profile as unknown as Record<string, unknown>)[key] as string | undefined;
              const isUploading = uploadingDoc === key;
              return (
                <div key={key} className={clsx(
                  "rounded-xl border p-3 transition-all",
                  url ? "border-green-200 bg-green-50" : required ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"
                )}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {url ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <FileText className={clsx("w-5 h-5 shrink-0", required ? "text-amber-400" : "text-slate-400")} />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          {label}
                          {required && !url && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{url ? "Document uploaded" : desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {url && (
                        <a href={`http://localhost:8080${url}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                          <Image className="w-3 h-3" /> View
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileRefs.current[key]?.click()}
                        className={clsx(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                          url
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                      >
                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {isUploading ? "Uploading..." : url ? "Replace" : "Upload"}
                      </button>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={el => { fileRefs.current[key] = el; }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleDocUpload(key, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <button onClick={logout}
            className="w-full py-3 border-2 border-red-200 text-red-600 rounded-2xl text-sm font-semibold hover:bg-red-50 transition-colors">
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
  title: string; icon: React.ElementType; children: React.ReactNode;
  editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void; saving: boolean;
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
            <button onClick={onSave} disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-60">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
          </div>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
