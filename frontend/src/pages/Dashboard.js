/* Страница Dashboard — модуль интерфейса складской системы */
import React, { useEffect, useState } from 'react';
import { get } from '../api';

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Dashboard({ onNav }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/stats').then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty"><div className="empty-title">Загрузка...</div></div>;
  if (!stats) return <div className="empty"><div className="empty-title">Не удалось загрузить данные</div></div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Товаров</div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-sub">позиций в базе</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Единиц на складе</div>
          <div className="stat-value">{Number(stats.totalStock).toFixed(0)}</div>
          <div className="stat-sub">суммарно по всем товарам</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Операций</div>
          <div className="stat-value">{stats.totalOps}</div>
          <div className="stat-sub">всего в журнале</div>
        </div>
        <div className="stat-card" style={stats.lowStock > 0 ? { borderColor: '#fca5a5' } : {}}>
          <div className="stat-label">Низкий остаток</div>
          <div className="stat-value" style={{ color: stats.lowStock > 0 ? 'var(--red)' : 'var(--black)' }}>
            {stats.lowStock}
          </div>
          <div className="stat-sub">
            {stats.lowStock > 0 ? 'требуют пополнения' : 'всё в порядке'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Последние операции</div>
          <button className="btn btn-outline btn-sm" onClick={() => onNav('operations')}>
            Все операции
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Товар</th>
                <th>Кол-во</th>
                <th>Ответственный</th>
                <th>Примечание</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOps.map(op => (
                <tr key={op.id}>
                  <td style={{ color: 'var(--gray-600)', fontSize: 12.5 }}>{fmtDate(op.created_at)}</td>
                  <td><OpTypeBadge type={op.type} /></td>
                  <td style={{ fontWeight: 600 }}>{op.product_name}</td>
                  <td>{op.quantity} {op.unit}</td>
                  <td>{op.responsible || '—'}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{op.note || '—'}</td>
                </tr>
              ))}
              {stats.recentOps.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>Нет операций</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function OpTypeBadge({ type }) {
  if (type === 'receipt')    return <span className="badge badge-green">Поступление</span>;
  if (type === 'writeoff')   return <span className="badge badge-red">Списание</span>;
  if (type === 'adjustment') return <span className="badge badge-blue">Корректировка</span>;
  return <span className="badge badge-gray">{type}</span>;
}
