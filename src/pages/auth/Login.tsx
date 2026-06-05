import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sellerLogin } from "../../api/sellerApi";
import { Store, Eye, EyeOff, Loader2, TrendingUp, ShoppingBag, Wallet, Star } from "lucide-react";
import { toast } from "sonner";

const perks = [
  { icon: TrendingUp, label: "Real-time Analytics", desc: "Track revenue and order trends live" },
  { icon: ShoppingBag, label: "Order Management", desc: "Accept, dispatch, and track orders" },
  { icon: Wallet, label: "Instant Payouts", desc: "Get paid directly to your bank" },
  { icon: Star, label: "Store Branding", desc: "Custom storefront with your logo" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill all fields");
      return;
    }
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
    <div className="min-h-screen flex" style={{ background: "#07090f" }}>
      {/* Left — Nainital hero image with perks */}
      <div
        className="hidden lg:flex w-1/2 relative flex-col justify-end p-14 overflow-hidden"
        style={{
          backgroundImage: 'url("/naini-hero.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090f] via-[#07090f]/70 to-[#07090f]/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #c8882a 0%, #e8ab3f 100%)",
                boxShadow: "0 8px 20px -4px rgba(200,136,42,0.5)",
              }}
            >
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">NainiStore</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                Seller Portal
              </p>
            </div>
          </div>

          <span
            className="inline-block text-[10px] font-bold uppercase tracking-[0.28em] mb-4"
            style={{ color: "#e8ab3f" }}
          >
            Nainital · Uttarakhand
          </span>
          <h2 className="text-[2.5rem] font-black text-white leading-[1.1] mb-4">
            Grow your<br />business in<br />Nainital
          </h2>
          <p className="text-sm leading-relaxed mb-10 max-w-[260px]" style={{ color: "rgba(255,255,255,0.42)" }}>
            Join local sellers already earning through the NainiStore marketplace.
          </p>

          <div className="space-y-3">
            {perks.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(232,171,63,0.15)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#e8ab3f" }} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — dark form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ background: "#07090f" }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{
                background: "linear-gradient(135deg, #c8882a 0%, #e8ab3f 100%)",
                boxShadow: "0 8px 20px -4px rgba(200,136,42,0.45)",
              }}
            >
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Seller Portal</h1>
          </div>

          <div className="hidden lg:block mb-10">
            <h1 className="text-2xl font-extrabold text-white">Welcome back</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>
              Sign in to manage your store
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(232,171,63,0.45)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
              />
            </div>

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(232,171,63,0.45)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 mt-2 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #c8882a 0%, #e8ab3f 100%)",
                boxShadow: "0 8px 24px -4px rgba(200,136,42,0.4)",
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            New seller?{" "}
            <Link to="/register" className="font-semibold" style={{ color: "#e8ab3f" }}>
              Register your store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
