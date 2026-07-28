/**
 * Riproduzione delle clip sonore, per chiunque sia collegato.
 *
 * Il master preme un pulsante e la clip parte per tutti: master, finestra dello
 * schermo condiviso e giocatori. Non c'è nulla di specifico per ruolo, perché
 * lo stato `clipPlayback` viaggia dentro la campagna e ognuno lo osserva.
 *
 * Il segnale non è "quale clip", ma `startedAt`: quando cambia, la clip parte.
 * Guardare solo l'identificativo avrebbe reso impossibile far ripartire due
 * volte di fila lo stesso suono — cosa che a un tavolo capita di continuo.
 *
 * Una clip per volta: avviarne un'altra ferma la precedente.
 */

import { useEffect, useRef } from 'react';
import type { CampaignState, SoundClip } from '../types';
import { getMuted } from '../utils/audio';

export function useClipPlayer(
  clips: SoundClip[] | undefined,
  playback: CampaignState['clipPlayback'],
): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Ultimo avvio già eseguito: evita di rilanciare a ogni render. */
  const lastStartRef = useRef<number | null>(null);

  useEffect(() => {
    const stop = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    };

    if (!playback) {
      stop();
      lastStartRef.current = null;
      return;
    }

    // Già avviata: nessun motivo di ricominciare.
    if (lastStartRef.current === playback.startedAt) return;

    const clip = clips?.find((item) => item.id === playback.clipId);
    if (!clip) return;

    lastStartRef.current = playback.startedAt;

    // Chi ha silenziato l'app non deve sentire nulla, nemmeno le clip.
    if (getMuted()) return;

    stop();

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = clip.url;
    audio.volume = clip.volume;
    audio.currentTime = 0;
    // Un indirizzo può essere sbagliato o irraggiungibile: si resta in silenzio
    // invece di far esplodere una promise non gestita.
    void audio.play().catch(() => undefined);
  }, [clips, playback]);

  // Uscendo dalla schermata il suono non deve sopravvivere.
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );
}
