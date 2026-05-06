/* Страница Stock — модуль интерфейса складской системы */
import React, { useEffect, useState, useCallback } from 'react';
import { get, put } from '../api';

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [editLoc, setEditLoc] = useState(null); // { id, location }

  const load = useCallback(() => {
    setLoading(true);
    get('/api/stock').then(d => { setStock(d); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = [...new Set(stock.map(s => s.category_name).filter(Boolean))].sort();

  const filtered = stock.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.product_name.toLowerCase().includes(q) || (s.sku || '').toLowerCase().includes(q);
    const matchC = !catFilter || s.category_name === catFilter;
    const matchL = !lowOnly || s.quantity <= s.min_stock;
    return matchQ && matchC && matchL;
  });

  const totalItems = stock.length;
  const lowItems = stock.filter(s => s.quantity <= s.min_stock && s.min_stock > 0).length;
  const totalQty = stock.reduce((a, s) => a + s.quantity, 0);

  async function saveLocation() {
    await put(`/api/stock/${editLoc.id}`, { location: editLoc.location });
    setEditLoc(null);
    load();
  }

  function getStatus(s) {
    if (s.quantity === 0) return { label: 'Нет в наличии', cls: 'badge-red' };
    if (s.min_stock > 0 && s.quantity <= s.min_stock) return { label: 'Мало', cls: 'badge-yellow' };
    return { label: 'В наличии', cls: 'badge-green' };
  }

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Позиций</div>
          <div className="stat-value">{totalItems}</div>
          <div className="stat-sub">товаров на складе</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Всего единиц</div>
          <div className="stat-value">{totalQty.toFixed(0)}</div>
          <div className="stat-sub">суммарный остаток</div>
        </div>
        <div className="stat-card" style={lowItems > 0 ? { borderColor: '#fca5a5' } : {}}>
          <div className="stat-label">Нужно пополнить</div>
          <div className="stat-value" style={{ color: lowItems > 0 ? 'var(--red)' : 'inherit' }}>{lowItems}</div>
          <div className="stat-sub">ниже минимума</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <SearchIcon />
          <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} />
          Только низкий остаток
        </label>
        <div className="toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{filtered.length} из {totalItems}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Текущие остатки</div>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="empty"><div className="empty-title">Загрузка...</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Артикул</th>
                  <th>Категория</th>
                  <th>Количество</th>
                  <th>Ед. изм.</th>
                  <th>Мин. остаток</th>
                  <th>Статус</th>
                  <th>Местоположение</th>
                  <th>Обновлено</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const status = getStatus(s);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.product_name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--gray-600)' }}>{s.sku || '—'}</td>
                      <td>{s.category_name ? <span className="badge badge-gray">{s.category_name}</span> : '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 15, color: s.quantity === 0 ? 'var(--red)' : s.quantity <= s.min_stock && s.min_stock > 0 ? '#b45309' : 'var(--green)' }}>
                          {s.quantity}
                        </span>
                      </td>
                      <td>{s.unit}</td>
                      <td style={{ color: 'var(--gray-600)' }}>{s.min_stock}</td>
                      <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                      <td>
                        {editLoc && editLoc.id === s.id ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <input
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: 13 }}
                              value={editLoc.location}
                              onChange={e => setEditLoc({ ...editLoc, location: e.target.value })}
                              autoFocus
                            />
                            <button className="btn btn-primary btn-sm" onClick={saveLocation}>OK</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setEditLoc(null)}>X</button>
                          </div>
                        ) : (
                          <span
                            onClick={() => setEditLoc({ id: s.id, location: s.location || '' })}
                            style={{ cursor: 'pointer', color: s.location ? 'var(--black)' : 'var(--gray-400)', textDecoration: 'underline dotted' }}
                            title="Нажмите для изменения"
                          >
                            {s.location || 'Не указано'}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {s.updated_at ? new Date(s.updated_at).toLocaleDateString('ru-RU') : '—'}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Ничего не найдено</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
