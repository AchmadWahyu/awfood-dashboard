// Feature flags — fitur yang OFF di first release (Restock, Klaim, Ledger),
// sampai waktu yang belum ditentukan. Set `true` untuk memunculkannya di menu
// kapan saja tanpa menghapus kode halaman. Halaman tetap ada di filesystem.
export const FEATURE_FLAGS = {
  restock: false,
  klaim: false,
  ledger: false,
  requestEdit: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
