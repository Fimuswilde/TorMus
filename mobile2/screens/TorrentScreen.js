import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { API_BASE } from "../constants";
import { usePlayer } from "../context/PlayerContext";

function formatSize(bytes) {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes > 1e6) return (bytes / 1e6).toFixed(0) + " MB";
  return (bytes / 1e3).toFixed(0) + " KB";
}

function stateLabel(state) {
  const map = { downloading: "Загрузка", seeding: "Готово", stalledDL: "Ожидание", metaDL: "Метаданные", pausedDL: "Пауза" };
  return map[state] || state;
}

export default function TorrentScreen() {
  const [torrents, setTorrents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { playTrack, setQueue } = usePlayer();
  const navigation = useNavigation();

  const fetchTorrents = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/torrents`);
      const data = await resp.json();
      setTorrents(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTorrents();
    const interval = setInterval(fetchTorrents, 3000);
    return () => clearInterval(interval);
  }, []);

  async function selectTorrent(hash) {
    if (selected === hash) { setSelected(null); setFiles([]); return; }
    setSelected(hash);
    try {
      const resp = await fetch(`${API_BASE}/torrent/${hash}/status`);
      const data = await resp.json();
      setFiles(data.audio_files || []);
    } catch {}
  }

  async function playFile(torrentHash, file, allFiles) {
    const track = { torrentHash, fileIndex: file.index, name: file.name };
    setQueue(allFiles.map((f) => ({ torrentHash, fileIndex: f.index, name: f.name })));
    await playTrack(track);
    navigation.navigate("Player");
  }

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Загрузки</Text>
      {torrents.length === 0 && <Text style={s.empty}>Нет торрентов. Найди музыку на вкладке Поиск.</Text>}
      <FlatList
        data={torrents}
        keyExtractor={(t) => t.hash}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchTorrents(); setRefreshing(false); }} tintColor="#1DB954" />}
        renderItem={({ item }) => (
          <View>
            <TouchableOpacity style={s.torrentItem} onPress={() => selectTorrent(item.hash)}>
              <View style={s.torrentInfo}>
                <Text style={s.torrentName} numberOfLines={1}>{item.name}</Text>
                <View style={s.progressRow}>
                  <View style={s.progressBg}><View style={[s.progressFill, { width: `${item.progress}%` }]} /></View>
                  <Text style={s.progressText}>{item.progress}%</Text>
                </View>
                <Text style={s.stateText}>{stateLabel(item.state)}</Text>
              </View>
              <Ionicons name={selected === item.hash ? "chevron-up" : "chevron-down"} size={20} color="#888" />
            </TouchableOpacity>
            {selected === item.hash && (
              <View style={s.fileList}>
                {files.length === 0
                  ? <Text style={s.noFiles}>Аудио файлы ещё не скачаны</Text>
                  : files.map((f) => (
                    <TouchableOpacity key={f.index} style={s.fileItem} onPress={() => playFile(item.hash, f, files)}>
                      <Ionicons name="musical-note" size={16} color="#1DB954" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.fileName} numberOfLines={1}>{f.name}</Text>
                        <Text style={s.fileMeta}>{formatSize(f.size)} · {f.progress}%</Text>
                      </View>
                      <Ionicons name="play-circle" size={28} color="#1DB954" />
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  title: { color: "#1DB954", fontSize: 28, fontWeight: "bold", padding: 16 },
  empty: { color: "#666", textAlign: "center", marginTop: 40, paddingHorizontal: 32 },
  torrentItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#282828" },
  torrentInfo: { flex: 1, marginRight: 8 },
  torrentName: { color: "#fff", fontSize: 14, fontWeight: "500", marginBottom: 6 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  progressBg: { flex: 1, height: 3, backgroundColor: "#333", borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: "#1DB954", borderRadius: 2 },
  progressText: { color: "#888", fontSize: 11, width: 36 },
  stateText: { color: "#666", fontSize: 11 },
  fileList: { backgroundColor: "#1a1a1a", paddingHorizontal: 16 },
  noFiles: { color: "#666", paddingVertical: 12, fontSize: 13 },
  fileItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#282828" },
  fileName: { color: "#ddd", fontSize: 13 },
  fileMeta: { color: "#666", fontSize: 11, marginTop: 2 },
});
