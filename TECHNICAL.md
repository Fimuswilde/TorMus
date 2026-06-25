# Technical Documentation

## Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81 + Expo SDK 54 |
| Navigation | React Navigation 6 (native stack + bottom tabs) |
| Audio | expo-av 16 (Audio.Sound) |
| Backend | Python 3.12 + FastAPI + uvicorn |
| Torrent client | qBittorrent 5.x via qbittorrent-api |
| Transcoding | ffmpeg (stream) + ffprobe (duration) |
| Search | PirateBay API (apibay.org, cat=100 music) |

## Mobile app structure

```
mobile2/
├── index.js              # Entry point — gesture handler init
├── App.js                # Navigation tree + providers
├── constants.js          # API_BASE (gitignored, copy from .example)
├── context/
│   └── PlayerContext.js  # Global audio player state
└── screens/
    ├── SearchScreen.js   # Search + add torrents
    ├── TorrentScreen.js  # Downloads list + file browser
    └── PlayerScreen.js   # Full-screen player
```

### Navigation tree

```
GestureHandlerRootView
└── SafeAreaProvider
    └── PlayerProvider
        └── NavigationContainer
            └── Stack.Navigator (headerShown: false)
                ├── Main → BottomTabNavigator
                │   ├── Поиск → SearchScreen
                │   └── Загрузки → TorrentScreen
                └── Player → PlayerScreen (modal)
```

### PlayerContext state

| State | Type | Description |
|-------|------|-------------|
| `currentTrack` | `{torrentHash, fileIndex, name}` | Playing track |
| `queue` | `Track[]` | Current album queue |
| `isPlaying` | bool | Playback state |
| `isLoading` | bool | Buffer loading |
| `position` | ms | Current position |
| `duration` | ms | Track duration (from ffprobe) |

### Audio flow

1. `TorrentScreen` → `setQueue(files)` + `playTrack(track)` → navigate to Player
2. `PlayerContext.playTrack()`:
   - Unloads previous `Audio.Sound`
   - `Audio.Sound.createAsync({ uri: stream_url })` — starts buffering
   - Fires `fetch(duration_url)` in background (non-blocking)
   - `onPlaybackStatusUpdate` callback updates position every 500ms
3. `PlayerScreen` renders slider only when `duration > 1000ms`

## Backend structure

```
backend/
├── run.bat              # Start uvicorn
├── requirements.txt
└── app/
    ├── __init__.py
    └── main.py          # All API routes
```

### Streaming pipeline

```
qBittorrent downloads file → C:\TorMus_downloads\
                                      ↓
GET /stream/{hash}/{index}
  1. Wait until file > 512KB
  2. subprocess.Popen(ffmpeg -i file -f mp3 -ab 192k pipe:1)
  3. StreamingResponse(generator, media_type="audio/mpeg")
```

### Duration endpoint

```
GET /torrent/{hash}/{index}/duration
  → ffprobe -show_entries format=duration file
  → {"duration_ms": 213000}
```

## Known limitations

- **No seek on partial downloads** — ffprobe needs the full file
- **Single user** — qBittorrent credentials hardcoded, no auth on API
- **LAN only** — no remote access without VPN/tunnel
- **No album art** — PirateBay API doesn't provide cover images
- **192k MP3 output** — FLAC is transcoded, not streamed losslessly

## Future improvements

- [ ] Replace expo-av with expo-audio (SDK 54 deprecation)
- [ ] Lossless FLAC streaming (when client requests it)
- [ ] Album art via MusicBrainz/Last.fm API
- [ ] Remote access via Tailscale/ngrok
- [ ] EAS standalone build (no Expo Go needed)
- [ ] Playlists and favorites
