# TorMus

Personal music streaming app — search torrents, download to your server, stream to your iPhone.

## Architecture

```
iPhone (Expo Go)  ←──HTTP──→  FastAPI Server  ←──→  qBittorrent
                                    ↓
                               ffmpeg (transcode)
                                    ↓
                            C:\TorMus_downloads\
```

## Requirements

**Server (Windows):**
- Python 3.12+
- qBittorrent with Web UI enabled (`localhost:8080`, login `admin/adminadmin`)
- ffmpeg in PATH

**Phone:**
- Expo Go (iOS/Android)
- Same WiFi network as server

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
run.bat
```

### Mobile

```bash
cd mobile2
npm install
cp constants.example.js constants.js
# Edit constants.js — set your server's local IP
npx expo start
```

Scan QR with Expo Go.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server + qBittorrent status |
| GET | `/search?q=` | Search PirateBay (music only) |
| POST | `/torrent/add?info_hash=&name=` | Add torrent to qBittorrent |
| GET | `/torrents` | List all torrents |
| GET | `/torrent/{hash}/status` | Torrent progress + audio files |
| GET | `/torrent/{hash}/{index}/duration` | Track duration via ffprobe |
| GET | `/stream/{hash}/{index}` | Stream audio as MP3 192k |

## Supported formats

Input: `.mp3` `.flac` `.ogg` `.m4a` `.wav` `.aac` `.opus`
Output: MP3 192kbps (transcoded by ffmpeg on the fly)

## Notes

- Music files are stored on the server, not the phone
- Seeking requires the file to be fully downloaded (ffprobe needs the full file)
- Background playback works in Expo Go via `staysActiveInBackground`
- For a standalone build: `npx eas build`
