/* Страница Categories — модуль интерфейса складской системы */
import React, { useEffect, useState, useCallback } from 'react';
import { get, post, del } from '../api';

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    get('/api/categories').then(d => { setCats(d); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!name.trim()) { setError('Введите название категории'); return; }
    setSaving(true);
    setError('');
    try {
      await post('/api/categories', { name: name.trim() });
      setName('');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, catName) {
    if (!window.confirm(`Удалить категорию "${catName}"? Товары в ней не удалятся.`)) return;
    setDeleting(id);
    await del(`/api/categories/${id}`);
    setDeleting(null);
    load();
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Добавить категорию</div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Название категории"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? '...' : 'Добавить'}
            </button>
          </div>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Категории товаров</div>
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{cats.length} шт.</span>
        </div>
        {loading ? (
          <div className="empty"><div className="empty-title">Загрузка...</div></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Название</th>
                <th>Дата добавления</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--gray-400)', width: 40 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: 'var(--gray-600)', fontSize: 12.5 }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td style={{ width: 48, textAlign: 'right' }}>
                    <button
                      className="btn-icon"
                      style={{ color: 'var(--red)' }}
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={deleting === c.id}
                      title="Удалить"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Категорий пока нет</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
    </svg>
  );
}
