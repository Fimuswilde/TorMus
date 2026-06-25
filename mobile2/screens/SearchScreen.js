import { useState } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "../constants";

function formatSize(bytes) {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes > 1e6) return (bytes / 1e6).toFixed(0) + " MB";
  return (bytes / 1e3).toFixed(0) + " KB";
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      setResults(data.results || []);
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
  }

  async function addTorrent(item) {
    setAdding(item.info_hash);
    try {
      const resp = await fetch(
        `${API_BASE}/torrent/add?info_hash=${item.info_hash}&name=${encodeURIComponent(item.name)}`,
        { method: "POST" }
      );
      const data = await resp.json();
      if (data.status === "added") {
        Alert.alert("Добавлено!", `"${item.name}" загружается.\nПерейди на вкладку Загрузки.`);
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось добавить торрент");
    } finally {
      setAdding(null);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>TorMus</Text>
      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          placeholder="Исполнитель, альбом..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={s.searchBtn} onPress={doSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color="#1DB954" style={{ marginTop: 20 }} />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.info_hash}
        renderItem={({ item }) => (
          <View style={s.resultItem}>
            <View style={s.resultInfo}>
              <Text style={s.resultName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.resultMeta}>{item.seeders} сидов · {formatSize(item.size)}</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={() => addTorrent(item)} disabled={adding === item.info_hash}>
              {adding === item.info_hash
                ? <ActivityIndicator size="small" color="#1DB954" />
                : <Ionicons name="add-circle" size={32} color="#1DB954" />}
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  title: { color: "#1DB954", fontSize: 28, fontWeight: "bold", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  input: { flex: 1, backgroundColor: "#282828", color: "#fff", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  searchBtn: { backgroundColor: "#1DB954", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  resultItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  resultInfo: { flex: 1, marginRight: 12 },
  resultName: { color: "#fff", fontSize: 14, fontWeight: "500", marginBottom: 4 },
  resultMeta: { color: "#888", fontSize: 12 },
  addBtn: { padding: 4 },
  separator: { height: 1, backgroundColor: "#282828", marginHorizontal: 16 },
});
