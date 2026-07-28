/**
 * Introduzione della piattaforma — "Vortice temporale".
 *
 * All'avvio non compaiono subito le tre scelte: c'è solo un invito a cliccare.
 * Quel clic non è una formalità, è l'unico modo per far partire l'audio: i
 * browser bloccano qualunque riproduzione automatica finché l'utente non
 * interagisce con la pagina. Da lì in poi anche gli effetti sonori dei dadi
 * (Web Audio) funzionano senza bisogno di un altro gesto.
 *
 * Al clic partono INSIEME il tema principale e l'animazione: il marchio arriva
 * dal fondo di un tunnel di anelli e si rivela per intero all'ottavo secondo,
 * sul culmine del brano. A quattordici secondi la scena sfuma e lascia il posto
 * alla schermata iniziale.
 *
 * Le durate qui e i keyframes `intro-*` in index.css devono restare allineati.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getMuted } from '../utils/audio';

/**
 * Durata attesa del brano. È solo il valore di partenza: appena i metadati
 * dell'audio sono pronti si adotta la durata REALE del file, che viene passata
 * al CSS come `--intro-duration`. Così, se un domani il tema principale viene
 * sostituito con uno più lungo o più corto, l'animazione resta agganciata alla
 * musica — la rivelazione del marchio cade sempre allo stesso punto del brano.
 */
const INTRO_DURATION = 14000;

/**
 * Rete di sicurezza: se l'evento `ended` non arriva — audio in muto, file non
 * caricato, riproduzione rifiutata — l'intro finisce comunque da sé.
 */
const SAFETY_MARGIN = 400;

/** Dissolvenza d'uscita, uguale alla transizione di `.intro-scene`. */
const FADE_OUT = 500;

/** Passo della dissolvenza del volume, quando si salta a musica avviata. */
const VOLUME_FADE_STEP = 40;

interface IntroSequenceProps {
  /** Chiamata a intro conclusa o saltata: scopre la schermata iniziale. */
  onFinish: () => void;
}

export function IntroSequence({ onFinish }: IntroSequenceProps) {
  const [phase, setPhase] = useState<'prompt' | 'playing'>('prompt');
  const [leaving, setLeaving] = useState(false);
  const [duration, setDuration] = useState(INTRO_DURATION);

  const audioRef = useRef<HTMLAudioElement>(null);
  const timersRef = useRef<number[]>([]);
  const fadeRef = useRef<number | null>(null);
  /** L'uscita può essere innescata da più parti: deve valere una volta sola. */
  const finishedRef = useRef(false);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, delay);
    timersRef.current.push(id);
  }, []);

  /** Spegne la musica dolcemente: un taglio netto si sente. */
  const fadeOutAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;

    fadeRef.current = window.setInterval(() => {
      if (!audioRef.current) return;
      const next = audioRef.current.volume - 0.08;
      if (next <= 0) {
        audioRef.current.volume = 0;
        audioRef.current.pause();
        if (fadeRef.current !== null) window.clearInterval(fadeRef.current);
        fadeRef.current = null;
      } else {
        audioRef.current.volume = next;
      }
    }, VOLUME_FADE_STEP);
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    fadeOutAudio();
    setLeaving(true);
    schedule(onFinish, FADE_OUT);
  }, [fadeOutAudio, onFinish, schedule]);

  const start = useCallback(() => {
    if (phase !== 'prompt') return;
    setPhase('playing');

    const audio = audioRef.current;
    // Con l'audio in muto l'introduzione resta muta, ma si vede lo stesso.
    if (audio && !getMuted()) {
      audio.volume = 0.85;
      // `play()` può essere rifiutata (permessi, file assente): l'animazione
      // prosegue comunque e a chiudere ci pensa il timer di sicurezza.
      void audio.play().catch(() => undefined);
    }

    schedule(finish, duration + SAFETY_MARGIN);
  }, [duration, finish, phase, schedule]);

  /**
   * Durata reale del brano, letta dai metadati. Arriva prima del clic (il file
   * è in `preload`), quindi l'animazione parte già con il tempo giusto e non
   * subisce riallineamenti a metà corsa.
   */
  const handleMetadata = useCallback(() => {
    const value = audioRef.current?.duration;
    if (typeof value === 'number' && Number.isFinite(value) && value > 1) {
      setDuration(value * 1000);
    }
  }, []);

  // Esc salta in qualunque momento, come il pulsante.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finish]);

  // Allo smontaggio non devono restare né timer né musica in riproduzione.
  useEffect(
    () => () => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
      if (fadeRef.current !== null) window.clearInterval(fadeRef.current);
      audioRef.current?.pause();
    },
    [],
  );

  return (
    <div
      className={`intro-scene ${leaving ? 'is-leaving' : ''}`}
      // Le animazioni CSS leggono da qui quanto devono durare.
      style={{ '--intro-duration': `${duration}ms` } as React.CSSProperties}
    >
      <audio
        ref={audioRef}
        src="/main_music.mp3"
        preload="auto"
        onLoadedMetadata={handleMetadata}
        onEnded={finish}
      />

      {phase === 'playing' && (
        <>
          <div className="intro-stars" />
          <div className="intro-stars intro-stars--far" />

          <div className="intro-vortex">
            {/* Gli scarti di partenza distribuiscono gli anelli lungo il
                tunnel: senza, arriverebbero tutti insieme a ondate. */}
            {[0, 1, 2, 3, 4].map((index) => (
              <span
                key={index}
                className="intro-ring"
                style={{ animationDelay: `${index * 0.56}s` }}
              />
            ))}
          </div>

          <div className="intro-spark" />

          <img src="/logo-fantasia.png" alt="Fantasia" className="intro-logo" draggable={false} />

          <div className="intro-shock" />
          <div className="intro-flash" />
        </>
      )}

      {phase === 'prompt' && (
        <button
          type="button"
          onClick={start}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-transparent"
        >
          <span className="intro-prompt-text font-display text-sm font-bold uppercase tracking-[0.4em] text-slate-300 sm:text-base">
            Clicca per continuare
          </span>
        </button>
      )}

      {/* Fratello del riquadro cliccabile, non figlio: i pulsanti non si
          annidano, e così il salto non fa partire anche l'introduzione. */}
      <button
        type="button"
        onClick={finish}
        className="absolute right-4 bottom-4 z-10 cursor-pointer rounded-full border border-slate-700 bg-black/50 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-sm transition-colors duration-200 hover:border-slate-500 hover:text-slate-100 sm:right-6 sm:bottom-6"
      >
        Salta
      </button>
    </div>
  );
}
