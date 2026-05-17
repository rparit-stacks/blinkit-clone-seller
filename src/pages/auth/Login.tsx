import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sellerLogin } from "../../api/sellerApi";
import { Store, Eye, EyeOff, Loader2, TrendingUp, ShoppingBag, Wallet, Star } from "lucide-react";
import { toast } from "sonner";

const perks = [
  { icon: TrendingUp, label: "Real-time Analytics", desc: "Track revenue and order trends live" },
  { icon: ShoppingBag,  label: "Order Management",  desc: "Accept, dispatch, and track orders" },
  { icon: Wallet,       label: "Instant Payouts",   desc: "Get paid directly to your bank" },
  { icon: Star,         label: "Store Branding",    desc: "Custom storefront with your logo" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const res = await sellerLogin(form.email, form.password);
      login(res);
      navigate("/dashboard");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left — brand panel (desktop) */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden bg-[#0B1120]">
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-80px] w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">NainiStore</p>
              <p className="text-white/40 text-xs">Seller Portal</p>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3 leading-tight">
            Grow your business<br />in Nainital
          </h2>
          <p className="text-white/50 text-sm mb-10 leading-relaxed">
            Join local sellers already earning through the NainiStore marketplace platform.
          </p>
          <div className="space-y-3">
            {perks.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-white/40 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/25">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Seller Portal</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to manage your store</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-600/20 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New seller?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register your store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
