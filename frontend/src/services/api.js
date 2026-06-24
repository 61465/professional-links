// ── خدمة جلب البيانات الحقيقية من الـ Backend ───────────────────────────────
// In development Vite proxies /api to the backend. In production, set
// VITE_API_BASE if the API is hosted on another origin.
const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * يجلب إعلانات حقيقية من الـ backend (Craigslist + eBay RSS)
 * عند الفشل يعيد مصفوفة فارغة بدلاً من كسر التطبيق
 */
export async function fetchListings({ q = "", category = "all", condition = "all", source = "all" } = {}) {
  const params = new URLSearchParams({ q, category, condition, source });
  const res = await fetch(`${API_BASE}/api/listings?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.listings || [];
}

/** فحص إذا كان الـ backend يعمل */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
