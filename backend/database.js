const Database = require('better-sqlite3');
const path = require('path');

/* Путь к файлу базы данных SQLite */
const DB_PATH = path.join(__dirname, 'warehouse.db');

function initDB() {
  const db = new Database(DB_PATH);

  /* Создание таблиц если они ещё не существуют */
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category_id INTEGER REFERENCES categories(id),
      unit TEXT NOT NULL DEFAULT 'шт',
      description TEXT,
      min_stock INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity REAL NOT NULL DEFAULT 0,
      location TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('receipt', 'writeoff', 'adjustment')),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      note TEXT,
      responsible TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  /* Заполнение демонстрационными данными при первом запуске */
  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (catCount.c === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const cats = ['Электроника', 'Инструменты', 'Упаковка', 'Расходные материалы', 'Оргтехника'];
    cats.forEach(c => insertCat.run(c));

    const insertProduct = db.prepare(`
      INSERT INTO products (name, sku, category_id, unit, min_stock, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    /* Демонстрационные товары для каждой категории */
    const products = [
      ['Ноутбук Lenovo ThinkPad', 'NB-001', 1, 'шт', 5, 'Бизнес-ноутбук'],
      ['Монитор 24"', 'MON-001', 1, 'шт', 3, 'Full HD IPS'],
      ['Дрель Makita', 'DR-001', 2, 'шт', 2, 'Аккумуляторная дрель'],
      ['Набор отвёрток', 'SD-001', 2, 'набор', 5, '12 предметов'],
      ['Картонная коробка 40x30x20', 'BOX-M', 3, 'шт', 50, 'Средний размер'],
      ['Стрейч-плёнка', 'STR-001', 3, 'рул', 10, '500мм × 300м'],
      ['Бумага А4', 'PAP-A4', 4, 'пач', 20, '500 листов, 80г/м²'],
      ['Картридж HP 85A', 'CART-001', 4, 'шт', 3, 'Для LaserJet'],
      ['Принтер HP LaserJet', 'PR-001', 5, 'шт', 1, 'Лазерный принтер'],
      ['МФУ Canon', 'MFU-001', 5, 'шт', 1, 'Принтер/сканер/копир'],
    ];
    const insertStock = db.prepare('INSERT INTO stock (product_id, quantity, location) VALUES (?, ?, ?)');
    const insertOp = db.prepare(`
      INSERT INTO operations (type, product_id, quantity, note, responsible)
      VALUES (?, ?, ?, ?, ?)
    `);

    products.forEach(([name, sku, catId, unit, minStock, desc], i) => {
      const result = insertProduct.run(name, sku, catId, unit, minStock, desc);
      const productId = result.lastInsertRowid;
      /* Начальные остатки на складе */
      const qty = Math.floor(Math.random() * 20) + 5;
      insertStock.run(productId, qty, 'Склад А');
      /* Операция поступления для истории */
      insertOp.run('receipt', productId, qty, 'Начальное поступление', 'Иванов А.В.');
    });

    /* Несколько демонстрационных списаний */
    insertOp.run('writeoff', 1, 2, 'Выдано сотруднику', 'Петрова М.С.');
    insertOp.run('writeoff', 5, 10, 'Упаковка заказов', 'Сидоров К.И.');
    insertOp.run('adjustment', 3, -1, 'Инвентаризация', 'Иванов А.В.');

    /* Обновление остатков после списаний */
    db.prepare('UPDATE stock SET quantity = quantity - 2, updated_at = datetime(\'now\') WHERE product_id = 1').run();
    db.prepare('UPDATE stock SET quantity = quantity - 10, updated_at = datetime(\'now\') WHERE product_id = 5').run();
    db.prepare('UPDATE stock SET quantity = quantity - 1, updated_at = datetime(\'now\') WHERE product_id = 3').run();
  }

  return db;
}

module.exports = { initDB };
