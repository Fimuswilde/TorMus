import { usePlayer } from '../context/PlayerContext';

export default function PlayerBar({ onOpen }) {
  const { currentTrack, isPlaying, isLoading, togglePlay } = usePlayer();
  if (!currentTrack) return null;

  return (
    <div onClick={onOpen} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', backgroundColor: '#282828',
      borderTop: '1px solid #333', cursor: 'pointer',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 6, backgroundColor: '#1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
          <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
        </svg>
      </div>

      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {currentTrack.name}
      </span>

      <button onClick={e => { e.stopPropagation(); togglePlay(); }} style={{
        width: 36, height: 36, borderRadius: '50%', backgroundColor: '#1DB954',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {isLoading ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        ) : isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        )}
      </button>
    </div>
  );
}
