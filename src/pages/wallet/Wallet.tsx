import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWallet, fetchWalletTransactions, fetchWithdrawals, requestWithdrawal,
  fetchProfile,
} from "../../api/sellerApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const TX_COLORS: Record<string, string> = {
  ORDER_EARNING: "text-green-600 bg-green-50",
  COMMISSION: "text-orange-600 bg-orange-50",
  REFUND: "text-blue-600 bg-blue-50",
  WITHDRAWAL: "text-red-600 bg-red-50",
  MANUAL_CREDIT: "text-green-600 bg-green-50",
  MANUAL_DEBIT: "text-red-600 bg-red-50",
  SETTLEMENT: "text-purple-600 bg-purple-50",
};

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  PROCESSED: CheckCircle,
  REJECTED: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-700 bg-yellow-100",
  APPROVED: "text-blue-700 bg-blue-100",
  PROCESSED: "text-green-700 bg-green-100",
  REJECTED: "text-red-700 bg-red-100",
};

interface WithdrawForm {
  amountRupees: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankAccountHolderName: string;
  bankName: string;
  upiId: string;
  method: "bank" | "upi";
}

export default function Wallet() {
  const qc = useQueryClient();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [form, setForm] = useState<WithdrawForm>({
    amountRupees: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankAccountHolderName: "",
    bankName: "",
    upiId: "",
    method: "bank",
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["seller", "wallet"],
    queryFn: fetchWallet,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["seller", "wallet", "transactions"],
    queryFn: () => fetchWalletTransactions(0, 30),
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["seller", "wallet", "withdrawals"],
    queryFn: fetchWithdrawals,
  });

  const { data: profile } = useQuery({
    queryKey: ["seller", "profile"],
    queryFn: fetchProfile,
  });

  const withdrawMut = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "wallet"] });
      toast.success("Withdrawal request submitted");
      setShowWithdrawModal(false);
      setForm({ amountRupees: "", bankAccountNumber: "", bankIfsc: "", bankAccountHolderName: "", bankName: "", upiId: "", method: "bank" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleWithdraw = () => {
    const amount = parseFloat(form.amountRupees);
    if (!amount || amount < 100) {
      toast.error("Minimum withdrawal is ₹100");
      return;
    }
    withdrawMut.mutate({
      amountRupees: amount,
      bankAccountNumber: form.method === "bank" ? form.bankAccountNumber : undefined,
      bankIfsc: form.method === "bank" ? form.bankIfsc : undefined,
      bankAccountHolderName: form.method === "bank" ? form.bankAccountHolderName : undefined,
      bankName: form.method === "bank" ? form.bankName : undefined,
      upiId: form.method === "upi" ? form.upiId : undefined,
    });
  };

  const prefillBank = () => {
    if (profile) {
      setForm(f => ({
        ...f,
        bankAccountNumber: profile.bankAccountNumber || "",
        bankIfsc: profile.bankIfsc || "",
        bankAccountHolderName: profile.bankAccountHolderName || "",
        bankName: profile.bankName || "",
      }));
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === "PENDING");

  return (
    <div className="min-h-full">
      <PageHeader title="Wallet" subtitle="Earnings, transactions & withdrawals" />

      <div className="p-6 space-y-5">
        {/* Balance card */}
        {walletLoading ? (
          <div className="h-44 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ) : wallet ? (
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Available Balance</p>
                <p className="text-3xl font-bold">₹{wallet.balanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <WalletIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-blue-200 text-[10px] font-medium">Pending</p>
                <p className="text-sm font-bold mt-0.5">₹{wallet.pendingBalanceRupees.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-[10px] font-medium">Total Earned</p>
                <p className="text-sm font-bold mt-0.5">₹{wallet.lifetimeEarnedRupees.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-[10px] font-medium">Withdrawn</p>
                <p className="text-sm font-bold mt-0.5">₹{wallet.lifetimeWithdrawnRupees.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={wallet.balanceRupees < 100}
              className="mt-4 w-full bg-white text-blue-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Withdraw Funds
            </button>
            {wallet.balanceRupees < 100 && (
              <p className="text-center text-blue-200 text-[10px] mt-1.5">Minimum ₹100 balance required</p>
            )}
          </div>
        ) : null}

        {/* Pending withdrawal notice */}
        {pendingWithdrawals.length > 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-800">
              You have {pendingWithdrawals.length} pending withdrawal request{pendingWithdrawals.length > 1 ? "s" : ""} totalling{" "}
              ₹{pendingWithdrawals.reduce((a, w) => a + w.amountRupees, 0).toFixed(2)}
            </p>
          </div>
        )}

        {/* Withdrawal history */}
        {withdrawals.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-3">Withdrawal Requests</p>
            <div className="space-y-2">
              {withdrawals.map(wd => {
                const Icon = STATUS_ICON[wd.status] ?? Clock;
                return (
                  <div key={wd.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                    <div className={clsx("p-2 rounded-lg", STATUS_COLORS[wd.status])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">₹{wd.amountRupees.toFixed(2)}</p>
                        <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[wd.status])}>
                          {wd.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(wd.createdAt).toLocaleDateString()} ·{" "}
                        {wd.upiId ? `UPI: ${wd.upiId}` : wd.bankAccountNumber ? `A/C: ···${wd.bankAccountNumber.slice(-4)}` : ""}
                      </p>
                      {wd.utrReference && (
                        <p className="text-[10px] text-green-600 font-medium mt-0.5">UTR: {wd.utrReference}</p>
                      )}
                      {wd.adminNote && (
                        <p className="text-[10px] text-red-600 mt-0.5">{wd.adminNote}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-3">Recent Transactions</p>
          {txLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 py-12 text-center">
              <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const isCredit = ["ORDER_EARNING", "REFUND", "MANUAL_CREDIT"].includes(tx.type);
                return (
                  <div key={tx.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                    <div className={clsx("p-2 rounded-lg shrink-0", TX_COLORS[tx.type] ?? "text-slate-600 bg-slate-100")}>
                      {isCredit
                        ? <ArrowDownLeft className="w-4 h-4" />
                        : <ArrowUpRight className="w-4 h-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {tx.note || tx.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(tx.createdAt).toLocaleString()} · Balance: ₹{tx.balanceAfterRupees.toFixed(2)}
                      </p>
                    </div>
                    <p className={clsx(
                      "text-sm font-bold shrink-0",
                      isCredit ? "text-green-600" : "text-red-600"
                    )}>
                      {isCredit ? "+" : "-"}₹{tx.amountRupees.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal modal */}
      <Modal
        title="Withdraw Funds"
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        size="sm"
      >
        <div className="space-y-4">
          {/* Available */}
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-600 font-medium">Available to withdraw</p>
            <p className="text-2xl font-bold text-blue-800 mt-0.5">₹{wallet?.balanceRupees.toFixed(2)}</p>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Amount (₹)</label>
            <input
              type="number"
              min={100}
              max={wallet?.balanceRupees}
              step={1}
              value={form.amountRupees}
              onChange={e => setForm(f => ({ ...f, amountRupees: e.target.value }))}
              placeholder="Min ₹100"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Method toggle */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Withdrawal Method</label>
            <div className="flex gap-2">
              {(["bank", "upi"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setForm(f => ({ ...f, method: m }))}
                  className={clsx(
                    "flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors",
                    form.method === m
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {m === "bank" ? "Bank Transfer" : "UPI"}
                </button>
              ))}
            </div>
          </div>

          {form.method === "bank" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Bank Details</p>
                {profile?.bankAccountNumber && (
                  <button
                    onClick={prefillBank}
                    className="text-xs text-blue-600 font-medium hover:underline"
                  >
                    Use saved details
                  </button>
                )}
              </div>
              {[
                { key: "bankAccountHolderName", label: "Account Holder Name", placeholder: "As per bank records" },
                { key: "bankAccountNumber", label: "Account Number", placeholder: "Enter account number" },
                { key: "bankIfsc", label: "IFSC Code", placeholder: "e.g. HDFC0001234" },
                { key: "bankName", label: "Bank Name", placeholder: "e.g. HDFC Bank" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof WithdrawForm] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">UPI ID</label>
              <input
                type="text"
                value={form.upiId}
                onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))}
                placeholder="yourname@upi"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={withdrawMut.isPending}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {withdrawMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Withdrawal Request
          </button>
          <p className="text-center text-xs text-slate-500">Withdrawals are processed within 2-3 business days</p>
        </div>
      </Modal>
    </div>
  );
}
