// ─────────────────────────────────────────────────────────────────────────────
//  MobeFace — AI Deal Analyzer (محرك تحليل الصفقات الذكي)
//  يعمل بالكامل في المتصفح — لا يحتاج API Key أو اتصال خارجي
// ─────────────────────────────────────────────────────────────────────────────

// ── قاعدة بيانات أسعار السوق (يونيو 2025) ──────────────────────────────────
const MARKET_PRICES = {
  // iPhones
  "iphone 15 pro max": { working: 950, parts: 350, repairCost: 250 },
  "iphone 15 pro":     { working: 850, parts: 300, repairCost: 230 },
  "iphone 15":         { working: 720, parts: 250, repairCost: 200 },
  "iphone 15 plus":    { working: 750, parts: 260, repairCost: 200 },
  "iphone 14 pro max": { working: 780, parts: 280, repairCost: 220 },
  "iphone 14 pro":     { working: 680, parts: 240, repairCost: 200 },
  "iphone 14 plus":    { working: 620, parts: 200, repairCost: 180 },
  "iphone 14":         { working: 600, parts: 190, repairCost: 170 },
  "iphone 13 pro max": { working: 650, parts: 220, repairCost: 200 },
  "iphone 13 pro":     { working: 560, parts: 190, repairCost: 180 },
  "iphone 13":         { working: 420, parts: 140, repairCost: 160 },
  "iphone 12 pro max": { working: 420, parts: 140, repairCost: 170 },
  "iphone 12 pro":     { working: 360, parts: 120, repairCost: 160 },
  "iphone 12":         { working: 300, parts: 100, repairCost: 150 },
  "iphone 11 pro max": { working: 300, parts: 100, repairCost: 160 },
  "iphone 11":         { working: 240, parts: 80,  repairCost: 140 },
  "iphone xs max":     { working: 200, parts: 65,  repairCost: 130 },
  "iphone xs":         { working: 170, parts: 55,  repairCost: 120 },
  "iphone xr":         { working: 180, parts: 60,  repairCost: 120 },
  "iphone x":          { working: 150, parts: 50,  repairCost: 120 },
  // Samsung
  "galaxy s24 ultra":  { working: 950, parts: 350, repairCost: 280 },
  "galaxy s24+":       { working: 780, parts: 280, repairCost: 240 },
  "galaxy s24":        { working: 680, parts: 240, repairCost: 220 },
  "galaxy s23 ultra":  { working: 720, parts: 260, repairCost: 250 },
  "galaxy s23+":       { working: 580, parts: 200, repairCost: 220 },
  "galaxy s23 fe":     { working: 380, parts: 130, repairCost: 180 },
  "galaxy s23":        { working: 480, parts: 160, repairCost: 200 },
  "galaxy s22 ultra":  { working: 550, parts: 190, repairCost: 230 },
  "galaxy s22":        { working: 380, parts: 130, repairCost: 190 },
  // Google
  "pixel 8 pro":       { working: 650, parts: 220, repairCost: 200 },
  "pixel 8":           { working: 500, parts: 170, repairCost: 180 },
  "pixel 7 pro":       { working: 450, parts: 150, repairCost: 180 },
  "pixel 7":           { working: 350, parts: 115, repairCost: 160 },
  // OnePlus
  "oneplus 12":        { working: 550, parts: 190, repairCost: 200 },
  "oneplus 11":        { working: 420, parts: 140, repairCost: 180 },
  // Motorola
  "motorola edge 2023":{ working: 280, parts: 95,  repairCost: 140 },
  // Gaming
  "ps5":               { working: 380, parts: 130, repairCost: 120 },
  "ps4 pro":           { working: 200, parts: 70,  repairCost: 80  },
  "ps4":               { working: 160, parts: 55,  repairCost: 70  },
  "xbox series x":     { working: 380, parts: 130, repairCost: 110 },
  "xbox series s":     { working: 240, parts: 80,  repairCost: 90  },
  "nintendo switch oled":{ working: 280, parts: 100, repairCost: 90},
  "nintendo switch":   { working: 220, parts: 75,  repairCost: 80  },
  "switch lite":       { working: 160, parts: 55,  repairCost: 70  },
  "meta quest 3":      { working: 450, parts: 150, repairCost: 130 },
  "quest 2":           { working: 200, parts: 65,  repairCost: 90  },
  "oculus quest 2":    { working: 200, parts: 65,  repairCost: 90  },
  // Tablets
  "ipad pro 12.9":     { working: 750, parts: 260, repairCost: 250 },
  "ipad pro":          { working: 600, parts: 200, repairCost: 220 },
  "ipad air 5":        { working: 380, parts: 130, repairCost: 180 },
  "ipad air":          { working: 320, parts: 110, repairCost: 160 },
  "ipad mini 6":       { working: 380, parts: 130, repairCost: 160 },
  "ipad mini":         { working: 280, parts: 95,  repairCost: 140 },
  "ipad":              { working: 250, parts: 85,  repairCost: 130 },
  "galaxy tab s8":     { working: 380, parts: 130, repairCost: 170 },
  "galaxy tab a8":     { working: 160, parts: 55,  repairCost: 100 },
  // Laptops
  "macbook air m1":    { working: 750, parts: 260, repairCost: 200 },
  "macbook air m2":    { working: 900, parts: 320, repairCost: 220 },
  "macbook pro 2020":  { working: 700, parts: 240, repairCost: 220 },
  "macbook pro":       { working: 850, parts: 300, repairCost: 250 },
  "dell xps 15":       { working: 900, parts: 320, repairCost: 220 },
  // Accessories
  "airpods pro 2":     { working: 200, parts: 70,  repairCost: 60  },
  "airpods pro":       { working: 160, parts: 55,  repairCost: 50  },
  "airpods":           { working: 100, parts: 35,  repairCost: 40  },
  "apple watch series 8": { working: 280, parts: 95, repairCost: 120 },
  "apple watch series 7": { working: 230, parts: 78, repairCost: 110 },
};

// ── مصفوفة الأعطال وتكاليف الإصلاح ─────────────────────────────────────────
const FAULT_COSTS = {
  "cracked screen":     { cost: 120, severity: "medium", arabic: "شاشة مكسورة" },
  "cracked back glass": { cost: 40,  severity: "low",    arabic: "ظهر مكسور" },
  "face id":            { cost: 200, severity: "high",   arabic: "Face ID معطل" },
  "icloud locked":      { cost: 0,   severity: "critical", arabic: "مقفل iCloud (خطر عالٍ)" },
  "carrier locked":     { cost: 30,  severity: "low",    arabic: "مقفل الشبكة" },
  "won't turn on":      { cost: 150, severity: "high",   arabic: "لا يعمل" },
  "water damage":       { cost: 200, severity: "critical", arabic: "تلف مائي" },
  "bent frame":         { cost: 80,  severity: "medium", arabic: "هيكل معوج" },
  "battery":            { cost: 60,  severity: "low",    arabic: "بطارية" },
  "overheating":        { cost: 100, severity: "medium", arabic: "ارتفاع حرارة" },
};

// ── دالة البحث الذكي في قاعدة البيانات ──────────────────────────────────────
function findMarketPrice(title) {
  const lower = title.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, value] of Object.entries(MARKET_PRICES)) {
    const keyWords = key.split(" ");
    const matches = keyWords.filter(w => lower.includes(w)).length;
    const score = matches / keyWords.length;
    if (score > bestScore && matches >= Math.max(1, keyWords.length - 1)) {
      bestScore = score;
      bestMatch = { key, ...value };
    }
  }
  return bestMatch;
}

// ── دالة حساب درجة الصفقة (0–100) ──────────────────────────────────────────
function calcDealScore(listing, market) {
  if (!market) return 50; // لا توجد بيانات كافية

  const marketPrice = listing.condition === "working" ? market.working : market.parts;
  const ratio = listing.price / marketPrice;

  // كلما كان السعر أقل من السوق كانت الصفقة أفضل
  let score;
  if (ratio <= 0.60)      score = 95;
  else if (ratio <= 0.70) score = 85;
  else if (ratio <= 0.80) score = 75;
  else if (ratio <= 0.90) score = 65;
  else if (ratio <= 1.00) score = 55;
  else if (ratio <= 1.10) score = 42;
  else if (ratio <= 1.25) score = 30;
  else                    score = 15;

  // خصم إضافي لحالات الخطر
  if (listing.fault?.toLowerCase().includes("icloud"))   score -= 30;
  if (listing.fault?.toLowerCase().includes("water"))    score -= 20;
  if (listing.fault?.toLowerCase().includes("won't"))    score -= 15;

  return Math.max(5, Math.min(99, score));
}

// ── دالة توليد الحكم النهائي ─────────────────────────────────────────────────
function getVerdict(score, condition, fault) {
  if (fault?.toLowerCase().includes("icloud")) {
    return {
      verdict: "تجنب",
      emoji: "🚫",
      color: "#ef4444",
      reason: "الأجهزة المقفلة بـ iCloud شبه عديمة الفائدة إلا للمتخصصين"
    };
  }
  if (score >= 80) return {
    verdict: "صفقة ممتازة",
    emoji: "🔥",
    color: "#22c55e",
    reason: "السعر أقل بكثير من متوسط السوق — اشتري الآن"
  };
  if (score >= 65) return {
    verdict: "صفقة جيدة",
    emoji: "✅",
    color: "#86efac",
    reason: "السعر منخفض عن السوق بشكل ملحوظ"
  };
  if (score >= 50) return {
    verdict: "سعر مناسب",
    emoji: "👍",
    color: "#facc15",
    reason: "السعر ضمن نطاق السوق المعتاد"
  };
  if (score >= 35) return {
    verdict: "قابل للتفاوض",
    emoji: "🤝",
    color: "#fb923c",
    reason: "حاول التفاوض على تخفيض"
  };
  return {
    verdict: "سعر مرتفع",
    emoji: "⚠️",
    color: "#ef4444",
    reason: "السعر أعلى من السوق، ابحث عن بدائل"
  };
}

// ── محرك الإعادة البيع (Flip Analysis) ─────────────────────────────────────
function getFlipAnalysis(listing, market) {
  if (!market || listing.condition !== "parts") return null;

  const buyPrice   = listing.price;
  const repairCost = market.repairCost || 150;
  const sellPrice  = market.working * 0.85; // هامش أمان 15%
  const profit     = sellPrice - buyPrice - repairCost;
  const roi        = ((profit / (buyPrice + repairCost)) * 100).toFixed(0);

  return { buyPrice, repairCost, sellPrice: Math.round(sellPrice), profit: Math.round(profit), roi };
}

// ── الدالة الرئيسية: تحليل الصفقة كاملاً ───────────────────────────────────
export function analyzeDeal(listing) {
  const market   = findMarketPrice(listing.title);
  const score    = calcDealScore(listing, market);
  const verdict  = getVerdict(score, listing.condition, listing.fault);
  const flip     = getFlipAnalysis(listing, market);
  const faultInfo = listing.fault
    ? Object.entries(FAULT_COSTS).find(([k]) => listing.fault.toLowerCase().includes(k))?.[1]
    : null;

  const marketPrice = market
    ? (listing.condition === "working" ? market.working : market.parts)
    : null;

  const savings = marketPrice ? marketPrice - listing.price : null;

  // توليد نصائح ذكية
  const tips = [];
  if (savings && savings > 50)   tips.push(`💰 توفير ${savings}$ مقارنةً بالسوق`);
  if (flip && flip.profit > 80)  tips.push(`🔄 ربح متوقع عند الإعادة: ~$${flip.profit} (ROI ${flip.roi}%)`);
  if (listing.source === "craigslist") tips.push("🤝 يمكن التفاوض الشخصي — قل السعر 10–15%");
  if (listing.source === "ebay")       tips.push("📦 تحقق من سياسة الإرجاع قبل الشراء");
  if (listing.hot) tips.push("⚡ إعلان رائج — قد يُباع سريعاً");
  if (faultInfo?.severity === "critical") tips.push("⚠️ عطل خطير — الشراء للمتخصصين فقط");

  return {
    score,
    verdict,
    marketPrice,
    savings,
    flip,
    faultInfo,
    tips,
    priceAnalysis: marketPrice
      ? `سعر السوق: $${marketPrice} — السعر المطلوب: $${listing.price}`
      : "لا توجد بيانات سعرية كافية لهذا الجهاز",
  };
}
