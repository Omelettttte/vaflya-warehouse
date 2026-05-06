/* Базовый URL бэкенда. При необходимости можно переопределить через переменную окружения */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/* Вспомогательная функция выполнения HTTP-запросов к API */
async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  /* При ошибке от сервера читаем сообщение и бросаем исключение */
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Ошибка ${res.status}`);
  }
  return res.json();
}

/* Экспортируемые методы для всех типов запросов */
export const get  = (path)        => request('GET',    path);
export const post = (path, body)  => request('POST',   path, body);
export const put  = (path, body)  => request('PUT',    path, body);
export const del  = (path)        => request('DELETE', path);
