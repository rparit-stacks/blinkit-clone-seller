import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sellerRegister } from "../../api/sellerApi";
import {
  Store, ChevronRight, ChevronLeft, Check, Loader2,
  User, Building2, MapPin, CreditCard, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Business", icon: Building2 },
  { id: 3, label: "Location", icon: MapPin },
  { id: 4, label: "Banking", icon: CreditCard },
];

type FormData = {
  fullName: string; email: string; phone: string; password: string; confirmPassword: string;
  storeName: string; storeCategory: string; description: string;
  gstNumber: string; panNumber: string; businessRegNumber: string;
  addressLine: string; city: string; state: string; pincode: string;
  latitude: string; longitude: string;
  bankAccountNumber: string; bankIfsc: string; bankAccountHolderName: string; bankName: string;
};

const emptyForm = (): FormData => ({
  fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  storeName: "", storeCategory: "bazaar", description: "",
  gstNumber: "", panNumber: "", businessRegNumber: "",
  addressLine: "", city: "", state: "", pincode: "",
  latitude: "", longitude: "",
  bankAccountNumber: "", bankIfsc: "", bankAccountHolderName: "", bankName: "",
});

const INPUT = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.fullName || !form.email || !form.phone || !form.password) {
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await sellerRegister({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        storeName: form.storeName,
        storeCategory: form.storeCategory,
        description: form.description,
        gstNumber: form.gstNumber,
        panNumber: form.panNumber,
        businessRegNumber: form.businessRegNumber,
        addressLine: form.addressLine,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        bankAccountNumber: form.bankAccountNumber,
        bankIfsc: form.bankIfsc,
        bankAccountHolderName: form.bankAccountHolderName,
        bankName: form.bankName,
      });
      login(res);
      toast.success("Registration successful! Your application is under review.");
      navigate("/dashboard");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-600/30">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Create Seller Account</h1>
          <p className="text-slate-400 mt-1 text-sm">Join our marketplace as a seller</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={clsx(
                "flex flex-col items-center gap-1",
              )}>
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
                <div className={clsx(
                  "w-12 sm:w-16 h-0.5 mx-1 mb-4",
                  step > s.id ? "bg-green-500" : "bg-white/10"
                )} />
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
                <h2 className="text-base font-bold text-slate-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Full Name *</label>
                    <input className={INPUT} value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className={LABEL}>Phone *</label>
                    <input className={INPUT} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Email Address *</label>
                  <input type="email" className={INPUT} value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" />
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
                <h2 className="text-base font-bold text-slate-900 mb-4">Business Details</h2>
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
                <h2 className="text-base font-bold text-slate-900 mb-4">Store Address & Location</h2>
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
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" /> Use current location
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className={INPUT} value={form.latitude} onChange={e => set("latitude", e.target.value)} placeholder="Latitude" />
                    <input className={INPUT} value={form.longitude} onChange={e => set("longitude", e.target.value)} placeholder="Longitude" />
                  </div>
                  {form.latitude && form.longitude && (
                    <p className="text-xs text-green-600 mt-1">📍 Location set: {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Banking */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 mb-1">Bank Account Details</h2>
                <p className="text-xs text-slate-500 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
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

                {/* Summary */}
                <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-2">
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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                onClick={prev}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700">Already registered?</Link>
            )}

            {step < 4 ? (
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
