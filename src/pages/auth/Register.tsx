import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sellerRegister, sellerSendOtp, sellerVerifyOtp, uploadFile, uploadDocument } from "../../api/sellerApi";
import {
  Store, ChevronRight, ChevronLeft, Check, Loader2,
  User, Building2, MapPin, CreditCard, Shield, Eye, EyeOff,
  Upload, Camera, FileText, AlertCircle, CheckCircle2, Image, Mail, KeyRound, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

// ─── Steps ───────────────────────────────────────────────────────────────────
// Step 0 = Email OTP verification (shown before the wizard card steps)
// Steps 1-5 = the actual form

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Business", icon: Building2 },
  { id: 3, label: "Location", icon: MapPin },
  { id: 4, label: "Banking", icon: CreditCard },
  { id: 5, label: "Documents", icon: Shield },
];

type FormData = {
  fullName: string; email: string; phone: string; password: string; confirmPassword: string;
  storeName: string; storeCategory: string; description: string;
  gstNumber: string; panNumber: string; businessRegNumber: string;
  addressLine: string; city: string; state: string; pincode: string;
  latitude: string; longitude: string;
  bankAccountNumber: string; bankIfsc: string; bankAccountHolderName: string; bankName: string;
};

type DocKey = "idProofUrl" | "panCardUrl" | "gstCertificateUrl" | "businessProofUrl" | "licenseUrl" | "logoUrl";

const DOC_FIELDS: { key: DocKey; label: string; desc: string; required: boolean }[] = [
  { key: "idProofUrl",         label: "ID Proof",           desc: "Aadhaar / Voter ID / Passport",   required: true  },
  { key: "panCardUrl",         label: "PAN Card",           desc: "Business or personal PAN",         required: true  },
  { key: "logoUrl",            label: "Store Photo / Logo", desc: "Store front or logo image",        required: true  },
  { key: "gstCertificateUrl",  label: "GST Certificate",   desc: "GST registration certificate",     required: false },
  { key: "businessProofUrl",   label: "Business Proof",     desc: "Udyam / MSME / Shop license",     required: false },
  { key: "licenseUrl",         label: "Trade License",      desc: "Local municipal trade license",    required: false },
];

const STORAGE_KEY = "seller_register_draft";

const emptyForm = (): FormData => ({
  fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  storeName: "", storeCategory: "bazaar", description: "",
  gstNumber: "", panNumber: "", businessRegNumber: "",
  addressLine: "", city: "", state: "", pincode: "",
  latitude: "", longitude: "",
  bankAccountNumber: "", bankIfsc: "", bankAccountHolderName: "", bankName: "",
});

function loadDraft(): { form: FormData; step: number; emailVerified: boolean; verifiedEmail: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { form: emptyForm(), step: 1, emailVerified: false, verifiedEmail: "" };
}

const INPUT = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // OTP state (step 0)
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Form wizard state
  const draft = loadDraft();
  const [step, setStep] = useState(draft.step);
  const [form, setForm] = useState<FormData>(draft.form);
  const [docs, setDocs] = useState<Partial<Record<DocKey, string>>>({});
  const [uploading, setUploading] = useState<DocKey | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const fileInputRefs = useRef<Partial<Record<DocKey, HTMLInputElement | null>>>({});

  // Restore verified email from draft
  useEffect(() => {
    if (draft.emailVerified && draft.verifiedEmail) {
      setEmailVerified(true);
      setOtpEmail(draft.verifiedEmail);
      setForm(f => ({ ...f, email: draft.verifiedEmail }));
    }
  }, []);

  // Persist draft on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      form, step, emailVerified, verifiedEmail: otpEmail,
    }));
  }, [form, step, emailVerified, otpEmail]);

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ─── OTP handlers ──────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      toast.error("Please enter a valid email address"); return;
    }
    setOtpLoading(true);
    try {
      const res = await sellerSendOtp(otpEmail);
      setOtpSent(true);
      if (res.otp) { setDevOtp(res.otp); }
      toast.success("OTP sent to " + otpEmail);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Enter the 6-digit OTP"); return;
    }
    setOtpLoading(true);
    try {
      await sellerVerifyOtp(otpEmail, otpCode);
      setEmailVerified(true);
      set("email", otpEmail);
      toast.success("Email verified!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Wizard handlers ────────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 1) {
      if (!form.fullName || !form.phone || !form.password) {
        toast.error("Please fill all required fields"); return false;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords do not match"); return false;
      }
      if (form.password.length < 6) {
        toast.error("Password must be at least 6 characters"); return false;
      }
    }
    if (step === 2 && (!form.storeName || !form.storeCategory)) {
      toast.error("Store name and category are required"); return false;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const prev = () => setStep(s => s - 1);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        set("latitude", pos.coords.latitude.toString());
        set("longitude", pos.coords.longitude.toString());
        toast.success("Location captured!");
      },
      () => toast.error("Could not get location")
    );
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await sellerRegister({
        fullName: form.fullName, email: form.email, phone: form.phone, password: form.password,
        storeName: form.storeName, storeCategory: form.storeCategory, description: form.description,
        gstNumber: form.gstNumber, panNumber: form.panNumber, businessRegNumber: form.businessRegNumber,
        addressLine: form.addressLine, city: form.city, state: form.state, pincode: form.pincode,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        bankAccountNumber: form.bankAccountNumber, bankIfsc: form.bankIfsc,
        bankAccountHolderName: form.bankAccountHolderName, bankName: form.bankName,
      });
      login(res);
      setRegistered(true);
      setStep(5);
      toast.success("Account created! Now upload your documents.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (key: DocKey, file: File) => {
    setUploading(key);
    try {
      const url = await uploadFile(file, "seller-docs");
      if (registered) await uploadDocument(key, url);
      setDocs(d => ({ ...d, [key]: url }));
      toast.success("Uploaded successfully");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const requiredDocs = DOC_FIELDS.filter(d => d.required);
  const allRequiredUploaded = requiredDocs.every(d => docs[d.key]);

  const handleFinish = () => {
    if (!allRequiredUploaded) {
      toast.error(`Please upload: ${requiredDocs.filter(d => !docs[d.key]).map(d => d.label).join(", ")}`);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Registration complete! Your application is under review.");
    navigate("/dashboard");
  };

  // ─── OTP Screen ────────────────────────────────────────────────────────────
  if (!emailVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-600/30">
              <Store className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Create Seller Account</h1>
            <p className="text-slate-400 mt-1 text-sm">Verify your email to get started</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-bold text-slate-900">Email Verification</h2>
            </div>

            <p className="text-xs text-slate-500">
              We'll send a 6-digit OTP to your email to confirm your identity before registration.
            </p>

            <div>
              <label className={LABEL}>Email Address *</label>
              <input
                type="email"
                className={INPUT}
                value={otpEmail}
                onChange={e => setOtpEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={otpSent}
              />
            </div>

            {!otpSent ? (
              <button onClick={handleSendOtp} disabled={otpLoading || !otpEmail}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {otpLoading ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={LABEL + " mb-0"}>Enter OTP *</label>
                    <button type="button" onClick={() => { setOtpSent(false); setOtpCode(""); setDevOtp(null); }}
                      className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700">
                      <RefreshCw className="w-3 h-3" /> Resend
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className={INPUT + " tracking-[0.4em] text-center text-lg font-bold"}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                  />
                  {devOtp && (
                    <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                      <KeyRound className="w-3 h-3" /> Dev mode OTP: <strong>{devOtp}</strong>
                    </p>
                  )}
                </div>

                <button onClick={handleVerifyOtp} disabled={otpLoading || otpCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </>
            )}

            <p className="text-center text-sm text-slate-500">
              Already registered? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main wizard ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-600/30">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Create Seller Account</h1>
          <p className="text-slate-400 mt-1 text-sm">
            <CheckCircle2 className="w-3.5 h-3.5 inline text-green-400 mr-1" />
            {otpEmail} verified
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={clsx(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                  step > s.id ? "bg-green-500" :
                  step === s.id ? "bg-blue-600 shadow-lg shadow-blue-600/30" :
                  "bg-white/10"
                )}>
                  {step > s.id
                    ? <Check className="w-4 h-4 text-white" />
                    : <s.icon className="w-4 h-4 text-white" />
                  }
                </div>
                <span className={clsx(
                  "text-[10px] font-medium hidden sm:block",
                  step >= s.id ? "text-white" : "text-slate-500"
                )}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx("w-10 sm:w-12 h-0.5 mx-1 mb-4", step > s.id ? "bg-green-500" : "bg-white/10")} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">

            {/* Step 1: Personal */}
            {step === 1 && (
              <div className="space-y-4">
                <SectionHeader icon={User} color="blue" title="Personal Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Full Name *</label>
                    <input className={INPUT} value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className={LABEL}>Phone *</label>
                    <input className={INPUT} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="9876543210" />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Email Address</label>
                  <div className="relative">
                    <input className={INPUT + " pr-28 bg-slate-50"} value={form.email} readOnly />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Password *</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} className={INPUT + " pr-10"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Confirm Password *</label>
                  <input type="password" className={INPUT} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Repeat password" />
                </div>
              </div>
            )}

            {/* Step 2: Business */}
            {step === 2 && (
              <div className="space-y-4">
                <SectionHeader icon={Building2} color="purple" title="Business Details" />
                <div>
                  <label className={LABEL}>Store Name *</label>
                  <input className={INPUT} value={form.storeName} onChange={e => set("storeName", e.target.value)} placeholder="My Amazing Store" />
                </div>
                <div>
                  <label className={LABEL}>Store Category *</label>
                  <select className={INPUT} value={form.storeCategory} onChange={e => set("storeCategory", e.target.value)}>
                    <option value="food">Food & Restaurant</option>
                    <option value="bazaar">Bazaar / General Store</option>
                    <option value="electronics">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Store Description</label>
                  <textarea rows={3} className={INPUT} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Tell customers about your store..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>GST Number</label>
                    <input className={INPUT} value={form.gstNumber} onChange={e => set("gstNumber", e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className={LABEL}>PAN Number</label>
                    <input className={INPUT} value={form.panNumber} onChange={e => set("panNumber", e.target.value.toUpperCase())} placeholder="AAAAA0000A" />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Business Registration Number</label>
                  <input className={INPUT} value={form.businessRegNumber} onChange={e => set("businessRegNumber", e.target.value)} placeholder="CIN / MSME / Udyam number" />
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-4">
                <SectionHeader icon={MapPin} color="green" title="Store Address & Location" />
                <div>
                  <label className={LABEL}>Address Line</label>
                  <input className={INPUT} value={form.addressLine} onChange={e => set("addressLine", e.target.value)} placeholder="Shop no. / Street / Area" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>City</label>
                    <input className={INPUT} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Nainital" />
                  </div>
                  <div>
                    <label className={LABEL}>State</label>
                    <input className={INPUT} value={form.state} onChange={e => set("state", e.target.value)} placeholder="Uttarakhand" />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Pincode</label>
                  <input className={INPUT} value={form.pincode} onChange={e => set("pincode", e.target.value)} placeholder="263001" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={LABEL + " mb-0"}>GPS Coordinates</label>
                    <button type="button" onClick={handleGetLocation}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Use current location
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className={INPUT} value={form.latitude} onChange={e => set("latitude", e.target.value)} placeholder="Latitude" />
                    <input className={INPUT} value={form.longitude} onChange={e => set("longitude", e.target.value)} placeholder="Longitude" />
                  </div>
                  {form.latitude && form.longitude && (
                    <p className="text-xs text-green-600 mt-1">Location set: {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Banking */}
            {step === 4 && (
              <div className="space-y-4">
                <SectionHeader icon={CreditCard} color="amber" title="Bank Account Details" />
                <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Your bank details are used for receiving payments. All data is encrypted and secure.
                </p>
                <div>
                  <label className={LABEL}>Account Holder Name</label>
                  <input className={INPUT} value={form.bankAccountHolderName} onChange={e => set("bankAccountHolderName", e.target.value)} placeholder="Full name as per bank records" />
                </div>
                <div>
                  <label className={LABEL}>Bank Account Number</label>
                  <input className={INPUT} value={form.bankAccountNumber} onChange={e => set("bankAccountNumber", e.target.value)} placeholder="Enter account number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>IFSC Code</label>
                    <input className={INPUT} value={form.bankIfsc} onChange={e => set("bankIfsc", e.target.value.toUpperCase())} placeholder="SBIN0001234" />
                  </div>
                  <div>
                    <label className={LABEL}>Bank Name</label>
                    <input className={INPUT} value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="State Bank of India" />
                  </div>
                </div>
                <div className="mt-2 bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Registration Summary</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                    <span className="text-slate-400">Name</span><span className="font-medium">{form.fullName}</span>
                    <span className="text-slate-400">Store</span><span className="font-medium">{form.storeName}</span>
                    <span className="text-slate-400">Category</span><span className="font-medium capitalize">{form.storeCategory}</span>
                    <span className="text-slate-400">City</span><span className="font-medium">{form.city || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: KYC Documents */}
            {step === 5 && (
              <div className="space-y-4">
                <SectionHeader icon={Shield} color="indigo" title="KYC Documents" />
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Upload clear photos or scans. Any image or PDF format is accepted. Items marked <strong>Required</strong> must be uploaded before admin can approve your account.
                  </p>
                </div>
                <div className="space-y-3">
                  {DOC_FIELDS.map(({ key, label, desc, required }) => {
                    const uploaded = docs[key];
                    const isUploading = uploading === key;
                    return (
                      <div key={key} className={clsx(
                        "rounded-xl border p-3 transition-all",
                        uploaded ? "border-green-300 bg-green-50" : required ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"
                      )}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {uploaded
                              ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                              : <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                            }
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                {label}
                                {required && !uploaded && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{uploaded ? "Uploaded" : desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {uploaded && (
                              <a href={`http://localhost:8080${uploaded}`} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                                <Image className="w-3 h-3" /> View
                              </a>
                            )}
                            <button type="button" disabled={isUploading} onClick={() => fileInputRefs.current[key]?.click()}
                              className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                                uploaded ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-blue-600 text-white hover:bg-blue-700"
                              )}>
                              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              {isUploading ? "Uploading..." : uploaded ? "Replace" : "Upload"}
                            </button>
                            <input type="file" accept="*/*" className="hidden"
                              ref={el => { fileInputRefs.current[key] = el; }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(key, file);
                                e.target.value = "";
                              }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-slate-700">Upload Progress</span>
                    <span className="text-slate-500">{Object.keys(docs).length}/{DOC_FIELDS.length} uploaded</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(Object.keys(docs).length / DOC_FIELDS.length) * 100}%` }} />
                  </div>
                  {!allRequiredUploaded && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Upload required documents to submit.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            {step > 1 && step < 5 ? (
              <button onClick={prev}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : step === 1 ? (
              <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700">Already registered?</Link>
            ) : (
              <div />
            )}

            {step < 4 && (
              <button onClick={next}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 4 && !registered && (
              <button onClick={handleRegister} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account & Continue
              </button>
            )}
            {step === 5 && (
              <button onClick={handleFinish} disabled={!allRequiredUploaded || !!uploading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                <Camera className="w-4 h-4" /> Submit Application
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          By registering you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, color, title }: { icon: React.ElementType; color: string; title: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600", purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600", amber: "bg-amber-100 text-amber-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center", colors[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
    </div>
  );
}
