import React from 'react';

/* Список пунктов навигации */
const NAV = [
  { key: 'dashboard',  label: 'Главная',    icon: GridIcon },
  { key: 'products',   label: 'Товары',     icon: BoxIcon },
  { key: 'stock',      label: 'Остатки',    icon: WarehouseIcon },
  { key: 'operations', label: 'Операции',   icon: ArrowsIcon },
  { key: 'categories', label: 'Категории',  icon: TagIcon },
];

/* Боковая панель навигации */
export default function Sidebar({ current, onNav, isOpen, onClose }) {
  return (
    <>
      {/* Затемняющий оверлей — показывается только при открытой боковой панели на мобильных */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <div className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        {/* Логотип и название системы */}
        <div className="sidebar-logo">
          <div className="logo-text">VAFLYA</div>
          <div className="logo-sub">Складской учёт</div>
        </div>

        {/* Пункты меню навигации */}
        <nav className="sidebar-nav">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`nav-item${current === key ? ' active' : ''}`}
              onClick={() => onNav(key)}
            >
              <Icon className="nav-icon" />
              {label}
            </button>
          ))}
        </nav>

        {/* Версия приложения */}
        <div className="sidebar-footer">v1.0.0</div>
      </div>
    </>
  );
}

/* Иконка сетки (Главная) */
function GridIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}

/* Иконка коробки (Товары) */
function BoxIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

/* Иконка склада (Остатки) */
function WarehouseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}

/* Иконка стрелок (Операции) */
function ArrowsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

/* Иконка тега (Категории) */
function TagIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}
