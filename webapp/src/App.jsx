import { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import SearchPage from './pages/SearchPage';
import DownloadsPage from './pages/DownloadsPage';
import PlayerPage from './pages/PlayerPage';
import PlayerBar from './components/PlayerBar';
import BottomNav from './components/BottomNav';

export default function App() {
  const [page, setPage] = useState('search');
  const [playerOpen, setPlayerOpen] = useState(false);

  return (
    <PlayerProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {page === 'search' && <SearchPage />}
          {page === 'downloads' && <DownloadsPage onPlay={() => setPlayerOpen(true)} />}
        </div>

        <PlayerBar onOpen={() => setPlayerOpen(true)} />
        <BottomNav page={page} onChange={setPage} />
      </div>

      {playerOpen && <PlayerPage onClose={() => setPlayerOpen(false)} />}
    </PlayerProvider>
  );
}
