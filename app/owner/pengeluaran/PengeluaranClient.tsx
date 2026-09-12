"use client";

import { useState, useMemo, useTransition } from "react";
import { addExpense, deleteExpense } from "./actions";
import type { Expense, ExpenseCategory, Pocket } from "@/lib/dummy/types";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "BAHAN_MINUMAN", label: "Bahan Minuman" },
  { value: "BAHAN_KUE", label: "Bahan Kue" },
  { value: "PLASTIK", label: "Plastik" },
  { value: "KARDUS", label: "Kardus" },
  { value: "NOTA", label: "Nota" },
  { value: "STEMPEL_STIKER", label: "Stempel/Stiker" },
  { value: "LAINNYA", label: "Lainnya" },
];

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function PengeluaranClient({
  initialExpenses,
}: {
  initialExpenses: Expense[];
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [form, setForm] = useState({
    category: "BAHAN_MINUMAN" as ExpenseCategory,
    custom_label: "",
    amount: "",
    pocket: "CASH_LACI" as Pocket,
    expense_date: todayLocal(),
    note: "",
  });
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("category", form.category);
    fd.append("pocket", form.pocket);
    fd.append("amount", form.amount);
    fd.append("expense_date", form.expense_date);
    fd.append("note", form.note);
    if (form.category === "LAINNYA") {
      fd.append("custom_label", form.custom_label);
    }

    startTransition(async () => {
      try {
        await addExpense(fd);
        setForm({
          category: "BAHAN_MINUMAN",
          custom_label: "",
          amount: "",
          pocket: "CASH_LACI",
          expense_date: todayLocal(),
          note: "",
        });
        // Refresh list by reloading page (server action revalidated)
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "Gagal menambah pengeluaran.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return;
    setDeletingId(id);
    try {
      await deleteExpense(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus pengeluaran.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalCash = expenses
    .filter((e) => e.pocket === "CASH_LACI")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalQris = expenses
    .filter((e) => e.pocket === "QRIS_AWFOOD")
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-ink">Pencatatan Pengeluaran</h2>
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm space-y-3 max-w-lg"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-light mb-1">Kategori</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as ExpenseCategory })
              }
              className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Kantong</label>
            <select
              value={form.pocket}
              onChange={(e) =>
                setForm({ ...form, pocket: e.target.value as Pocket })
              }
              className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker"
            >
              <option value="CASH_LACI">Cash Laci</option>
              <option value="QRIS_AWFOOD">QRIS AW Food</option>
            </select>
          </div>
        </div>
        {form.category === "LAINNYA" && (
          <div>
            <label className="block text-xs text-ink-light mb-1">
              Label Kustom
            </label>
            <input
              value={form.custom_label}
              onChange={(e) =>
                setForm({ ...form, custom_label: e.target.value })
              }
              className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-light mb-1">Nominal</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Tanggal</label>
            <input
              type="date"
              value={form.expense_date}
              onChange={(e) =>
                setForm({ ...form, expense_date: e.target.value })
              }
              required
              className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-light mb-1">Catatan</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={2}
            className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-marker px-4 py-2 text-xs font-bold text-white hover:bg-marker-hover transition-colors disabled:opacity-40"
        >
          {isPending ? "Memproses..." : "Catat Pengeluaran"}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-notch-border bg-paper-light p-4">
          <p className="text-xs text-ink-light">Total Pengeluaran Cash</p>
          <p className="text-xl font-bold text-ink">{formatRp(totalCash)}</p>
        </div>
        <div className="rounded-2xl border border-notch-border bg-paper-light p-4">
          <p className="text-xs text-ink-light">Total Pengeluaran QRIS</p>
          <p className="text-xl font-bold text-ink">{formatRp(totalQris)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {expenses.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded-xl border border-notch-border bg-paper-light p-4"
          >
            <div>
              <p className="text-sm font-bold text-ink">
                {e.category === "LAINNYA"
                  ? e.custom_label || "Lainnya"
                  : CATEGORIES.find((c) => c.value === e.category)?.label}
              </p>
              <p className="text-xs text-ink-light">
                {e.date} · {e.pocket === "CASH_LACI" ? "Cash Laci" : "QRIS"}{" "}
                {e.note && `· ${e.note}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-marker">
                {formatRp(e.amount)}
              </span>
              <button
                onClick={() => handleDelete(e.id)}
                disabled={deletingId === e.id}
                className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
              >
                {deletingId === e.id ? "..." : "Hapus"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
