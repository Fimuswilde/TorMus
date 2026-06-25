const tabs = [
  { id: 'search', label: 'Поиск', icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )},
  { id: 'downloads', label: 'Загрузки', icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )},
];

export default function BottomNav({ page, onChange }) {
  return (
    <nav style={{
      display: 'flex', backgroundColor: '#181818',
      borderTop: '1px solid #282828',
      paddingBottom: 'calc(var(--safe-bottom) + 4px)',
    }}>
      {tabs.map(t => {
        const active = page === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3, padding: '10px 0',
            color: active ? '#1DB954' : '#666',
            transition: 'color .15s',
          }}>
            {t.icon(active)}
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
