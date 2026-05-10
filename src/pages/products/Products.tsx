import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
  type SellerProduct, type SellerProductRequest
} from "../../api/sellerApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import {
  Plus, Edit2, Trash2, Search, Package, Eye, EyeOff, Loader2, Image
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const emptyProduct = (): SellerProductRequest => ({
  name: "", description: "", categorySlug: "", price: 0, originalPrice: 0,
  unit: "", badge: "", sku: "", stockQuantity: 0, gstPercent: 0,
  image: "", images: [], tags: [], available: true,
});

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SellerProduct | null>(null);
  const [form, setForm] = useState<SellerProductRequest>(emptyProduct());

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["seller", "products"],
    queryFn: fetchProducts,
  });

  const set = <K extends keyof SellerProductRequest>(k: K, v: SellerProductRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const saveMut = useMutation({
    mutationFn: (data: SellerProductRequest) =>
      editing ? updateProduct(editing.id, data) : createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "products"] });
      qc.invalidateQueries({ queryKey: ["seller", "dashboard"] });
      setModalOpen(false);
      toast.success(editing ? "Product updated" : "Product added — pending approval");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller", "products"] });
      toast.success("Product removed");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const openAdd = () => { setEditing(null); setForm(emptyProduct()); setModalOpen(true); };
  const openEdit = (p: SellerProduct) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, categorySlug: p.categorySlug,
      price: p.price, originalPrice: p.originalPrice, unit: p.unit,
      badge: p.badge ?? "", sku: p.sku ?? "", stockQuantity: p.stockQuantity,
      gstPercent: p.gstPercent, image: p.image ?? "", images: p.images ?? [],
      tags: p.tags ?? [], available: p.available,
    });
    setModalOpen(true);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.categorySlug.toLowerCase().includes(search.toLowerCase())
  );

  const discount = (p: SellerProduct) =>
    p.originalPrice > p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100)
      : 0;

  return (
    <div className="min-h-full">
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {search ? "No products match your search" : "No products yet"}
            </p>
            {!search && (
              <button onClick={openAdd} className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700">
                Add your first product →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                      {p.badge && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">{p.badge}</span>
                      )}
                      {discount(p) > 0 && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full shrink-0">{discount(p)}% OFF</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{p.categorySlug} · {p.unit}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">₹{p.price}</span>
                      {p.originalPrice > p.price && (
                        <span className="text-xs text-slate-400 line-through">₹{p.originalPrice}</span>
                      )}
                      <span className="text-xs text-slate-500">Stock: {p.stockQuantity}</span>
                      <span className="text-xs text-slate-500">GST: {p.gstPercent}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this product?")) deleteMut.mutate(p.id); }}
                        className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                      p.available ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {p.available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {p.available ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={editing ? "Edit Product" : "Add New Product"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700">
              Cancel
            </button>
            <button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.name || form.price <= 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-700"
            >
              {saveMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Update" : "Add Product"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Basic info */}
          <div>
            <label className={LABEL}>Product Name *</label>
            <input className={INPUT} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Fresh Mangoes" />
          </div>
          <div>
            <label className={LABEL}>Description</label>
            <textarea rows={3} className={INPUT} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe your product..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Category / Slug</label>
              <input className={INPUT} value={form.categorySlug} onChange={e => set("categorySlug", e.target.value)} placeholder="fruits, vegetables, mobiles..." />
            </div>
            <div>
              <label className={LABEL}>Unit</label>
              <input className={INPUT} value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="1 kg, 500g, 1 pc..." />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Selling Price (₹) *</label>
              <input type="number" className={INPUT} value={form.price || ""} onChange={e => set("price", Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className={LABEL}>MRP / Original Price (₹)</label>
              <input type="number" className={INPUT} value={form.originalPrice || ""} onChange={e => set("originalPrice", Number(e.target.value))} placeholder="0" />
            </div>
          </div>

          {/* Stock, GST, SKU */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Stock Qty</label>
              <input type="number" className={INPUT} value={form.stockQuantity || ""} onChange={e => set("stockQuantity", Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className={LABEL}>GST %</label>
              <input type="number" className={INPUT} value={form.gstPercent || ""} onChange={e => set("gstPercent", Number(e.target.value))} placeholder="5" />
            </div>
            <div>
              <label className={LABEL}>SKU</label>
              <input className={INPUT} value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="SKU-001" />
            </div>
          </div>

          {/* Badge */}
          <div>
            <label className={LABEL}>Badge Text</label>
            <input className={INPUT} value={form.badge} onChange={e => set("badge", e.target.value)} placeholder="BEST SELLER, NEW, FRESH..." />
          </div>

          {/* Image URLs */}
          <div>
            <label className={LABEL}>Main Image URL</label>
            <input className={INPUT} value={form.image} onChange={e => set("image", e.target.value)} placeholder="https://..." />
            {form.image && (
              <img src={form.image} alt="preview" className="mt-2 h-24 w-24 object-cover rounded-xl border border-slate-200" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className={LABEL}>Tags (comma-separated)</label>
            <input
              className={INPUT}
              value={form.tags?.join(", ")}
              onChange={e => set("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
              placeholder="organic, fresh, local..."
            />
          </div>

          {/* Availability */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="avail"
              checked={form.available}
              onChange={e => set("available", e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="avail" className="text-sm text-slate-700">Product is available for purchase</label>
          </div>

          {!editing && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              New products require admin approval before they appear in the store catalog.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
