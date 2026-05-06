import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Operations from './pages/Operations';
import Categories from './pages/Categories';

/* Словарь страниц: ключ → заголовок и компонент */
const PAGES = {
  dashboard:  { label: 'Главная',    component: Dashboard },
  products:   { label: 'Товары',     component: Products },
  stock:      { label: 'Остатки',    component: Stock },
  operations: { label: 'Операции',   component: Operations },
  categories: { label: 'Категории',  component: Categories },
};

/* Корневой компонент приложения */
export default function App() {
  /* Текущая активная страница */
  const [page, setPage] = useState('dashboard');
  /* Состояние открытия боковой панели (для мобильных устройств) */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Page = PAGES[page].component;

  /* Переключение страницы и закрытие боковой панели */
  function handleNav(key) {
    setPage(key);
    setSidebarOpen(false);
  }

  return (
    <div className="layout">
      {/* Боковая панель навигации */}
      <Sidebar
        current={page}
        onNav={handleNav}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Основное содержимое */}
      <div className="main">
        {/* Верхняя панель с заголовком */}
        <Topbar
          title={PAGES[page].label}
          onMenuClick={() => setSidebarOpen(o => !o)}
        />
        {/* Область отображения текущей страницы */}
        <div className="page">
          <Page onNav={handleNav} />
        </div>
      </div>
    </div>
  );
}
