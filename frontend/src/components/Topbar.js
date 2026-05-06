import React from 'react';

/* Верхняя панель с заголовком страницы и кнопкой-бургером */
export default function Topbar({ title, onMenuClick }) {
  /* Форматирование текущей даты на русском языке */
  const now = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Кнопка-бургер для открытия боковой панели на мобильных устройствах */}
        <button className="hamburger" onClick={onMenuClick} aria-label="Открыть меню">
          <span />
          <span />
          <span />
        </button>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-right">
        {/* Дата скрывается на маленьких экранах через CSS-класс topbar-date */}
        <span style={{ fontSize: 13, color: 'var(--gray-400)' }} className="topbar-date">{now}</span>
      </div>
    </div>
  );
}
