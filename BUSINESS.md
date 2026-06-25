# TorMus — Business & Product Plan

## What it is

TorMus is a personal music server + mobile player.
You own the server, you control the library. No subscriptions, no censorship, no takedowns.

## Target user

- Listens to music that mainstream platforms remove or restrict
  (explicit versions, regional blocks, underground labels, niche genres)
- Wants lossless / high-bitrate audio without paying per-album
- Technically comfortable enough to run a home server

## Competitive analysis

| | Spotify | Apple Music | YouTube Music | TorMus |
|--|---------|------------|--------------|--------|
| Price | $11/mo | $11/mo | $11/mo | $0 |
| Explicit/banned albums | ❌ often removed | ❌ | partial | ✅ |
| FLAC quality | ❌ | ✅ (lossless) | ❌ | ✅ (source) |
| Any torrent ever released | ❌ | ❌ | ❌ | ✅ |
| Works offline | ✅ | ✅ | ✅ | ❌ (streams) |
| Easy setup | ✅ | ✅ | ✅ | ❌ (server needed) |
| Legal | ✅ | ✅ | ✅ | ⚠️ gray area |

## Unique value

1. **No censorship** — if it exists on a torrent, you can play it
2. **Cost** — zero after hardware
3. **Ownership** — your server, your files, no one pulls the library

## Legal position

TorMus itself is a streaming interface — similar to Plex or Jellyfin.
Downloading copyrighted material via torrents is **illegal in most countries**.
This is a personal-use tool. Do not distribute or monetize.

## Realistic roadmap

### Now (MVP — done)
- [x] Search PirateBay
- [x] Download via qBittorrent
- [x] Stream to iPhone via expo-av
- [x] FLAC/MP3/OGG/M4A support
- [x] Basic player (play/pause/skip/seek)
- [x] Background playback

### Short term
- [ ] Album art (MusicBrainz lookup by torrent name)
- [ ] Lossless FLAC streaming option
- [ ] Multiple search sources (1337x, Rutracker)
- [ ] Standalone iOS app (no Expo Go)

### Long term
- [ ] Remote access without VPN (Tailscale integration)
- [ ] Android support
- [ ] Offline cache on phone
- [ ] Multiple users (family server)

## Infrastructure cost

| Item | Cost |
|------|------|
| Old laptop/mini PC as server | one-time ~$0-200 |
| Electricity (~30W always-on) | ~$3/month |
| Internet | already paying |
| **Total** | **~$3/month** |

vs Spotify/Apple Music: $11/month = $132/year saved.
