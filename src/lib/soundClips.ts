/**
 * Clip sonore della campagna.
 *
 * Sono link a file audio già in rete, non file caricati: nel database viaggiano
 * solo nome, indirizzo e volume — poche decine di byte. Caricare gli mp3 come
 * testo (base64), come si fa con le immagini, avrebbe riempito la memoria del
 * browser e bruciato la banda gratuita di Firebase in poche sessioni, perché
 * ogni giocatore collegato avrebbe scaricato l'intero file dal database.
 */

import type { CampaignState, SoundClip } from '../types';

/** Oltre tre la consolle sotto i dadi diventa una tastiera, non un comando. */
export const MAX_SOUND_CLIPS = 3;

export const DEFAULT_CLIP_VOLUME = 0.8;

/** Nome e indirizzo hanno un tetto: finiscono nel database. */
export const MAX_CLIP_NAME = 24;
export const MAX_CLIP_URL = 600;

export function clampVolume(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_CLIP_VOLUME;
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100));
}

/**
 * Un indirizzo utilizzabile davvero.
 *
 * Solo `http`/`https`: gli schemi `data:` e `blob:` non hanno senso qui — il
 * primo rimetterebbe il file dentro il database, il secondo vale solo nella
 * scheda che l'ha creato e agli altri non arriverebbe nulla.
 */
export function isPlayableUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_CLIP_URL) return false;

  // I percorsi interni (file nella cartella public dell'app) sono ammessi.
  if (trimmed.startsWith('/')) return true;

  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Riporta una clip a valori validi, o la scarta se non è utilizzabile. */
export function normalizeClip(value: unknown, id: string): SoundClip | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  if (!isPlayableUrl(url)) return null;

  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, MAX_CLIP_NAME) : '';

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : id,
    name: name || 'Clip',
    url,
    volume: clampVolume(raw.volume),
  };
}

/**
 * Applica i limiti alla lista e restituisce `undefined` quando non ne resta
 * nessuna: una campagna senza clip si serializza esattamente come prima che le
 * clip esistessero, così i salvataggi già fatti restano identici.
 */
export function clampClips(value: unknown): SoundClip[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const clips = value
    .slice(0, MAX_SOUND_CLIPS)
    .map((clip, index) => normalizeClip(clip, `clip-${index}`))
    .filter((clip): clip is SoundClip => clip !== null);

  return clips.length > 0 ? clips : undefined;
}

/**
 * Prova davvero a caricare l'audio prima di accettarlo.
 *
 * Un indirizzo può essere formalmente giusto e comunque inservibile: file in un
 * formato che il browser non sa decodificare, link a una pagina invece che al
 * file, risorsa irraggiungibile. Meglio scoprirlo subito, mentre si aggiunge la
 * clip, che a metà sessione premendo il pulsante.
 *
 * Non scarica l'intero file: `preload="metadata"` chiede solo l'intestazione.
 */
export function probeAudio(url: string, timeoutMs = 8000): Promise<boolean> {
  if (typeof Audio === 'undefined') return Promise.resolve(true);

  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      // Ferma lo scaricamento: la verifica è finita.
      audio.src = '';
      resolve(ok);
    };

    const timer = window.setTimeout(() => done(false), timeoutMs);

    audio.onloadedmetadata = () => done(true);
    audio.onerror = () => done(false);

    audio.preload = 'metadata';
    audio.src = url;
  });
}

/**
 * Lo stato di riproduzione condiviso.
 *
 * Vale solo se ha entrambi i campi: un `clipId` senza istante di partenza non
 * direbbe a chi guarda *quando* avviare il suono, ed è proprio il cambio di
 * `startedAt` a fare da segnale.
 */
export function normalizeClipPlayback(value: unknown): CampaignState['clipPlayback'] {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const clipId = typeof raw.clipId === 'string' ? raw.clipId : '';
  const startedAt = typeof raw.startedAt === 'number' ? raw.startedAt : NaN;

  if (!clipId || !Number.isFinite(startedAt)) return null;
  return { clipId, startedAt };
}
