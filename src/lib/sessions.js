/**
 * Session history: every song synced, each with its own audio, kept in
 * IndexedDB rather than localStorage — a WAV can be far larger than
 * localStorage's quota, and a File's bytes need real storage, not a string.
 *
 * A session is keyed by lyrics file name: reopening the same name's lyrics
 * updates that song's session in place rather than creating a duplicate.
 * See `decisions/0003` for why, and `specs/2026-09-22-recent-sessions-and-audio-persistence.md`
 * for the feature this supports.
 *
 * Every exported function here is try/catch-guarded and degrades to a no-op
 * (or an empty/null result) on failure — IndexedDB can be unavailable or
 * blocked (private mode, disabled storage), and session history is a
 * convenience, not a feature, same posture as `localStorage` access in
 * `src/state/project.js`.
 */

const DB_NAME = 'lyric-video-engine'
const DB_VERSION = 1
const SESSIONS_STORE = 'sessions'
const AUDIO_STORE = 'sessionAudio'

/* Cached across calls, so repeated saves during a sync pass reuse one connection. */
let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          db.createObjectStore(AUDIO_STORE, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        /* Let the next call try again, rather than caching a permanent failure. */
        dbPromise = null
        reject(request.error)
      }
    })
  }
  return dbPromise
}

async function withStore(storeName, mode, run) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(storeName, mode).objectStore(storeName))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** A session's id is its lyrics file name — same name, same session. */
export function sessionId(lyricsName) {
  return lyricsName
}

/** The record written to the lightweight sessions store — no audio bytes. */
export function sessionRecord({ lyricsName, lines, style, audioName }) {
  return {
    id: sessionId(lyricsName),
    lyricsName,
    audioName: audioName ?? null,
    lines,
    style,
    updatedAt: Date.now(),
  }
}

/** Save a song's session metadata. Cheap — no audio bytes touched here. */
export async function saveSession(session) {
  if (!session?.lyricsName) return
  try {
    await withStore(SESSIONS_STORE, 'readwrite', (store) => store.put(session))
  } catch {
    /* IndexedDB unavailable or blocked — see file header. */
  }
}

/** Save (or replace) a session's audio bytes. Only call this when the audio actually changes. */
export async function saveSessionAudio(id, blob, name) {
  if (!id || !blob) return
  try {
    await withStore(AUDIO_STORE, 'readwrite', (store) =>
      store.put({ id, blob, type: blob.type, name: name ?? null }),
    )
  } catch {
    /* IndexedDB unavailable or blocked — see file header. */
  }
}

/** Every session, most recently updated first. Empty array on any failure. */
export async function listSessions() {
  try {
    const all = await withStore(SESSIONS_STORE, 'readonly', (store) => store.getAll())
    return (all ?? []).toSorted((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

/** A session's stored audio as a real File, or null if there is none. */
export async function loadSessionAudio(id) {
  if (!id) return null
  try {
    const record = await withStore(AUDIO_STORE, 'readonly', (store) => store.get(id))
    if (!record?.blob) return null
    return new File([record.blob], record.name ?? 'audio', { type: record.type })
  } catch {
    return null
  }
}
