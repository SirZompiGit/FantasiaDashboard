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
import { MAX_CLIP_NAME, MAX_SOUND_CLIPS, isPlayableUrl, probeAudio } from '../lib/soundClips';
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
  const [checking, setChecking] = useState(false);

  const full = clips.length >= MAX_SOUND_CLIPS;

  const submit = async () => {
    if (full || checking) return;

    if (!isPlayableUrl(url)) {
      setError('Serve un indirizzo diretto a un file audio (http, https o /file.mp3).');
      return;
    }

    // Si prova ad aprire il file PRIMA di salvarlo: scoprire a metà partita che
    // una clip non parte è il modo peggiore.
    setChecking(true);
    const playable = await probeAudio(url.trim());
    setChecking(false);

    if (!playable) {
      setError(
        'Il browser non riesce a riprodurre questo file. Spesso non dipende dal file ma dal servizio che lo ospita: alcuni (come catbox.moe) non dichiarano che si tratta di audio. Caricalo gratis su Tencent EdgeOne (pages.edgeone.ai/drop) e usa quel link.',
      );
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
                  void submit();
                }
              }}
              placeholder="https://.../suono.mp3"
              aria-label="Indirizzo del file audio"
              className={FIELD}
            />
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!url.trim() || checking}
              className="shrink-0 rounded-lg bg-theme-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-theme-500 disabled:opacity-40"
            >
              {checking ? 'Provo...' : 'Aggiungi'}
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-2 py-1.5 text-[10px] leading-snug text-red-300">
              {error}
            </p>
          )}

          <p className="text-[10px] leading-snug text-slate-500">
            Serve il link <strong className="text-slate-400">diretto</strong> a un file{' '}
            <strong className="text-slate-400">MP3</strong>. Per caricare gli audio gratis usa{' '}
            <a
              href="https://pages.edgeone.ai/drop"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-theme-400 underline decoration-theme-500/40 underline-offset-2 transition-colors duration-200 hover:text-theme-500"
            >
              Tencent EdgeOne
            </a>
            : trascini il file e ti dà subito l&apos;indirizzo, senza account.
          </p>
          <p className="text-[10px] leading-snug text-slate-600">
            Non tutti i servizi vanno bene: <span className="text-slate-500">catbox.moe</span>{' '}
            consegna i file senza dichiarare che sono audio, e il browser si rifiuta di
            riprodurli. <span className="text-slate-500">Google Drive</span> non dà un vero link
            diretto e i link di <span className="text-slate-500">Discord</span> scadono dopo
            poche ore.
          </p>
        </div>
      )}
    </SettingsSection>
  );
}
