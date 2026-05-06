/* Страница Operations — модуль интерфейса складской системы */
import React, { useEffect, useState, useCallback } from 'react';
import { get, post } from '../api';
import { OpTypeBadge } from './Dashboard';

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Operations() {
  const [ops, setOps] = useState([]);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 200 });
    if (typeFilter) params.append('type', typeFilter);
    if (productFilter) params.append('product_id', productFilter);
    get(`/api/operations?${params}`).then(d => {
      setOps(d.rows);
      setTotal(d.total);
      setLoading(false);
    });
  }, [typeFilter, productFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { get('/api/products').then(setProducts); }, []);

  function openModal(type = 'receipt') {
    setForm({ ...emptyForm(), type });
    setError('');
    setModal(true);
  }

  async function handleSave() {
    if (!form.product_id) { setError('Выберите товар'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Укажите количество больше нуля'); return; }
    setSaving(true);
    setError('');
    try {
      await post('/api/operations', { ...form, quantity: Number(form.quantity) });
      setModal(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedProduct = products.find(p => String(p.id) === String(form.product_id));

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Все типы</option>
            <option value="receipt">Поступления</option>
            <option value="writeoff">Списания</option>
            <option value="adjustment">Корректировки</option>
          </select>
          <select className="filter-select" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
            <option value="">Все товары</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => openModal('writeoff')}>— Списание</button>
          <button className="btn btn-primary" onClick={() => openModal('receipt')}>+ Поступление</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Журнал операций</div>
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            {ops.length} из {total} записей
          </span>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="empty"><div className="empty-title">Загрузка...</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Дата и время</th>
                  <th>Тип</th>
                  <th>Товар</th>
                  <th>Количество</th>
                  <th>Ответственный</th>
                  <th>Примечание</th>
                </tr>
              </thead>
              <tbody>
                {ops.map(op => (
                  <tr key={op.id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{op.id}</td>
                    <td style={{ color: 'var(--gray-600)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{fmtDate(op.created_at)}</td>
                    <td><OpTypeBadge type={op.type} /></td>
                    <td style={{ fontWeight: 600 }}>{op.product_name}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: op.type === 'receipt' ? 'var(--green)' : op.type === 'writeoff' ? 'var(--red)' : '#7c3aed' }}>
                        {op.type === 'receipt' ? '+' : op.type === 'writeoff' ? '−' : '±'}{op.quantity}
                      </span>
                      {' '}<span style={{ color: 'var(--gray-400)', fontSize: 12 }}>{op.unit}</span>
                    </td>
                    <td>{op.responsible || '—'}</td>
                    <td style={{ color: 'var(--gray-600)', maxWidth: 240 }}>{op.note || '—'}</td>
                  </tr>
                ))}
                {ops.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Операций нет</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                {form.type === 'receipt' ? 'Поступление товара' : form.type === 'writeoff' ? 'Списание товара' : 'Корректировка'}
              </div>
              <button className="btn-icon" onClick={() => setModal(false)}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Тип операции</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="receipt">Поступление</option>
                    <option value="writeoff">Списание</option>
                    <option value="adjustment">Корректировка</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Товар *</label>
                  <select className="form-select" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                    <option value="">Выберите товар...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.sku ? ` (${p.sku})` : ''} — остаток: {p.quantity} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Количество *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.quantity}
                    onChange={e => setForm({...form, quantity: e.target.value})}
                    placeholder="0"
                  />
                  {selectedProduct && (
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>
                      Текущий остаток: {selectedProduct.quantity} {selectedProduct.unit}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Ответственный</label>
                  <input className="form-input" value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} placeholder="ФИО" />
                </div>
                <div className="form-group full">
                  <label className="form-label">Примечание</label>
                  <textarea className="form-textarea" value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Комментарий к операции..." />
                </div>
              </div>
              {error && <div className="error-msg">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Провести операцию'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function emptyForm() {
  return { type: 'receipt', product_id: '', quantity: '', responsible: '', note: '' };
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
