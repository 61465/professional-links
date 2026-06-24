# MobeFace

واجهة عربية لتجميع إعلانات الهواتف والأجهزة والألعاب من مصادر عامة (Craigslist + eBay) في منطقة Springfield 01119، مع روابط مباشرة للمنصات المحمية (Facebook/OfferUp) وتحليل صفقة محلي.

## التشغيل السريع

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend (تيرمنال منفصل)
cd frontend
npm install
npm run dev
# http://localhost:5173
```

## النشر للإنتاج

اقرأ [DEPLOYMENT.md](../DEPLOYMENT.md) — يغطي Fly.io + Cloudflare Pages (مجاني) أو Docker Compose على VPS.

## البنية

```
mobeface/
├── backend/        FastAPI + httpx + bs4 (scraper مع cache 15 دقيقة)
├── frontend/       React 19 + Vite 8
├── Caddyfile       reverse proxy + static
├── docker-compose.yml
├── fly.toml        إعدادات نشر Fly.io
└── .env.example    قائمة المتغيرات
```

## ملاحظات

- التطوير: Vite يُمرّر `/api` إلى `http://localhost:8001`.
- الإنتاج: عيّن `VITE_API_BASE` لعنوان الـ backend الكامل قبل البناء.
- eBay يحجب الـ scraping من IPs السحابية. الـ Craigslist يعمل. لتفعيل eBay في الإنتاج استخدم Browse API (OAuth).
