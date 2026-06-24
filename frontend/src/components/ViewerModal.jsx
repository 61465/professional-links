import { useState } from 'react';

// المنصات التي ترفض iframe — نفتحها في تاب جديد مباشرة
const BLOCKED_DOMAINS = ['facebook.com', 'offerup.com', 'ebay.com'];

function isDomainBlocked(url) {
  return BLOCKED_DOMAINS.some(d => url.includes(d));
}

export default function ViewerModal({ url, label, onClose }) {
  const [iframeError, setIframeError] = useState(false);
  const blocked = isDomainBlocked(url);

  const openExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Close on backdrop
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="viewer-modal" onClick={handleBackdrop} role="dialog" aria-modal="true">

      {/* Toolbar */}
      <div className="viewer-toolbar">
        <button
          id="viewer-close"
          className="btn btn-ghost btn-icon"
          onClick={onClose}
          aria-label="إغلاق"
          style={{ fontSize: 16 }}
        >
          ✕
        </button>

        <div className="viewer-title">
          📋 {label}
        </div>

        <div className="viewer-url">{url}</div>

        <button
          id="viewer-external"
          className="btn btn-primary"
          onClick={openExternal}
          title="فتح في متصفح جديد"
        >
          ↗ فتح
        </button>
      </div>

      {/* Content */}
      {blocked || iframeError ? (
        // Blocked — show friendly message with direct open button
        <div className="viewer-blocked">
          <div className="icon">🔐</div>
          <h3>
            {blocked ? 'هذا الموقع يمنع العرض المدمج' : 'تعذّر تحميل الصفحة'}
          </h3>
          <p>
            {blocked
              ? `${label.split(' ').slice(0,3).join(' ')} — يجب فتحه في المتصفح مباشرةً للحماية من التعقب. اضغط الزر أدناه للانتقال.`
              : 'حدث خطأ في التحميل. افتح الرابط مباشرة في المتصفح.'}
          </p>
          <button
            id="viewer-blocked-open"
            className="btn btn-primary"
            onClick={openExternal}
            style={{ padding: '12px 28px', fontSize: 15, marginTop: 8 }}
          >
            🚀 فتح الإعلان الآن
          </button>
          <button
            id="viewer-blocked-close"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ marginTop: 4, padding: '10px 24px' }}
          >
            العودة
          </button>
        </div>
      ) : (
        // Try iframe — works for Craigslist
        <iframe
          id="viewer-iframe"
          className="viewer-iframe"
          src={url}
          title={label}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onError={() => setIframeError(true)}
        />
      )}
    </div>
  );
}
