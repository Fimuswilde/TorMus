import { useState, useEffect, useCallback } from 'react';
import { getTorrents, getTorrentStatus } from '../api';
import { usePlayer } from '../context/PlayerContext';

function fmt(bytes) {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' ГБ';
  if (bytes > 1e6) return (bytes / 1e6).toFixed(0) + ' МБ';
  return (bytes / 1e3).toFixed(0) + ' КБ';
}

const STATE = { downloading: 'Загрузка', seeding: 'Готово', stalledDL: 'Ожидание', metaDL: 'Метаданные', pausedDL: 'Пауза', pausedUP: 'Готово' };

export default function DownloadsPage({ onPlay }) {
  const [torrents, setTorrents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [files, setFiles] = useState({});
  const { playTrack, setQueue } = usePlayer();

  const load = useCallback(async () => {
    try { setTorrents(await getTorrents()); } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  async function expand(hash) {
    if (expanded === hash) { setExpanded(null); return; }
    setExpanded(hash);
    try {
      const data = await getTorrentStatus(hash);
      setFiles(p => ({ ...p, [hash]: data.audio_files || [] }));
    } catch {}
  }

  function play(hash, file) {
    const all = files[hash] || [];
    setQueue(all.map(f => ({ torrentHash: hash, fileIndex: f.index, name: f.name })));
    playTrack({ torrentHash: hash, fileIndex: file.index, name: file.name });
    onPlay?.();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ color: '#1DB954', fontSize: 26, fontWeight: 700 }}>Загрузки</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {torrents.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', paddingTop: 60, fontSize: 14 }}>
            Нет загрузок.<br />Найди музыку на вкладке Поиск.
          </div>
        )}

        {torrents.map(t => (
          <div key={t.hash} style={{ backgroundColor: '#1a1a1a', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
            <button onClick={() => expand(t.hash)} style={{
              width: '100%', padding: 14, textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                  {t.name}
                </span>
                <span style={{ color: expanded === t.hash ? '#1DB954' : '#666', fontSize: 18 }}>
                  {expanded === t.hash ? '▲' : '▼'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 3, backgroundColor: '#333', borderRadius: 2 }}>
                  <div style={{ width: `${t.progress}%`, height: 3, backgroundColor: '#1DB954', borderRadius: 2 }} />
                </div>
                <span style={{ color: '#888', fontSize: 11, whiteSpace: 'nowrap' }}>
                  {t.progress}% · {STATE[t.state] || t.state}
                </span>
              </div>
            </button>

            {expanded === t.hash && (
              <div style={{ borderTop: '1px solid #282828' }}>
                {(files[t.hash] || []).length === 0 ? (
                  <div style={{ padding: '12px 14px', color: '#666', fontSize: 13 }}>
                    Аудиофайлы ещё не готовы...
                  </div>
                ) : (files[t.hash] || []).map(f => (
                  <button key={f.index} onClick={() => play(t.hash, f)} style={{
                    width: '100%', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderTop: '1px solid #222', textAlign: 'left',
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="12" fill="#1DB954" opacity="0.15"/>
                      <polygon points="10 8 16 12 10 16 10 8" fill="#1DB954"/>
                    </svg>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{fmt(f.size)} · {f.progress}%</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
