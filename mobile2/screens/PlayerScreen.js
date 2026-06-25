import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { usePlayer } from "../context/PlayerContext";
import Slider from "@react-native-community/slider";

const { width } = Dimensions.get("window");

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PlayerScreen() {
  const navigation = useNavigation();
  const { currentTrack, isPlaying, isLoading, position, duration, togglePlay, seekTo, playNext, playPrev } = usePlayer();

  if (!currentTrack) {
    return <SafeAreaView style={s.container}><Text style={s.nothing}>Ничего не воспроизводится</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.container}>
      <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-down" size={28} color="#fff" />
      </TouchableOpacity>
      <View style={s.artwork}>
        <Ionicons name="musical-notes" size={80} color="#1DB954" />
      </View>
      <View style={s.info}>
        <Text style={s.trackName} numberOfLines={2}>{currentTrack.name}</Text>
      </View>
      <View style={s.sliderContainer}>
        {duration > 1000 ? (
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={duration}
            value={Math.min(position, duration)}
            onSlidingComplete={seekTo}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#444"
            thumbTintColor="#1DB954"
          />
        ) : (
          <View style={{ height: 40, justifyContent: "center" }}>
            <View style={{ height: 3, backgroundColor: "#333", borderRadius: 2 }}>
              <View style={{ width: "100%", height: 3, backgroundColor: "#1DB954", borderRadius: 2, opacity: 0.4 }} />
            </View>
          </View>
        )}
        <View style={s.timeRow}>
          <Text style={s.time}>{formatTime(position)}</Text>
          <Text style={s.time}>{duration > 1000 ? formatTime(duration) : "–:––"}</Text>
        </View>
      </View>
      <View style={s.controls}>
        <TouchableOpacity onPress={playPrev}><Ionicons name="play-skip-back" size={36} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={s.playBtn} onPress={togglePlay} disabled={isLoading}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={36} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={playNext}><Ionicons name="play-skip-forward" size={36} color="#fff" /></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", alignItems: "center" },
  nothing: { color: "#666", marginTop: 40 },
  closeBtn: { alignSelf: "flex-start", padding: 16 },
  artwork: { width: width - 80, height: width - 80, backgroundColor: "#282828", borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 20, marginBottom: 32 },
  info: { width: "100%", paddingHorizontal: 24, marginBottom: 24 },
  trackName: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  sliderContainer: { width: "100%", paddingHorizontal: 24 },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  time: { color: "#888", fontSize: 12 },
  controls: { flexDirection: "row", alignItems: "center", gap: 40, marginTop: 32 },
  playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
});
