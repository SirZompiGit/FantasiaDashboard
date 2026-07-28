/**
 * Consolle delle clip, sotto il lancio dei dadi.
 *
 * Un pulsante per clip e uno solo per fermare tutto. Premere una clip mentre
 * ne suona un'altra sostituisce il suono: una per volta, così al tavolo non si
 * accavallano mai.
 *
 * Il pannello non compare finché non c'è almeno una clip: uno spazio vuoto
 * sotto i dadi sarebbe solo ingombro.
 */

import { Music, Play, Square } from 'lucide-react';
import type { CampaignState, SoundClip } from '../types';
import { playClickSound } from '../utils/audio';

interface SoundBoardProps {
  clips: SoundClip[];
  playback: CampaignState['clipPlayback'];
  onPlay: (id: string) => void;
  onStop: () => void;
}

export function SoundBoard({ clips, playback, onPlay, onStop }: SoundBoardProps) {
  if (clips.length === 0) return null;

  const playingId = playback?.clipId ?? null;

  return (
    <section className="rounded-xl border border-bento-border bg-bento-panel p-3 shadow-panel sm:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-theme-500">
          <Music className="h-3.5 w-3.5" /> Suoni
        </h2>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            onStop();
          }}
          disabled={!playback}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-bento-border bg-bento-bg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-colors duration-200 hover:border-red-500/40 hover:text-red-400 disabled:opacity-30 disabled:hover:border-bento-border disabled:hover:text-slate-400"
        >
          <Square className="h-3 w-3" /> Ferma
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {clips.map((clip) => {
          const isPlaying = playingId === clip.id;

          return (
            <button
              key={clip.id}
              type="button"
              onClick={() => {
                playClickSound();
                onPlay(clip.id);
              }}
              title={`Riproduci ${clip.name} per tutti`}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors duration-200 ${
                isPlaying
                  ? 'border-theme-500 bg-theme-500/10 text-theme-400'
                  : 'border-bento-border bg-bento-bg text-slate-300 hover:border-slate-600 hover:text-slate-100'
              }`}
            >
              <Play
                className={`h-3 w-3 shrink-0 ${isPlaying ? 'fill-theme-500 text-theme-500' : ''}`}
              />
              <span className="truncate">{clip.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
