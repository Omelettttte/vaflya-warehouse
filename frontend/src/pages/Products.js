/* Страница списка товаров — просмотр, добавление, редактирование, удаление */
import React, { useEffect, useState, useCallback } from 'react';
import { get, post, put, del } from '../api';

const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'м', 'м²', 'м³', 'пач', 'рул', 'кор', 'пар'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'edit' — режим модального окна
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([get('/api/products'), get('/api/categories')]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(emptyForm());
    setError('');
    setEditing(null);
    setModal('edit');
  }

  function openEdit(p) {
    setForm({
      name: p.name,
      sku: p.sku || '',
      category_id: p.category_id || '',
      unit: p.unit || 'шт',
      description: p.description || '',
      min_stock: p.min_stock ?? 0,
    });
    setError('');
    setEditing(p);
    setModal('edit');
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Введите название'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await put(`/api/products/${editing.id}`, form);
      } else {
        await post('/api/products', form);
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить товар? Все связанные операции сохранятся.')) return;
    setDeleting(id);
    await del(`/api/products/${id}`);
    setDeleting(null);
    load();
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    const matchC = !catFilter || String(p.category_id) === catFilter;
    return matchQ && matchC;
  });

  return (
    <div>
      <div className="toolbar">
        <div className="search-bar">
          <SearchIcon />
          <input placeholder="Поиск по названию или артикулу..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>+ Добавить товар</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Список товаров</div>
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{filtered.length} позиций</span>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="empty"><div className="empty-title">Загрузка...</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Наименование</th>
                  <th>Артикул</th>
                  <th>Категория</th>
                  <th>Ед. изм.</th>
                  <th>Остаток</th>
                  <th>Мин. остаток</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>
                      {p.name}
                      {p.description && <div style={{ fontWeight: 400, fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>{p.description}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--gray-600)' }}>{p.sku || '—'}</td>
                    <td>{p.category_name ? <span className="badge badge-gray">{p.category_name}</span> : '—'}</td>
                    <td>{p.unit}</td>
                    <td>
                      <span className={p.quantity <= p.min_stock && p.min_stock > 0 ? 'tag-low' : ''}>
                        {p.quantity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>{p.min_stock}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" title="Редактировать" onClick={() => openEdit(p)}><EditIcon /></button>
                        <button className="btn-icon" title="Удалить" onClick={() => handleDelete(p.id)} disabled={deleting === p.id} style={{ color: 'var(--red)' }}><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Товары не найдены</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal === 'edit' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Редактировать товар' : 'Новый товар'}</div>
              <button className="btn-icon" onClick={() => setModal(null)}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Наименование *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Название товара" />
                </div>
                <div className="form-group">
                  <label className="form-label">Артикул (SKU)</label>
                  <input className="form-input" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Например: NB-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ед. измерения</label>
                  <select className="form-select" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <select className="form-select" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                    <option value="">Без категории</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Минимальный остаток</label>
                  <input className="form-input" type="number" min="0" value={form.min_stock} onChange={e => setForm({...form, min_stock: Number(e.target.value)})} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Описание</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Краткое описание товара..." />
                </div>
              </div>
              {error && <div className="error-msg">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function emptyForm() {
  return { name: '', sku: '', category_id: '', unit: 'шт', description: '', min_stock: 0 };
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
