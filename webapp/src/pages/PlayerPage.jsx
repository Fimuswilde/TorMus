import { usePlayer } from '../context/PlayerContext';

function fmt(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function PlayerPage({ onClose }) {
  const { currentTrack, isPlaying, isLoading, position, duration, togglePlay, seekTo, playNext, playPrev } = usePlayer();

  const progress = duration > 0 ? position / duration : 0;

  function handleSeek(e) {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(ratio * duration);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: '#121212',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 0' }}>
        <button onClick={onClose} style={{ color: '#fff', padding: 8, marginLeft: -8 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
          Сейчас играет
        </span>
        <div style={{ width: 40 }} />
      </div>

      {/* Artwork */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 32px' }}>
        <div style={{
          width: '100%', aspectRatio: '1', maxWidth: 300,
          backgroundColor: '#1a1a1a', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,.5)', marginBottom: 32,
        }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#1DB954" opacity="0.6">
            <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
          </svg>
        </div>

        <div style={{ width: '100%', marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentTrack?.name || 'Ничего не играет'}
          </div>
        </div>

        {/* Seek bar */}
        <div style={{ width: '100%', marginBottom: 8 }}>
          <div
            onClick={handleSeek}
            style={{ height: 4, backgroundColor: '#333', borderRadius: 2, cursor: duration > 0 ? 'pointer' : 'default', position: 'relative' }}
          >
            <div style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: '#1DB954', borderRadius: 2 }} />
            {duration > 0 && (
              <div style={{
                position: 'absolute', top: '50%', left: `${progress * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff',
                boxShadow: '0 0 4px rgba(0,0,0,.4)',
              }} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>{fmt(position)}</span>
            <span style={{ color: '#888', fontSize: 12 }}>{duration > 0 ? fmt(duration) : '–:––'}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 8 }}>
          <button onClick={playPrev} style={{ color: '#fff', opacity: 0.8 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <button onClick={togglePlay} disabled={isLoading} style={{
            width: 64, height: 64, borderRadius: '50%', backgroundColor: '#1DB954',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isLoading ? 0.7 : 1,
          }}>
            {isLoading ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
              </svg>
            ) : isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#000">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#000">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>

          <button onClick={playNext} style={{ color: '#fff', opacity: 0.8 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Safe area bottom */}
      <div style={{ height: 'calc(var(--safe-bottom) + 16px)' }} />
    </div>
  );
}
