import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { usePlayer } from "../context/PlayerContext";

export default function PlayerBar() {
  const { currentTrack, isPlaying, isLoading, togglePlay } = usePlayer();
  const navigation = useNavigation();

  if (!currentTrack) return null;

  return (
    <TouchableOpacity style={s.bar} onPress={() => navigation.navigate("Player")} activeOpacity={0.9}>
      <View style={s.left}>
        <View style={s.icon}><Ionicons name="musical-note" size={16} color="#1DB954" /></View>
        <Text style={s.name} numberOfLines={1}>{currentTrack.name}</Text>
      </View>
      <TouchableOpacity style={s.playBtn} onPress={(e) => { e.stopPropagation(); togglePlay(); }} disabled={isLoading}>
        {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#fff" />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", backgroundColor: "#282828", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#333" },
  left: { flex: 1, flexDirection: "row", alignItems: "center", marginRight: 12 },
  icon: { width: 36, height: 36, borderRadius: 4, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", marginRight: 10 },
  name: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "500" },
  playBtn: { padding: 4 },
});
