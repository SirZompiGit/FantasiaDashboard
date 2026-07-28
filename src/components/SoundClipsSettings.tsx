/**
 * Gestione delle clip sonore, nel pannello impostazioni.
 *
 * Si aggiungono per INDIRIZZO, non caricando il file: nel database finiscono
 * nome, link e volume — poche decine di byte invece di svariati megabyte per
 * ogni giocatore collegato.
 */

import { useState } from 'react';
import { Music, Trash2 } from 'lucide-react';
import type { SoundClip } from '../types';
import { MAX_CLIP_NAME, MAX_SOUND_CLIPS, isPlayableUrl } from '../lib/soundClips';
import { SettingsSection } from './ui/SettingsSection';

interface SoundClipsSettingsProps {
  clips: SoundClip[];
  onAdd: (name: string, url: string) => void;
  onRename: (id: string, name: string) => void;
  onVolume: (id: string, volume: number) => void;
  onDelete: (id: string) => void;
}

const FIELD =
  'w-full rounded-lg border border-bento-border bg-bento-panel px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 transition-colors duration-200 focus:border-theme-500 focus:outline-none focus:ring-1 focus:ring-theme-500/20';

export function SoundClipsSettings({
  clips,
  onAdd,
  onRename,
  onVolume,
  onDelete,
}: SoundClipsSettingsProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const full = clips.length >= MAX_SOUND_CLIPS;

  const submit = () => {
    if (full) return;

    if (!isPlayableUrl(url)) {
      setError('Serve un indirizzo diretto a un file audio (http, https o /file.mp3).');
      return;
    }

    onAdd(name.trim() || 'Clip', url.trim());
    setName('');
    setUrl('');
    setError(null);
  };

  return (
    <SettingsSection
      title="Suoni"
      icon={Music}
      badge={
        <span className="shrink-0 rounded-full bg-bento-button px-2 py-0.5 font-mono text-[9px] font-bold text-slate-400">
          {clips.length}/{MAX_SOUND_CLIPS}
        </span>
      }
    >
      {clips.length > 0 && (
        <div className="space-y-2">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="space-y-1.5 rounded-lg border border-bento-border bg-bento-panel/40 p-2"
            >
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={clip.name}
                  onChange={(event) => onRename(clip.id, event.target.value)}
                  maxLength={MAX_CLIP_NAME}
                  aria-label={`Nome della clip ${clip.name}`}
                  className={FIELD}
                />
                <button
                  type="button"
                  onClick={() => onDelete(clip.id)}
                  aria-label={`Elimina ${clip.name}`}
                  className="shrink-0 rounded p-1.5 text-slate-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <label className="flex items-center gap-2">
                <span className="w-10 shrink-0 font-mono text-[10px] uppercase text-slate-500">
                  Vol
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(clip.volume * 100)}
                  onChange={(event) => onVolume(clip.id, Number(event.target.value) / 100)}
                  aria-label={`Volume di ${clip.name}`}
                  className="h-1 w-full cursor-pointer accent-theme-500"
                />
                <span className="w-8 shrink-0 text-right font-mono text-[10px] text-slate-400">
                  {Math.round(clip.volume * 100)}
                </span>
              </label>

              <p className="truncate font-mono text-[9px] text-slate-600" title={clip.url}>
                {clip.url}
              </p>
            </div>
          ))}
        </div>
      )}

      {full ? (
        <p className="text-[10px] leading-snug text-slate-500">
          Hai raggiunto le {MAX_SOUND_CLIPS} clip. Eliminane una per aggiungerne un&apos;altra.
        </p>
      ) : (
        <div className="space-y-1.5">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_CLIP_NAME}
            placeholder="Nome (es. Tuono)"
            aria-label="Nome della nuova clip"
            className={FIELD}
          />
          <div className="flex gap-1.5">
            <input
              type="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="https://.../suono.mp3"
              aria-label="Indirizzo del file audio"
              className={FIELD}
            />
            <button
              type="button"
              onClick={submit}
              disabled={!url.trim()}
              className="shrink-0 rounded-lg bg-theme-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-theme-500 disabled:opacity-40"
            >
              Aggiungi
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-2 py-1.5 text-[10px] leading-snug text-red-300">
              {error}
            </p>
          )}

          <p className="text-[10px] leading-snug text-slate-500">
            Serve il link <strong className="text-slate-400">diretto</strong> a un file audio.
            Il più semplice è caricarlo su <span className="text-slate-400">catbox.moe</span>{' '}
            (nessun account) e incollare qui l&apos;indirizzo che ti restituisce. Evita Google
            Drive e Discord: i loro link non funzionano o scadono.
          </p>
        </div>
      )}
    </SettingsSection>
  );
}
