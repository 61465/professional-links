# MobeFace — Deployment Guide

دليل نشر MobeFace للإنتاج. الخيارات مرتبة من **مجاني/بسيط** إلى **VPS كامل**.

---

## 1. الخيار الموصى به (مجاني): Fly.io + Cloudflare Pages

### A. Backend → Fly.io

```bash
# install flyctl: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
cd D:\project\mobeface
fly launch --no-deploy --copy-config --name mobeface-api   # يقرأ fly.toml
fly secrets set ALLOWED_ORIGINS="https://mobeface.pages.dev"
fly deploy
```

الـ backend سيُتاح على `https://mobeface-api.fly.dev`. تحقق:

```bash
curl https://mobeface-api.fly.dev/api/health
```

### B. Frontend → Cloudflare Pages

1. ادفع المشروع لـ GitHub.
2. Cloudflare Dashboard → Pages → Create → Connect to Git → اختر المستودع.
3. إعدادات البناء:
   - **Framework preset:** Vite
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Build output directory:** `frontend/dist`
4. Environment variables (Production):
   - `VITE_API_BASE` = `https://mobeface-api.fly.dev`
5. Deploy → سيُتاح على `https://mobeface.pages.dev`.

### C. CORS — حدّث الـ backend بعد معرفة دومين الـ frontend

```bash
fly secrets set ALLOWED_ORIGINS="https://mobeface.pages.dev,https://*.mobeface.pages.dev"
```

---

## 2. الخيار VPS واحد (Docker Compose)

أي VPS صغير (1GB RAM يكفي). يبني الواجهة محلياً ثم يخدمها Caddy + يعمل reverse-proxy لـ /api.

```bash
# على الـ VPS
git clone <repo> mobeface
cd mobeface
cp .env.example .env
# عدّل ALLOWED_ORIGINS داخل .env إلى دومينك (مثل http://your.domain)

# ابنِ الـ frontend مرة واحدة
cd frontend && npm install && npm run build && cd ..

# شغّل
docker compose up -d --build
```

التطبيق على `http://<vps-ip>` (Caddy port 80).
لـ HTTPS تلقائي عدّل `Caddyfile` ليبدأ بدومينك:

```caddy
your.domain {
    encode gzip zstd
    handle /api/* { reverse_proxy backend:8001 }
    handle {
        root * /srv
        try_files {path} /index.html
        file_server
    }
}
```

ثم Caddy يستلم شهادة Let's Encrypt تلقائياً.

---

## 3. تشغيل محلي للتطوير

```powershell
# backend
cd D:\project\mobeface\backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# frontend (تيرمنال آخر)
cd D:\project\mobeface\frontend
npm install
npm run dev
# يفتح على http://localhost:5173
```

---

## 4. متغيرات البيئة

| المتغير              | الافتراضي               | الوصف                                       |
| -------------------- | ----------------------- | ------------------------------------------- |
| `ALLOWED_ORIGINS`    | `http://localhost:5173` | قائمة CORS مفصولة بفواصل                    |
| `CACHE_TTL_SECONDS`  | `900` (15 دقيقة)         | مدة كاش الاستجابات                          |
| `LOG_LEVEL`          | `INFO`                  | مستوى التسجيل                               |
| `VITE_API_BASE`      | فارغ (proxy)            | عنوان الـ backend في بناء الإنتاج فقط       |

---

## 5. ملاحظات إنتاجية مهمة

### eBay مغلق على الـ scraping
eBay يحجب الـ RSS من IPs السحابية (403). الـ Craigslist يعمل بشكل ممتاز.
لتفعيل eBay في الإنتاج:
- سجّل في [eBay Developer Program](https://developer.ebay.com/) واستخدم **Browse API** (OAuth2).
- استبدل `fetch_ebay_rss()` بدالة تستخدم `Authorization: Bearer <token>`.

### الكاش
كاش في الذاكرة لـ 15 دقيقة لكل تركيبة (query, category, condition, source).
يحمي من ban الـ Craigslist ويُسرّع الاستجابة (~10x).

### Rate limiting
غير مفعّل حالياً لأن الاستخدام شخصي. لو أُتيح للعامة استخدم `slowapi`:
```python
from slowapi import Limiter
limiter = Limiter(key_func=lambda r: r.client.host)
@app.get("/api/listings")
@limiter.limit("30/minute")
```

### المراقبة
- صحة الـ backend: `GET /api/health`
- إحصائيات Fly: `fly status` + `fly logs`
- إحصائيات Cloudflare: Pages dashboard

---

## 6. الديون التقنية المؤجلة

- ☐ eBay Browse API بدل RSS (يحتاج OAuth credentials).
- ☐ Facebook Marketplace + OfferUp عبر WebView مدمج (موجود كروابط فقط).
- ☐ حفظ المفضلة (يحتاج DB — Supabase مجاني مناسب).
- ☐ تنبيهات بـ "صفقة جديدة تحت $X" (يحتاج DB + cron + push).
- ☐ تحسين detect_fault بالـ NLP بدل regex.
