// AI Analysis Modal — يعرض نتائج محرك الذكاء المحلي بشكل احترافي

const CIRCUMFERENCE = 2 * Math.PI * 34; // r=34

function ScoreRing({ score, color }) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  return (
    <div className="score-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle className="score-ring-bg" cx="40" cy="40" r="34" />
        <circle
          className="score-ring-fill"
          cx="40" cy="40" r="34"
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-text" style={{ color }}>
        {score}
        <small>/ 100</small>
      </div>
    </div>
  );
}

export default function AIModal({ listing, analysis, onClose, onOpenUrl }) {
  const { score, verdict, marketPrice, savings, flip, tips, faultInfo } = analysis;
  const scoreClr = verdict.color;

  // Close on backdrop click
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="modal-overlay" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label="تحليل الصفقة">

      <div className="modal-sheet">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            🤖 <span>تحليل الصفقة بالذكاء</span>
          </div>
          <button id="ai-modal-close" className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <div className="modal-body">

          {/* ── Hero: Score + Verdict ── */}
          <div className="ai-result-hero">
            <ScoreRing score={score} color={scoreClr} />
            <div className="ai-verdict-info">
              <div className="verdict-badge" style={{ background: `${scoreClr}20`, color: scoreClr, border: `1px solid ${scoreClr}40` }}>
                {verdict.emoji} {verdict.verdict}
              </div>
              <p className="verdict-reason">{verdict.reason}</p>
              <p style={{ fontSize: 11, color: '#5a5a5a', marginTop: 4 }}>{listing.title}</p>
            </div>
          </div>

          {/* ── Price Analysis ── */}
          {marketPrice && (
            <div className="ai-section">
              <div className="ai-section-title">📊 تحليل السعر</div>
              <div className="price-comparison">
                <div className="price-box">
                  <div className="label">السعر المطلوب</div>
                  <div className="value gold">${listing.price}</div>
                </div>
                <div className="price-box">
                  <div className="label">متوسط السوق</div>
                  <div className="value gray">${marketPrice}</div>
                </div>
              </div>
              {savings > 0 && (
                <div className="savings-row">
                  💰 توفير {savings}$ عن السوق ({Math.round((savings/marketPrice)*100)}% أقل)
                </div>
              )}
              {savings <= 0 && savings !== null && (
                <div className="savings-row" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                  ⬆️ السعر أعلى من السوق بـ ${Math.abs(savings)}
                </div>
              )}
            </div>
          )}

          {/* ── Fault Analysis ── */}
          {faultInfo && (
            <div className="ai-section">
              <div className="ai-section-title">🔧 تحليل العطل</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: faultInfo.severity === 'critical' ? '#ef4444' : faultInfo.severity === 'high' ? '#fb923c' : faultInfo.severity === 'medium' ? '#facc15' : '#22c55e'
                }} />
                <span style={{ fontSize: 13 }}>{faultInfo.arabic}</span>
                <span style={{ marginRight: 'auto', fontSize: 12, color: '#a0a0a0' }}>
                  تكلفة الإصلاح: ~${faultInfo.cost}
                </span>
              </div>
            </div>
          )}

          {/* ── Flip Analysis (for parts only) ── */}
          {flip && (
            <div className="ai-section">
              <div className="ai-section-title">🔄 تحليل الإعادة (Flip)</div>
              <div className="flip-grid">
                <div className="flip-box">
                  <div className="label">الشراء</div>
                  <div className="value">${flip.buyPrice}</div>
                </div>
                <div className="flip-box">
                  <div className="label">الإصلاح</div>
                  <div className="value">~${flip.repairCost}</div>
                </div>
                <div className="flip-box">
                  <div className="label">البيع</div>
                  <div className="value">${flip.sellPrice}</div>
                </div>
              </div>
              <div className="flip-box profit" style={{ marginTop: 8, background: 'rgba(34,197,94,0.08)', borderRadius: 8, padding: 10, textAlign: 'center', border: '1px solid rgba(34,197,94,0.15)' }}>
                <div style={{ fontSize: 11, color: '#a0a0a0', marginBottom: 3 }}>الربح المتوقع</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: flip.profit > 0 ? '#22c55e' : '#ef4444' }}>
                  {flip.profit > 0 ? '+' : ''}{flip.profit}$ <span style={{ fontSize: 12, opacity: 0.7 }}>({flip.roi}% ROI)</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Smart Tips ── */}
          {tips.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">💡 نصائح ذكية</div>
              <div className="tips-list">
                {tips.map((tip, i) => (
                  <div key={i} className="tip-item">{tip}</div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── CTA Buttons ── */}
        <div className="modal-cta">
          <button id="ai-modal-cancel" className="btn btn-ghost" onClick={onClose}>إغلاق</button>
          <button id="ai-modal-open" className="btn btn-primary" onClick={() => { onClose(); onOpenUrl(); }}>
            🔗 فتح الإعلان
          </button>
        </div>
      </div>

    </div>
  );
}

