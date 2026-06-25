# TorMus — Техническая документация

## Стек

| Слой | Технологии |
|------|-----------|
| **Telegram-бот** | Python 3.11, aiogram 3.13, python-dotenv |
| **Веб-приложение** | React 18, Vite, HTML5 Audio API, Telegram WebApp SDK |
| **Backend** | Python 3.11, FastAPI, uvicorn, httpx |
| **Торрент-клиент** | qBittorrent 5.x (qBittorrent Web API) |
| **Стриминг** | ffmpeg + ffprobe (перекодирование в MP3, определение длительности) |
| **Мобильное приложение** | Expo SDK 54, React Native 0.81.5, expo-av |

---

## Структура проекта

```
TorMus/
├── backend/
│   └── app/
│       └── main.py          # FastAPI: поиск, добавление, стриминг, длительность
├── bot/
│   ├── main.py              # aiogram v3: /start с кнопкой Mini App
│   └── requirements.txt
├── webapp/
│   ├── index.html           # подключает telegram-web-app.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx          # роутинг через state (без React Router)
│       ├── api.js           # все вызовы к FastAPI
│       ├── context/
│       │   └── PlayerContext.jsx    # HTML5 Audio, очередь, seek
│       ├── pages/
│       │   ├── SearchPage.jsx
│       │   ├── DownloadsPage.jsx
│       │   └── PlayerPage.jsx
│       └── components/
│           ├── PlayerBar.jsx        # мини-плеер над навигацией
│           └── BottomNav.jsx        # нижняя панель с SVG-иконками
├── mobile2/                 # iOS приложение (Expo, вторичный клиент)
│   ├── index.js             # КРИТИЧНО: первая строка — gesture-handler
│   ├── App.js               # навигация: NativeStack + BottomTabs
│   ├── app.json
│   ├── babel.config.js
│   ├── constants.js         # API_BASE (в .gitignore)
│   ├── context/
│   │   └── PlayerContext.js
│   ├── screens/
│   │   ├── SearchScreen.js
│   │   ├── TorrentScreen.js
│   │   └── PlayerScreen.js
│   └── components/
│       └── PlayerBar.js
├── .env                     # BOT_TOKEN, WEBAPP_URL, API_BASE (в .gitignore!)
├── .gitignore
├── BUSINESS.md
└── TECHNICAL.md
```

---

## Схема работы

```
Пользователь
    │
    ▼
Telegram Bot (@TorMusBot)
    │  нажимает кнопку "Открыть плеер"
    ▼
Telegram Mini App (React + Vite)
    │  HTTPS запросы
    ▼
FastAPI Backend (:8000)
    │
    ├── /search?q=...      →  PirateBay API → список торрентов
    ├── /torrent/add       →  qBittorrent Web API → начать скачивание
    ├── /torrents          →  список активных торрентов + прогресс
    ├── /torrent/{h}/{i}/status  →  список аудиофайлов, размеры
    ├── /stream/{h}/{i}    →  ffmpeg → MP3-стрим → браузер
    └── /torrent/{h}/{i}/duration  →  ffprobe → duration_ms
```

---

## Backend: ключевые эндпоинты

### `GET /search?q={query}`
Запрашивает PirateBay API, фильтрует категории Audio (id 100), возвращает список:
```json
{
  "results": [
    { "name": "Metallica - Black Album", "info_hash": "abc123", "seeders": 142, "size": 157286400 }
  ]
}
```

### `POST /torrent/add`
```json
{ "info_hash": "abc123", "name": "Metallica - Black Album" }
```
Передаёт magnet-ссылку в qBittorrent через Web API.

### `GET /stream/{torrent_hash}/{file_index}`
Находит файл в папке загрузок qBittorrent, запускает:
```
ffmpeg -i {path} -vn -ar 44100 -ac 2 -b:a 192k -f mp3 pipe:1
```
Стримит побайтово через `StreamingResponse`. Поддерживает Range-запросы.

### `GET /torrent/{torrent_hash}/{file_index}/duration`
Запускает ffprobe, возвращает:
```json
{ "duration_ms": 234800 }
```
Используется плеером для отображения полосы прокрутки.

---

## Webapp: PlayerContext

Состояние плеера хранится в React Context. Аудио управляется через `HTMLAudioElement` (ref, не state — чтобы избежать stale closures).

```
PlayerContext:
├── currentTrack     { torrentHash, fileIndex, name }
├── queue            []
├── isPlaying        bool
├── isLoading        bool
├── position         секунды (обновляется по timeupdate)
├── duration         секунды (получается через /duration или ontimeupdate)
├── playTrack(track) — загружает src, вызывает audio.play()
├── togglePlay()
├── seekTo(seconds)  — audio.currentTime = seconds
├── playNext()
└── playPrev()
```

---

## Webapp: роутинг

Используется state-машина вместо React Router (Mini App не нуждается в URL):

```
page: 'search'   → SearchPage
page: 'downloads'→ DownloadsPage
page: 'player'   → PlayerPage (fullscreen overlay)
```

PlayerBar рендерится поверх всех страниц (кроме PlayerPage), при нажатии переключает на `page: 'player'`.

---

## iOS приложение (mobile2)

### Критически важный порядок импортов в `index.js`
```js
import 'react-native-gesture-handler';  // ← ОБЯЗАТЕЛЬНО первой строкой
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```
Без этого все касания мертвы.

### Навигация
```
GestureHandlerRootView
  SafeAreaProvider
    PlayerProvider
      NavigationContainer
        NativeStack
          ├── Main (headerShown: false)
          │     BottomTabs
          │       ├── Search tab → SearchScreen
          │       └── Downloads tab → TorrentScreen
          └── Player (presentation: modal, headerShown: false)
                PlayerScreen
```

---

## Стриминг: почему нет Content-Length

qBittorrent скачивает файл частями. ffmpeg читает только уже скачанные байты и пишет в pipe. Итоговая длина MP3 неизвестна заранее → `Content-Length` не отправляется → HTML5 Audio / expo-av не знает продолжительность.

**Решение**: отдельный эндпоинт `/duration` вызывает ffprobe после достаточной скачки файла и возвращает длительность в миллисекундах. Плеер запрашивает его асинхронно после начала воспроизведения.

---

## Деплой на VPS

Минимальные требования:
- 2 vCPU, 4 ГБ RAM, 500 ГБ HDD
- Docker + Docker Compose
- Nginx (reverse proxy + TLS)

### Сервисы на VPS (не конфликтуют с n8n/VPN)

| Сервис | Порт | Описание |
|--------|------|---------|
| FastAPI | 8000 | API (через Nginx → /api/) |
| qBittorrent Web UI | 8080 | управление торрентами |
| React webapp | 3000 (dev) / Nginx (prod) | Mini App |
| Telegram Bot | — | polling / webhook |
| n8n | 5678 | не трогаем |
| VPN | tun0 | не трогаем |

### Nginx конфигурация (фрагмент)
```nginx
server {
    server_name tormus.app;
    listen 443 ssl;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
    }

    location / {
        root /var/www/tormus/dist;
        try_files $uri /index.html;
    }
}
```

### HTTPS обязателен
Telegram Mini App открывается только по HTTPS. Используем Certbot / Let's Encrypt:
```bash
certbot --nginx -d tormus.app
```

---

## Переменные окружения (`.env`)

```
BOT_TOKEN=...           # токен от @BotFather — НИКОГДА не коммитить
WEBAPP_URL=https://...  # URL задеплоенной webapp
API_BASE=http://...     # URL FastAPI (локально или на VPS)
```

Webapp использует Vite-переменные:
```
VITE_API_BASE=https://tormus.app/api
```

---

## Поддерживаемые форматы

| Формат | Поиск | Скачивание | Стриминг |
|--------|-------|-----------|---------|
| MP3 | ✅ | ✅ | ✅ напрямую |
| FLAC | ✅ | ✅ | ✅ через ffmpeg → MP3 |
| AAC / M4A | ✅ | ✅ | ✅ через ffmpeg |
| OGG | ✅ | ✅ | ✅ через ffmpeg |
| WAV | ✅ | ✅ | ✅ через ffmpeg |

---

## Известные ограничения

1. **Нет авторизации** — любой знает URL API может добавить торрент. Нужна проверка Telegram `initData` (HMAC-SHA256 от BotFather secret).
2. **Нет очистки** — загрузки накапливаются на диске. Нужна политика TTL / LRU.
3. **Один сервер** — нет горизонтального масштабирования. Критично при >1000 одновременных стримов.
4. **PirateBay** — нестабильный источник. Нужны резервные трекеры (Rutracker, 1337x).

---

## Запуск локально

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Bot
cd bot
pip install -r requirements.txt
python main.py

# Webapp
cd webapp
npm install
npm run dev

# Expo (iOS)
cd mobile2
npx expo start --lan
```
