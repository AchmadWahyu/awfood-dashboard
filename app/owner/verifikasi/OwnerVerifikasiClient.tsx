"use client";

import { useState, useMemo, useCallback, useEffect, startTransition } from "react";
import { toast } from "sonner";
import type { DailyClosing, Item, Supplier } from "@/lib/dummy/types";
import { getSubmittedClosings, getClosingDetail, verifyClosing, rejectClosing } from "./actions";
import { formatRp, formatDateDisplay } from "@/lib/utils/format";
import FormattedNumberInput from "@/components/FormattedNumberInput";

interface SupplierGroup {
  supplier: Supplier | undefined;
  items: (DailyClosing["items"][number] & { item: Item; restock: number })[];
  totalTerjual: number;
  totalOmzet: number;
}

export default function OwnerVerifikasiClient({
  initialClosings,
  initialItems,
  initialSuppliers,
}: {
  initialClosings: DailyClosing[];
  initialItems: Item[];
  initialSuppliers: Supplier[];
}) {
  const [closings, setClosings] = useState<DailyClosing[]>(initialClosings);
  const [items] = useState<Item[]>(initialItems);
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<DailyClosing | null>(null);
  const [cashInitialInput, setCashInitialInput] = useState("");
  const [qrisInput, setQrisInput] = useState("");
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadClosingDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const detail = await getClosingDetail(id);
      if (detail) {
        setSelected(detail);
      }
    } catch (error) {
      console.error("Error loading closing detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load verification detail as a non-urgent update after selecting a closing.
  useEffect(() => {
    if (selectedId) {
      startTransition(() => {
        void loadClosingDetail(selectedId);
      });
    }
  }, [selectedId]);

  const previewCalculation = useMemo(() => {
    if (!selected) return null;
    const cashInitial = parseInt(cashInitialInput) || 0;
    const qris = parseInt(qrisInput) || 0;
    const expected = selected.total_omzet;
    const expensesCash =
      selected.expenses?.filter((e) => e.pocket === "CASH_LACI")
        .reduce((sum, e) => sum + e.amount, 0) || 0;
    const expensesQris =
      selected.expenses?.filter((e) => e.pocket === "QRIS_AWFOOD")
        .reduce((sum, e) => sum + e.amount, 0) || 0;
    const effectiveCashRevenue = selected.cash_physical - cashInitial + expensesCash;
    const effectiveQrisRevenue = qris + expensesQris;
    const discrepancy = expected - (effectiveCashRevenue + effectiveQrisRevenue);
    return {
      cashInitial,
      qris,
      expected,
      effectiveCashRevenue,
      effectiveQrisRevenue,
      expensesCash,
      expensesQris,
      discrepancy,
      hasDiscrepancy: Math.abs(discrepancy) > 5000,
    };
  }, [selected, cashInitialInput, qrisInput]);

  const supplierGroups = useMemo<SupplierGroup[]>(() => {
    if (!selected) return [];
    const groups = new Map<string, SupplierGroup>();
    for (const ci of selected.items) {
      const item = items.find((x) => x.id === ci.item_id);
      if (!item) continue;
      if (ci.stok_awal === 0 && ci.terjual === 0) continue;
      const sid = item.supplier_id || "owner";
      if (!groups.has(sid)) {
        groups.set(sid, {
          supplier: suppliers.find((s) => s.id === sid),
          items: [],
          totalTerjual: 0,
          totalOmzet: 0,
        });
      }
      const g = groups.get(sid)!;
      g.items.push({ ...ci, item, restock: 0 });
      g.totalTerjual += ci.terjual;
      g.totalOmzet += ci.total_rp;
    }
    return Array.from(groups.values());
  }, [selected, items, suppliers]);

  const refresh = async () => {
    const data = await getSubmittedClosings();
    setClosings(data);
  };

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setSelected(null);
    setCashInitialInput("");
    setQrisInput("");
    setRejectReason("");
    setShowRejectModal(false);
  }, []);

  // Reset the supplier accordion when the selected closing changes.
  useEffect(() => {
    startTransition(() => setOpenSupplierId(null));
  }, [selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRejectModal) {
          setShowRejectModal(false);
        } else {
          closeDetail();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDetail, showRejectModal]);

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const handleVerify = async () => {
    if (!selected || !previewCalculation || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await verifyClosing({
        closingId: selected.id,
        cashInitial: previewCalculation.cashInitial,
        qrisVerified: previewCalculation.qris,
      });
      toast.success("Closing berhasil diverifikasi.");
      await refresh();
      closeDetail();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal verifikasi closing.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await rejectClosing({
        closingId: selected.id,
        reason: rejectReason.trim(),
      });
      toast.success("Closing berhasil ditolak.");
      await refresh();
      closeDetail();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menolak closing.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    cashInitialInput !== "" &&
    qrisInput !== "" &&
    previewCalculation &&
    previewCalculation.cashInitial >= 0 &&
    previewCalculation.qris >= 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold text-ink">Verifikasi Closing</h2>

      {closings.length === 0 ? (
        <div className="rounded-2xl border border-notch-border bg-paper-light p-8 text-center text-ink-light text-sm">
          Tidak ada closing yang menunggu verifikasi.
        </div>
      ) : (
        <div className="space-y-3">
          {closings.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setCashInitialInput(""); setQrisInput(""); setRejectReason(""); setShowRejectModal(false); }}
              className="w-full text-left rounded-2xl border border-notch-border bg-paper-light p-5 shadow-sm hover:bg-paper transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-ink">{formatDateDisplay(c.date)}</span>
                <span className="text-xs text-ink-light">{c.staff_name}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-light">
                <span>Omzet: {formatRp(c.total_omzet)}</span>
                <span>Kas Fisik: {formatRp(c.cash_physical)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Sheet Detail */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={closeDetail}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail closing ${selected.date}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet-up max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-notch-border bg-paper-light p-6 pb-24 shadow-xl sm:max-w-lg sm:rounded-3xl sm:border sm:mb-6"
          >
            {isLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold">Memuat detail...</div>
              </div>
            )}
            {/* Handle indicator */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ruled" />

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-ink">
                Detail Closing {formatDateDisplay(selected.date)}
              </h3>
              <button
                onClick={closeDetail}
                className="rounded-lg border border-notch-border px-3 py-1 text-xs font-bold text-ink-light hover:bg-paper transition-colors"
                aria-label="Tutup detail"
              >
                Tutup
              </button>
            </div>
            <div className="text-xs text-ink-light mb-4">
              Oleh {selected.staff_name}
            </div>

            {/* Accordion per supplier */}
            <div className="space-y-3 mb-4">
              {supplierGroups.map((g) => {
                const sid = g.supplier?.id || "owner";
                const isOpen = openSupplierId === sid;
                return (
                  <div
                    key={sid}
                    className="rounded-xl border border-cream-border overflow-hidden"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => setOpenSupplierId(isOpen ? null : sid)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-cream-card/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#A0522D" }}
                        >
                          {g.supplier?.name || "Minuman Milik Sendiri"}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {g.items.length} produk · {g.totalTerjual} pcs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-marker">
                          {formatRp(g.totalOmzet)}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className={`text-ink-light transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {/* Accordion Body - Card Detail */}
                    {isOpen && (
                      <div className="border-t border-cream-border px-4 py-4 space-y-3">
                        {g.items.map((ci) => (
                          <div
                            key={ci.id}
                            className="rounded-xl border border-ruled bg-paper-light p-4"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <p className="text-sm font-semibold text-ink truncate">
                                {ci.item.name}
                              </p>
                              <span className="text-xs font-bold text-marker tabular-nums shrink-0">
                                {formatRp(ci.total_rp)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-light">
                              <div className="flex flex-col items-center gap-1 flex-2">
                                <p>Awal</p> <strong className="text-ink tabular-nums">{ci.stok_awal}</strong>
                              </div>
                              <div className="flex flex-col items-center gap-1 flex-2">
                                <p>Akhir</p> <strong className="text-ink tabular-nums">{ci.stok_akhir}</strong>
                              </div>
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <p>Terjual</p> <strong className="text-ink tabular-nums text-notch-success-text">{ci.terjual}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Supplier Footer */}
                        <div className="flex items-center justify-between rounded-xl bg-cream-card px-4 py-3 border border-cream-border">
                          <span className="font-semibold text-sm">
                            Total {g.supplier?.name || "Minuman Milik Sendiri"}
                          </span>
                          <span className="font-bold text-sm text-marker">
                            {formatRp(g.totalOmzet)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {supplierGroups.length === 0 && (
                <p className="text-sm text-text-secondary py-4 text-center">
                  Tidak ada item dengan transaksi.
                </p>
              )}
            </div>

            {/* Ringkasan */}
            <div className="border-t border-ruled pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">Total Omzet</span>
                <span className="text-base font-bold text-marker">
                  {formatRp(selected.total_omzet)}
                </span>
              </div>

              {/* Kas Fisik (readonly dari staff) */}
              <div className="rounded-lg bg-paper px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-light">Kas Fisik (dari staff)</span>
                  <span className="font-bold tabular-nums">
                    {formatRp(selected.cash_physical)}
                  </span>
                </div>
              </div>

              {/* Pengeluaran Hari Ini */}
              {selected.expenses && selected.expenses.length > 0 && (
                <div className="rounded-lg bg-paper px-3 py-2 space-y-1">
                  <p className="text-xs font-bold text-ink">Pengeluaran Hari Ini</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-light">Cash Laci</span>
                    <span className="font-bold tabular-nums text-marker">
                      {formatRp(
                        selected.expenses
                          .filter((e) => e.pocket === "CASH_LACI")
                          .reduce((sum, e) => sum + e.amount, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-light">QRIS AW Food</span>
                    <span className="font-bold tabular-nums text-marker">
                      {formatRp(
                        selected.expenses
                          .filter((e) => e.pocket === "QRIS_AWFOOD")
                          .reduce((sum, e) => sum + e.amount, 0)
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-light">
                    {selected.expenses.length} item tercatat
                  </p>
                </div>
              )}
            </div>

            {/* Form Verifikasi */}
            <div className="border-t border-ruled pt-4 space-y-4 mt-4">
              {/* Kas Awal */}
              <div>
                <label className="block text-xs text-ink-light mb-1">
                  Kas Awal (uang kembalian di laci) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-ink">Rp</span>
                  <FormattedNumberInput
                    value={cashInitialInput}
                    onChange={setCashInitialInput}
                    placeholder="0"
                    className="w-full rounded-xl border-2 border-ruled bg-transparent px-4 py-2 text-lg font-bold text-ink outline-none focus:border-marker transition-colors"
                  />
                </div>
              </div>

              {/* QRIS Final */}
              <div>
                <label className="block text-xs text-ink-light mb-1">
                  QRIS Final (dari mutasi bank) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-ink">Rp</span>
                  <FormattedNumberInput
                    value={qrisInput}
                    onChange={setQrisInput}
                    placeholder="0"
                    className="w-full rounded-xl border-2 border-ruled bg-transparent px-4 py-2 text-lg font-bold text-ink outline-none focus:border-marker transition-colors"
                  />
                </div>
              </div>

              {/* Preview Selisih */}
              {previewCalculation && (
                <div
                  className={`rounded-xl border px-4 py-3 ${
                    previewCalculation.hasDiscrepancy
                      ? "border-red-200 bg-red-50"
                      : "border-notch-success bg-notch-success/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`font-medium ${
                        previewCalculation.hasDiscrepancy
                          ? "text-red-700"
                          : "text-notch-success-text"
                      }`}
                    >
                      {previewCalculation.hasDiscrepancy
                        ? "⚠️ Ada Selisih"
                        : "✓ Tidak Ada Selisih"}
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        previewCalculation.hasDiscrepancy
                          ? "text-red-600"
                          : "text-notch-success-text"
                      }`}
                    >
                      {previewCalculation.discrepancy === 0
                        ? "Rp 0"
                        : `${
                            previewCalculation.discrepancy > 0 ? "-" : "+"
                          }${formatRp(
                            Math.abs(previewCalculation.discrepancy)
                          )}`}
                    </span>
                  </div>
                  {!previewCalculation.hasDiscrepancy &&
                    previewCalculation.discrepancy !== 0 && (
                      <p className="text-xs text-ink-light mt-1">
                        Selisih dalam batas toleransi (≤ Rp5.000)
                      </p>
                    )}
                  {previewCalculation.hasDiscrepancy && (
                    <p className="text-xs text-red-600 mt-1">
                      Selisih melebihi batas toleransi (Rp5.000). Akan masuk ke
                      daftar investigasi.
                    </p>
                  )}
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleVerify}
                  disabled={!canSubmit || isSubmitting}
                  className="w-full rounded-xl bg-marker px-4 py-3 text-sm font-bold text-white hover:bg-marker-hover transition-colors disabled:opacity-40"
                >
                  {isSubmitting ? "Memproses..." : "Verifikasi Closing"}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-2 border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  Tolak Closing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {showRejectModal && selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tolak closing"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-notch-border bg-paper-light p-6 shadow-xl"
          >
            <h3 className="text-base font-bold text-ink mb-2">
              Tolak Closing
            </h3>
            <p className="text-sm text-ink-light mb-4">
              Berikan alasan penolakan untuk closing tanggal {selected.date}.
              Staff akan melihat catatan ini.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Contoh: Data stok tidak sesuai dengan kertas supplier..."
              className="w-full rounded-xl border-2 border-ruled bg-transparent px-3 py-2 text-sm outline-none focus:border-marker transition-colors mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-xl border border-notch-border px-4 py-2.5 text-sm font-bold text-ink-light hover:bg-paper transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isSubmitting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {isSubmitting ? "Memproses..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
