const express = require('express');
const cors = require('cors');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

/* Разрешаем CORS для фронтенда и обработку JSON в теле запросов */
app.use(cors());
app.use(express.json());

/* Инициализация базы данных при старте сервера */
const db = initDB();

// ─── СТАТИСТИКА ──────────────────────────────────────────────────────────────
/* Главные показатели для дашборда */
app.get('/api/stats', (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const totalStock = db.prepare('SELECT COALESCE(SUM(quantity), 0) as s FROM stock').get().s;
  const totalOps = db.prepare('SELECT COUNT(*) as c FROM operations').get().c;

  /* Товары с остатком ниже минимального порога */
  const lowStock = db.prepare(`
    SELECT COUNT(*) as c FROM stock s
    JOIN products p ON p.id = s.product_id
    WHERE s.quantity <= p.min_stock
  `).get().c;

  /* Последние 8 операций для виджета на главной */
  const recentOps = db.prepare(`
    SELECT o.*, p.name as product_name, p.unit
    FROM operations o
    JOIN products p ON p.id = o.product_id
    ORDER BY o.created_at DESC
    LIMIT 8
  `).all();

  res.json({ totalProducts, totalStock, totalOps, lowStock, recentOps });
});

// ─── КАТЕГОРИИ ───────────────────────────────────────────────────────────────
/* Получить список всех категорий */
app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(rows);
});

/* Создать новую категорию */
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
    res.json({ id: result.lastInsertRowid, name: name.trim() });
  } catch (e) {
    res.status(400).json({ error: 'Категория с таким именем уже существует' });
  }
});

/* Переименовать категорию */
app.put('/api/categories/:id', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
  try {
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Категория с таким именем уже существует' });
  }
});

/* Удалить категорию */
app.delete('/api/categories/:id', (req, res) => {
  db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── ТОВАРЫ ──────────────────────────────────────────────────────────────────
/* Получить список товаров с информацией о категории и текущем остатке */
app.get('/api/products', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name,
           COALESCE(s.quantity, 0) as current_stock,
           s.location
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN stock s ON s.product_id = p.id
    ORDER BY p.name
  `).all();
  res.json(rows);
});

/* Создать новый товар и записать начальный нулевой остаток */
app.post('/api/products', (req, res) => {
  const { name, sku, category_id, unit, description, min_stock } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
  try {
    const result = db.prepare(`
      INSERT INTO products (name, sku, category_id, unit, description, min_stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), sku || null, category_id || null, unit || 'шт', description || null, min_stock || 0);
    /* Создаём запись остатка для нового товара */
    db.prepare('INSERT INTO stock (product_id, quantity) VALUES (?, 0)').run(result.lastInsertRowid);
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Артикул уже используется' });
  }
});

/* Обновить данные товара */
app.put('/api/products/:id', (req, res) => {
  const { name, sku, category_id, unit, description, min_stock } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });
  try {
    db.prepare(`
      UPDATE products SET name=?, sku=?, category_id=?, unit=?, description=?, min_stock=?
      WHERE id=?
    `).run(name.trim(), sku || null, category_id || null, unit || 'шт', description || null, min_stock || 0, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Артикул уже используется' });
  }
});

/* Удалить товар (каскадно удаляются записи остатка) */
app.delete('/api/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── ОСТАТКИ ─────────────────────────────────────────────────────────────────
/* Получить остатки с указанием статуса (норма / низкий) */
app.get('/api/stock', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, p.name as product_name, p.unit, p.min_stock, p.sku,
           c.name as category_name
    FROM stock s
    JOIN products p ON p.id = s.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.name
  `).all();
  res.json(rows);
});

/* Скорректировать остаток вручную */
app.put('/api/stock/:productId', (req, res) => {
  const { quantity, location } = req.body;
  db.prepare(`
    UPDATE stock SET quantity=?, location=?, updated_at=datetime('now')
    WHERE product_id=?
  `).run(quantity, location || null, req.params.productId);
  res.json({ ok: true });
});

// ─── ОПЕРАЦИИ ────────────────────────────────────────────────────────────────
/* Получить журнал складских операций */
app.get('/api/operations', (req, res) => {
  const { type, product_id, limit = 50 } = req.query;
  let sql = `
    SELECT o.*, p.name as product_name, p.unit
    FROM operations o
    JOIN products p ON p.id = o.product_id
  `;
  const conditions = [];
  const params = [];

  if (type) {
    conditions.push('o.type = ?');
    params.push(type);
  }
  if (product_id) {
    conditions.push('o.product_id = ?');
    params.push(product_id);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');

  const countSql = sql.replace('SELECT o.*, p.name as product_name, p.unit', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params);

  sql += ' ORDER BY o.created_at DESC LIMIT ?';
  params.push(Number(limit));

  const rows = db.prepare(sql).all(...params);

  res.json({ rows, total });
});

/* Зарегистрировать новую складскую операцию и обновить остаток */
app.post('/api/operations', (req, res) => {
  const { type, product_id, quantity, note, responsible } = req.body;
  if (!type || !product_id || !quantity) return res.status(400).json({ error: 'Заполните обязательные поля' });

  /* Записываем операцию в журнал */
  const result = db.prepare(`
    INSERT INTO operations (type, product_id, quantity, note, responsible)
    VALUES (?, ?, ?, ?, ?)
  `).run(type, product_id, Math.abs(quantity), note || null, responsible || null);

  /* Пересчитываем остаток в зависимости от типа операции */
  let delta = 0;
  if (type === 'receipt')    delta = +Math.abs(quantity);   
  if (type === 'writeoff')   delta = -Math.abs(quantity);   
  if (type === 'adjustment') delta = quantity;               

  db.prepare(`
    UPDATE stock SET quantity = MAX(0, quantity + ?), updated_at = datetime('now')
    WHERE product_id = ?
  `).run(delta, product_id);

  res.json({ id: result.lastInsertRowid });
});

/* Запуск HTTP-сервера */
app.listen(PORT, () => {
  console.log(`Сервер VAFLYA запущен: http://localhost:${PORT}`);
});
