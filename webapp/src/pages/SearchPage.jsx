import { useState } from 'react';
import { search, addTorrent } from '../api';

function fmt(bytes) {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' ГБ';
  if (bytes > 1e6) return (bytes / 1e6).toFixed(0) + ' МБ';
  return (bytes / 1e3).toFixed(0) + ' КБ';
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState({});
  const [added, setAdded] = useState({});

  async function doSearch(e) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    setResults([]);
    try {
      const data = await search(q.trim());
      setResults(data.results || []);
    } catch {
      alert('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  }

  async function doAdd(item) {
    setAdding(p => ({ ...p, [item.info_hash]: true }));
    try {
      await addTorrent(item.info_hash, item.name);
      setAdded(p => ({ ...p, [item.info_hash]: true }));
    } catch {
      alert('Ошибка добавления');
    } finally {
      setAdding(p => ({ ...p, [item.info_hash]: false }));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ color: '#1DB954', fontSize: 26, fontWeight: 700, marginBottom: 14 }}>TorMus</h1>
        <form onSubmit={doSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Исполнитель, альбом..."
            style={{
              flex: 1, backgroundColor: '#282828', color: '#fff',
              border: 'none', borderRadius: 10, padding: '12px 14px',
              fontSize: 15, outline: 'none',
            }}
          />
          <button type="submit" style={{
            backgroundColor: '#1DB954', color: '#fff', border: 'none',
            borderRadius: 10, padding: '0 18px', fontSize: 15, fontWeight: 600,
          }}>
            Найти
          </button>
        </form>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#1DB954' }}>
            <div style={{ fontSize: 14 }}>Поиск...</div>
          </div>
        )}

        {results.map(item => (
          <div key={item.info_hash} style={{
            backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, marginBottom: 8,
          }}>
            <div style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 10 }}>{item.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: 12 }}>
                {item.seeders} сид · {fmt(item.size)}
              </span>
              <button
                onClick={() => doAdd(item)}
                disabled={!!adding[item.info_hash] || !!added[item.info_hash]}
                style={{
                  backgroundColor: added[item.info_hash] ? '#1a5c2a' : adding[item.info_hash] ? '#444' : '#1DB954',
                  color: '#fff', borderRadius: 8, padding: '7px 16px',
                  fontSize: 13, fontWeight: 600, transition: 'background .2s',
                }}
              >
                {added[item.info_hash] ? '✓ Добавлен' : adding[item.info_hash] ? '...' : 'Скачать'}
              </button>
            </div>
          </div>
        ))}

        {!loading && results.length === 0 && q && (
          <div style={{ textAlign: 'center', color: '#555', paddingTop: 40, fontSize: 14 }}>
            Нет результатов
          </div>
        )}
      </div>
    </div>
  );
}
