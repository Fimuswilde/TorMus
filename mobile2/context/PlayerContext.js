import { createContext, useContext, useState, useRef, useEffect } from "react";
import { Audio } from "expo-av";
import { API_BASE } from "../constants";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  async function playTrack(track) {
    try {
      setIsLoading(true);
      setDuration(0);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setCurrentTrack(track);
      const url = `${API_BASE}/stream/${track.torrentHash}/${track.fileIndex}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setIsPlaying(true);
      // fetch duration separately via ffprobe
      fetch(`${API_BASE}/torrent/${track.torrentHash}/${track.fileIndex}/duration`)
        .then(r => r.json())
        .then(data => { if (data.duration_ms) setDuration(data.duration_ms); })
        .catch(() => {});
    } catch (e) {
      console.error("playTrack error:", e);
    } finally {
      setIsLoading(false);
    }
  }

  function onPlaybackStatusUpdate(status) {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);
    if (status.didJustFinish) playNext();
  }

  async function togglePlay() {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }

  async function seekTo(millis) {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(millis);
  }

  async function playNext() {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex(
      (t) => t.torrentHash === currentTrack.torrentHash && t.fileIndex === currentTrack.fileIndex
    );
    if (idx < queue.length - 1) await playTrack(queue[idx + 1]);
  }

  async function playPrev() {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex(
      (t) => t.torrentHash === currentTrack.torrentHash && t.fileIndex === currentTrack.fileIndex
    );
    if (idx > 0) await playTrack(queue[idx - 1]);
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, queue, setQueue,
        isPlaying, isLoading,
        position, duration,
        playTrack, togglePlay, seekTo, playNext, playPrev,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
