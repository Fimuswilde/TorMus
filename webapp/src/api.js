const API = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const get = (path) => fetch(API + path).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
const post = (path) => fetch(API + path, { method: 'POST' }).then(r => r.json());

export const search = (q) => get(`/search?q=${encodeURIComponent(q)}`);
export const addTorrent = (hash, name) => post(`/torrent/add?info_hash=${hash}&name=${encodeURIComponent(name)}`);
export const getTorrents = () => get('/torrents');
export const getTorrentStatus = (hash) => get(`/torrent/${hash}/status`);
export const getDuration = (hash, idx) => get(`/torrent/${hash}/${idx}/duration`);
export const streamUrl = (hash, idx) => `${API}/stream/${hash}/${idx}`;
