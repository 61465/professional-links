"""
MobeFace Backend — Real Listings Aggregator
يجلب إعلانات حقيقية من eBay (RSS) وCraigslist (HTML scraping مع تحايل)
"""

import asyncio
import hashlib
import logging
import os
import re
import json
import time
from urllib.parse import urljoin
from datetime import datetime, timezone

import feedparser
import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, Query, Response
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
log = logging.getLogger("mobeface")

app = FastAPI(title="MobeFace API", version="1.1.0")

ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "900"))
_cache: dict[str, tuple[float, dict]] = {}
_cache_lock = asyncio.Lock()

# ── Headers تحاكي متصفح حقيقي ─────────────────────────────────────────────
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

FEED_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml, */*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

TIMEOUT = 15.0

# ── استعلامات البحث ────────────────────────────────────────────────────────
EBAY_QUERIES = [
    ("iphone used unlocked",        "moa"),
    ("samsung galaxy used",          "moa"),
    ("google pixel used",            "moa"),
    ("ps5 console",                  "vgm"),
    ("xbox series x",                "vgm"),
    ("nintendo switch oled",         "vgm"),
    ("ipad air used",                "tab"),
    ("macbook air used",             "sys"),
    ("oneplus phone used",           "moa"),
    ("motorola unlocked",            "moa"),
]

CRAIGSLIST_SEARCHES = [
    ("moa", "iphone"),
    ("moa", "samsung"),
    ("vgm", "ps5"),
    ("vgm", "xbox"),
    ("vgm", "switch"),
    ("moa", "ipad"),
    ("sys", "macbook"),
    ("moa", "pixel"),
]

CRAIGSLIST_CATS_BY_CATEGORY = {
    "phone": ["moa"],
    "gaming": ["vgm"],
    "tablet": ["moa", "sys"],
    "laptop": ["sys"],
    "accessories": ["moa", "ela"],
    "all": ["moa", "vgm", "sys"],
}
# ── تصنيف تلقائي ───────────────────────────────────────────────────────────
CATEGORY_RULES = {
    "phone":      ["iphone", "samsung", "galaxy", "pixel", "motorola", "oneplus", "xiaomi", "phone", "android"],
    "gaming":     ["ps5", "ps4", "xbox", "nintendo", "switch", "playstation", "quest", "gaming", "console"],
    "tablet":     ["ipad", "tab", "tablet"],
    "laptop":     ["macbook", "laptop", "dell", "hp ", "lenovo", "thinkpad"],
    "accessories":["airpods", "watch", "earbud", "headphone"],
}

PARTS_KEYWORDS = [
    "broken", "cracked", "parts", "for parts", "bad esn", "icloud",
    "locked", "bent", "water damage", "won't turn", "does not turn",
    "smashed", "damaged", "repair", "spares", "not working", "dead",
]

FAULT_PATTERNS = {
    "Cracked Screen":     ["cracked screen", "broken screen", "smashed screen"],
    "Cracked Back Glass": ["cracked back", "broken back glass"],
    "iCloud Locked":      ["icloud", "activation locked"],
    "Carrier Locked":     ["carrier locked", "network locked"],
    "Won't Turn On":      ["won't turn on", "does not turn on", "dead", "no power"],
    "Water Damage":       ["water damage", "liquid damage"],
    "Battery Issue":      ["battery", "swollen battery"],
    "Face ID Broken":     ["face id", "no face id"],
    "Bent Frame":         ["bent frame", "bent body"],
}

CATEGORY_IMAGES = {
    "phone":       "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=70",
    "gaming":      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=70",
    "tablet":      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=70",
    "laptop":      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=70",
    "accessories": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=70",
    "other":       "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=70",
}


# ── مساعدات ────────────────────────────────────────────────────────────────
def detect_category(text: str) -> str:
    t = text.lower()
    for cat, kws in CATEGORY_RULES.items():
        if any(k in t for k in kws):
            return cat
    return "other"


def detect_condition(text: str) -> str:
    t = text.lower()
    return "parts" if any(k in t for k in PARTS_KEYWORDS) else "working"


def detect_fault(text: str) -> str | None:
    t = text.lower()
    for fault, patterns in FAULT_PATTERNS.items():
        if any(p in t for p in patterns):
            return fault
    return None


def extract_price(text: str) -> int | None:
    match = re.search(r'\$\s*([\d,]+(?:\.\d{2})?)', text or "")
    if match:
        try:
            return int(float(match.group(1).replace(",", "")))
        except ValueError:
            pass
    return None


def make_id(prefix: str, url: str) -> str:
    return f"{prefix}-{hashlib.md5(url.encode()).hexdigest()[:8]}"


def time_ago(published) -> str:
    try:
        if published and hasattr(published, "tm_hour"):
            pub = datetime(*published[:6], tzinfo=timezone.utc)
            delta = datetime.now(timezone.utc) - pub
            hours = int(delta.total_seconds() // 3600)
            if hours < 1:
                m = max(1, int(delta.total_seconds() // 60))
                return f"{m}m"
            if hours < 24:
                return f"{hours}h"
            return f"{delta.days}d"
    except Exception:
        pass
    return "recently"


# ── eBay RSS Scraper ────────────────────────────────────────────────────────
async def fetch_ebay_rss(client: httpx.AsyncClient, query: str) -> list[dict]:
    """يجلب من eBay RSS — مجاني وموثوق"""
    url = (
        f"https://www.ebay.com/sch/i.html"
        f"?_nkw={query.replace(' ', '+')}"
        f"&_stpos=01119&_sadis=25&LH_BIN=1&_rss=1&_sacat=0"
    )
    results = []
    try:
        r = await client.get(url, headers=FEED_HEADERS, timeout=TIMEOUT, follow_redirects=True)
        if r.status_code != 200:
            return []
        feed = feedparser.parse(r.text)
        for entry in feed.entries[:8]:
            title   = (entry.get("title") or "").strip()
            link    = entry.get("link", "")
            summary = entry.get("summary") or entry.get("description") or ""

            # استخراج السعر من العنوان أو الملخص
            price = extract_price(title) or extract_price(summary)
            if not title or not link:
                continue
            if price and (price < 5 or price > 4000):
                continue

            cat   = detect_category(title)
            cond  = detect_condition(title + " " + summary)
            fault = detect_fault(title + " " + summary)

            # استخراج الصورة من الـ HTML المضمّن في summary
            img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', summary)
            image = img_match.group(1) if img_match else CATEGORY_IMAGES.get(cat, CATEGORY_IMAGES["other"])

            results.append({
                "id":          make_id("eb", link),
                "title":       title,
                "price":       price,
                "condition":   cond,
                "category":    cat,
                "source":      "ebay",
                "sourceLabel": "eBay",
                "sourceColor": "#e53238",
                "image":       image,
                "url":         link,
                "fault":       fault,
                "postedAgo":   time_ago(entry.get("published_parsed")),
                "city":        "Ships to 01119",
                "hot":         bool(price and price < 300 and cond == "working"),
            })
    except Exception as e:
        log.warning("eBay RSS '%s' failed: %s", query, e)
    return results


# ── Craigslist HTML Scraper ─────────────────────────────────────────────────
async def fetch_craigslist_html(client: httpx.AsyncClient, cat: str, query: str) -> list[dict]:
    """يجلب نتائج Craigslist الحقيقية ويرجع رابط الإعلان الفردي لا رابط البحث."""
    url = (
        f"https://springfield.craigslist.org/search/{cat}"
        f"?query={query.replace(' ', '+')}&postal=01119&search_distance=20"
    )
    results = []
    try:
        r = await client.get(url, headers=BROWSER_HEADERS, timeout=TIMEOUT, follow_redirects=True)
        if r.status_code != 200 or "blocked" in r.text.lower():
            url2 = f"https://springfield.craigslist.org/search/{cat}?query={query.replace(' ', '+')}"
            r = await client.get(url2, headers=BROWSER_HEADERS, timeout=TIMEOUT, follow_redirects=True)
            if r.status_code != 200:
                return []

        soup = BeautifulSoup(r.text, "lxml")
        items = (
            soup.select("li.cl-search-result")
            or soup.select("li.result-row")
            or soup.select("li.cl-static-search-result")
        )

        schema_items = []
        schema_tag = soup.select_one("script#ld_searchpage_results")
        if schema_tag and schema_tag.string:
            try:
                schema_items = json.loads(schema_tag.string).get("itemListElement", [])
            except Exception:
                schema_items = []

        for idx, item in enumerate(items[:12]):
            schema_item = schema_items[idx].get("item", {}) if idx < len(schema_items) else {}

            title_el = (
                item.select_one("a.cl-app-anchor span[data-testid='listing-title']")
                or item.select_one("a.result-title")
                or item.select_one(".title")
            )
            title = title_el.get_text(strip=True) if title_el else schema_item.get("name", "")

            link_el = item.select_one("a.cl-app-anchor") or item.select_one("a.result-title") or item.select_one("a[href]")
            link = link_el.get("href", "") if link_el else ""
            if link:
                link = urljoin(str(r.url), link)

            price_el = item.select_one("span.priceinfo") or item.select_one("span.result-price") or item.select_one(".price")
            price_text = price_el.get_text(strip=True) if price_el else ""
            schema_price = schema_item.get("offers", {}).get("price")
            price = extract_price(price_text) or extract_price(f"${schema_price}" if schema_price else "") or extract_price(title)

            img_el = item.select_one("img")
            image = img_el.get("src") or img_el.get("data-src") if img_el else None
            schema_images = schema_item.get("image") or []
            if isinstance(schema_images, str):
                schema_images = [schema_images]
            if (not image or "placeholder" in (image or "")) and schema_images:
                image = schema_images[0]
            if not image or "placeholder" in (image or ""):
                image = CATEGORY_IMAGES.get(detect_category(title), CATEGORY_IMAGES["other"])

            if not title or not link:
                continue
            if price and (price < 5 or price > 4000):
                continue

            cat_ = detect_category(title)
            cond = detect_condition(title)
            fault = detect_fault(title)
            address = schema_item.get("offers", {}).get("availableAtOrFrom", {}).get("address", {})
            city = address.get("addressLocality") or "Springfield"

            results.append({
                "id":          make_id("cl", link),
                "title":       title,
                "price":       price,
                "condition":   cond,
                "category":    cat_,
                "source":      "craigslist",
                "sourceLabel": "Craigslist",
                "sourceColor": "#c41230",
                "image":       image,
                "url":         link,
                "fault":       fault,
                "postedAgo":   "recently",
                "city":        f"{city}, MA",
                "hot":         bool(price and price < 250 and cond == "working"),
            })
    except Exception as e:
        log.warning("Craigslist '%s/%s' failed: %s", cat, query, e)
    return results

# ── API Endpoints ────────────────────────────────────────────────────────────
@app.get("/api/listings")
async def get_listings(
    response:  Response,
    q:         str = Query(default=""),
    category:  str = Query(default="all"),
    condition: str = Query(default="all"),
    source:    str = Query(default="all"),
):
    search_term = q.strip()
    cache_key = f"{search_term}|{category}|{condition}|{source}"
    now = time.time()

    async with _cache_lock:
        cached = _cache.get(cache_key)
        if cached and now - cached[0] < CACHE_TTL:
            response.headers["Cache-Control"] = f"public, max-age={CACHE_TTL}"
            response.headers["X-Cache"] = "HIT"
            return cached[1]

    async with httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT, connect=5.0)) as client:
        tasks = []

        # eBay RSS — استخدم بحث المستخدم عند توفره، وإلا استخدم البحث الافتراضي
        if source in ("all", "ebay"):
            ebay_queries = [(search_term, category)] if search_term else EBAY_QUERIES
            for query, _ in ebay_queries:
                tasks.append(fetch_ebay_rss(client, query))

        # Craigslist HTML — بحث حقيقي حسب كلمة المستخدم والتصنيف
        if source in ("all", "craigslist"):
            if search_term:
                cats = CRAIGSLIST_CATS_BY_CATEGORY.get(category, CRAIGSLIST_CATS_BY_CATEGORY["all"])
                for cat in cats:
                    tasks.append(fetch_craigslist_html(client, cat, search_term))
            else:
                searches = [
                    (cat, query) for cat, query in CRAIGSLIST_SEARCHES
                    if category == "all" or detect_category(query) == category or cat in CRAIGSLIST_CATS_BY_CATEGORY.get(category, [])
                ]
                for cat, query in searches:
                    tasks.append(fetch_craigslist_html(client, cat, query))

        results = await asyncio.gather(*tasks, return_exceptions=True)

    # دمج وإزالة التكرار
    seen = set()
    listings = []
    for batch in results:
        if isinstance(batch, Exception):
            continue
        for item in batch:
            key = item["id"]
            if key not in seen:
                seen.add(key)
                listings.append(item)

    # فلترة
    if search_term:
        ql = search_term.lower()
        listings = [l for l in listings if ql in (l["title"] or "").lower()]
    if category != "all":
        listings = [l for l in listings if l["category"] == category]
    if condition != "all":
        listings = [l for l in listings if l["condition"] == condition]

    # ترتيب: hot أولاً ثم السعر
    listings.sort(key=lambda x: (not x["hot"], x.get("price") or 9999))

    payload = {
        "total":      len(listings),
        "listings":   listings,
        "sources":    ["ebay", "craigslist"],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

    async with _cache_lock:
        _cache[cache_key] = (now, payload)
        if len(_cache) > 200:
            oldest = min(_cache, key=lambda k: _cache[k][0])
            _cache.pop(oldest, None)

    response.headers["Cache-Control"] = f"public, max-age={CACHE_TTL}"
    response.headers["X-Cache"] = "MISS"
    return payload


@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "MobeFace API running"}


@app.get("/")
async def root():
    return {"name": "MobeFace API", "docs": "/docs"}



