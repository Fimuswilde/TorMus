import os
import re
import asyncio
import subprocess
from pathlib import Path

import httpx
import qbittorrentapi
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse

app = FastAPI(title="TorMus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOADS_DIR = Path("C:/TorMus_downloads")
DOWNLOADS_DIR.mkdir(exist_ok=True)

QB_HOST = "localhost"
QB_PORT = 8080
QB_USER = "admin"
QB_PASS = "adminadmin"

AUDIO_EXTENSIONS = {".mp3", ".flac", ".ogg", ".m4a", ".wav", ".aac", ".opus"}


def get_qb():
    client = qbittorrentapi.Client(host=QB_HOST, port=QB_PORT, username=QB_USER, password=QB_PASS)
    client.auth_log_in()
    return client


TRACKERS = "&".join([
    "tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce",
    "tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce",
    "tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce",
    "tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce",
])


def make_magnet(info_hash: str, name: str) -> str:
    encoded_name = httpx.URL("", params={"dn": name}).params
    return f"magnet:?xt=urn:btih:{info_hash}&dn={httpx.URL('', params={'x': name}).params['x'].replace('+', '%20')}&{TRACKERS}"


async def search_piratebay(query: str) -> list[dict]:
    results = []
    try:
        # cat=100 = Music, returns JSON
        url = f"https://apibay.org/q.php?q={httpx.URL('', params={'q': query}).params['q']}&cat=100"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            data = resp.json()
        if not data or (len(data) == 1 and data[0].get("id") == "0"):
            return []
        for item in data[:20]:
            results.append({
                "name": item["name"],
                "info_hash": item["info_hash"].lower(),
                "seeders": item.get("seeders", 0),
                "size": int(item.get("size", 0)),
                "source": "PirateBay",
            })
        results.sort(key=lambda x: int(x["seeders"]), reverse=True)
    except Exception as e:
        print(f"PirateBay search error: {e}")
    return results


@app.get("/open")
async def open_in_expo(url: str):
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Открыть TorMus</title>
    <meta http-equiv="refresh" content="0;url={url}">
    </head><body style="background:#121212;color:#fff;font-family:sans-serif;text-align:center;padding-top:100px">
    <h2 style="color:#1DB954">TorMus</h2>
    <p>Открываем в Expo Go...</p>
    <a href="{url}" style="color:#1DB954;font-size:18px">Нажми здесь если не открылось</a>
    </body></html>"""
    return HTMLResponse(html)


@app.get("/health")
async def health():
    try:
        qb = get_qb()
        ver = qb.app.version
        return {"status": "ok", "qbittorrent": ver}
    except Exception as e:
        return {"status": "qbittorrent_offline", "error": str(e)}


@app.get("/search")
async def search(q: str):
    if not q or len(q) < 2:
        raise HTTPException(400, "Query too short")
    results = await search_piratebay(q)
    return {"results": results, "count": len(results)}


@app.post("/torrent/add")
async def add_torrent(info_hash: str, name: str = ""):
    magnet = make_magnet(info_hash, name)
    try:
        qb = get_qb()
        qb.torrents_add(
            magnet,
            save_path=str(DOWNLOADS_DIR),
            is_sequential_download=True,
        )
        return {"torrent_hash": info_hash.lower(), "status": "added"}
    except Exception as e:
        raise HTTPException(500, f"qBittorrent error: {e}")


@app.get("/torrent/{torrent_hash}/status")
async def torrent_status(torrent_hash: str):
    try:
        qb = get_qb()
        torrents = qb.torrents_info(torrent_hashes=torrent_hash)
        if not torrents:
            raise HTTPException(404, "Torrent not found")
        t = torrents[0]

        files = []
        try:
            for f in qb.torrents_files(torrent_hash=torrent_hash):
                ext = Path(f.name).suffix.lower()
                if ext in AUDIO_EXTENSIONS:
                    files.append({
                        "index": f.index,
                        "name": Path(f.name).name,
                        "path": str(DOWNLOADS_DIR / f.name),
                        "size": f.size,
                        "progress": round(f.progress * 100, 1),
                    })
        except Exception:
            pass

        return {
            "name": t.name,
            "progress": round(t.progress * 100, 1),
            "state": t.state,
            "download_speed": t.dlspeed,
            "eta": t.eta,
            "audio_files": files,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/torrent/{torrent_hash}/{file_index}/duration")
async def get_duration(torrent_hash: str, file_index: int):
    try:
        qb = get_qb()
        files = qb.torrents_files(torrent_hash=torrent_hash)
        target = next((f for f in files if f.index == file_index), None)
        if not target:
            raise HTTPException(404, "File not found")
        file_path = DOWNLOADS_DIR / target.name
        if not file_path.exists():
            raise HTTPException(425, "File not downloaded yet")
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(file_path)],
            capture_output=True, text=True, timeout=10,
        )
        duration_sec = float(result.stdout.strip())
        return {"duration_ms": int(duration_sec * 1000)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/stream/{torrent_hash}/{file_index}")
async def stream_audio(torrent_hash: str, file_index: int):
    try:
        qb = get_qb()
        files = qb.torrents_files(torrent_hash=torrent_hash)
        target = next((f for f in files if f.index == file_index), None)
        if not target:
            raise HTTPException(404, "File not found in torrent")

        torrents = qb.torrents_info(torrent_hashes=torrent_hash)
        if not torrents:
            raise HTTPException(404, "Torrent not found")

        file_path = DOWNLOADS_DIR / target.name
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

    # wait for at least 512KB to buffer
    for _ in range(60):
        if file_path.exists() and file_path.stat().st_size > 524288:
            break
        await asyncio.sleep(1)

    if not file_path.exists() or file_path.stat().st_size < 4096:
        raise HTTPException(425, "File not ready yet, try again in a moment")

    def generate():
        proc = subprocess.Popen(
            [
                "ffmpeg", "-i", str(file_path),
                "-f", "mp3", "-ab", "192k", "-vn",
                "-loglevel", "quiet",
                "pipe:1",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
        try:
            while chunk := proc.stdout.read(8192):
                yield chunk
        finally:
            proc.terminate()

    return StreamingResponse(generate(), media_type="audio/mpeg")


@app.get("/torrents")
async def list_torrents():
    try:
        qb = get_qb()
        torrents = qb.torrents_info()
        return [
            {
                "hash": t.hash,
                "name": t.name,
                "progress": round(t.progress * 100, 1),
                "state": t.state,
            }
            for t in torrents
        ]
    except Exception as e:
        raise HTTPException(500, str(e))
