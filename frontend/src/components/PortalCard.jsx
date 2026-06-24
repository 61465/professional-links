// بطاقة بحث للمنصات المحمية (Facebook Marketplace / OfferUp)
// تعرض وصف البحث فقط + رابط مباشر — لا صور وهمية، لا بيانات اختراعية

export default function PortalCard({ portal }) {
  const openPortal = () => {
    window.open(portal.url, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      id={`portal-${portal.id}`}
      className="portal-card"
      aria-label={`${portal.platform} — ${portal.description}`}
    >
      {/* Header المنصة */}
      <div className="portal-header" style={{ borderColor: portal.platformColor + "33" }}>
        <div className="portal-platform-badge" style={{ background: portal.platformColor + "18", color: portal.platformColor, border: `1px solid ${portal.platformColor}30` }}>
          <span>{portal.platformIcon}</span>
          <span>{portal.platform}</span>
        </div>
        <div className="portal-lock-tag">🔒 محمي</div>
      </div>

      {/* وصف البحث */}
      <div className="portal-body">
        <p className="portal-description">{portal.description}</p>
        <div className="portal-query">
          <span className="portal-query-label">🔍 بحث عن:</span>
          <code className="portal-query-text">{portal.query}</code>
        </div>
        {portal.note && (
          <div className="portal-note">
            ℹ️ {portal.note}
          </div>
        )}
      </div>

      {/* رابط مباشر */}
      <div className="portal-footer">
        <div className="portal-url-display">
          {portal.url.replace("https://", "").slice(0, 45)}…
        </div>
        <button
          id={`portal-open-${portal.id}`}
          className="btn btn-primary"
          onClick={openPortal}
          style={{ background: `linear-gradient(135deg, ${portal.platformColor}cc, ${portal.platformColor})` }}
        >
          فتح البحث ↗
        </button>
      </div>
    </article>
  );
}
