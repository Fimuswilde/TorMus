import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { getDuration, streamUrl } from '../api';

const Ctx = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const trackRef = useRef(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setPosition(audio.currentTime));
    audio.addEventListener('durationchange', () => {
      if (isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    });
    audio.addEventListener('playing', () => { setIsPlaying(true); setIsLoading(false); });
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('waiting', () => setIsLoading(true));
    audio.addEventListener('canplay', () => setIsLoading(false));
    audio.addEventListener('ended', () => playNextInternal());

    return () => { audio.pause(); audio.src = ''; };
  }, []);

  function playNextInternal() {
    const q = queueRef.current;
    const curr = trackRef.current;
    if (!curr || q.length === 0) return;
    const idx = q.findIndex(t => t.torrentHash === curr.torrentHash && t.fileIndex === curr.fileIndex);
    if (idx < q.length - 1) playTrackInternal(q[idx + 1]);
  }

  function playTrackInternal(track) {
    const audio = audioRef.current;
    trackRef.current = track;
    setCurrentTrack(track);
    setPosition(0);
    setDuration(0);
    setIsLoading(true);
    audio.src = streamUrl(track.torrentHash, track.fileIndex);
    audio.play().catch(() => {});

    getDuration(track.torrentHash, track.fileIndex)
      .then(d => { if (d.duration_ms) setDuration(d.duration_ms / 1000); })
      .catch(() => {});
  }

  const playTrack = useCallback((track) => playTrackInternal(track), []);

  const setQueue = useCallback((q) => { queueRef.current = q; }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const seekTo = useCallback((seconds) => {
    if (audioRef.current && isFinite(seconds)) audioRef.current.currentTime = seconds;
  }, []);

  const playNext = useCallback(() => playNextInternal(), []);

  const playPrev = useCallback(() => {
    const q = queueRef.current;
    const curr = trackRef.current;
    if (!curr || q.length === 0) return;
    const idx = q.findIndex(t => t.torrentHash === curr.torrentHash && t.fileIndex === curr.fileIndex);
    if (idx > 0) playTrackInternal(q[idx - 1]);
  }, []);

  return (
    <Ctx.Provider value={{ currentTrack, isPlaying, isLoading, position, duration, playTrack, setQueue, togglePlay, seekTo, playNext, playPrev }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePlayer = () => useContext(Ctx);
