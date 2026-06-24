export default function Header({ search, onSearch, hotCount, partsCount, avgPrice, totalCount }) {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <a href="/" className="logo">
          <div className="logo-icon">📱</div>
          <div>
            <div className="logo-text">MobeFace</div>
            <div className="logo-sub">Tech Deals · 01119</div>
          </div>
        </a>

        {/* Stats */}
        <div className="header-stats">
          <div className="stat-pill">
            📦 <span>{totalCount}</span> إعلان
          </div>
          <div className="stat-pill">
            🔥 <span>{hotCount}</span> صفقات رائجة
          </div>
          <div className="stat-pill">
            🔧 <span>{partsCount}</span> للقطع
          </div>
          <div className="stat-pill">
            متوسط <span>${avgPrice}</span>
          </div>
        </div>

        {/* Search */}
        <div className="header-search">
          <span className="search-icon">🔍</span>
          <input
            id="search-input"
            type="text"
            placeholder="ابحث عن جهاز أو موقع..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
