/**
 * Introduzione della piattaforma — il marchio che si accende.
 *
 * All'avvio non compaiono subito le tre scelte: c'è solo un invito a cliccare.
 * Quel clic non è una formalità, è l'unico modo per far partire l'audio: i
 * browser bloccano qualunque riproduzione automatica finché l'utente non
 * interagisce con la pagina. Da lì in poi anche gli effetti sonori dei dadi
 * (Web Audio) funzionano senza bisogno di un altro gesto.
 *
 * La scena è volutamente essenziale: si avanza dentro un cielo stellato e del
 * marchio non c'è traccia. Al NONO secondo l'avanzamento si ferma e il marchio
 * appare di colpo, brillando fortissimo; poi la luce cala fino al tredicesimo e
 * da lì marchio e bagliore si dissolvono insieme alla musica.
 *
 * Niente tunnel, anelli, figure, nuvole o scie: tutti provati e tutti tolti,
 * perché distraevano dall'unica cosa che conta — il marchio che appare al
 * momento giusto.
 *
 * I colori NON seguono il tema della campagna: l'introduzione resta su nero,
 * blu notte, oro e bianco, le tinte della piattaforma.
 *
 * Le durate qui e i keyframes `intro-*` in index.css devono restare allineati.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMuted } from '../utils/audio';

/**
 * Durata attesa del brano. È solo il valore di partenza: appena i metadati
 * dell'audio sono pronti si adotta la durata REALE del file, che viene passata
 * al CSS come `--intro-duration`. Così, se un domani il tema principale viene
 * sostituito con uno più lungo o più corto, l'animazione resta agganciata alla
 * musica — il picco di luce cade sempre sullo stesso punto del brano.
 */
const INTRO_DURATION = 14000;

/**
 * Rete di sicurezza: se l'evento `ended` non arriva — audio in muto, file non
 * caricato, riproduzione rifiutata — l'intro finisce comunque da sé.
 */
const SAFETY_MARGIN = 400;

/** Dissolvenza d'uscita, uguale alla transizione di `.intro-scene`. */
const FADE_OUT = 500;

/** Quante scie attraversano il campo stellare. Poche: sono un accento. */
const STREAK_COUNT = 14;


/**
 * Le scie del viaggio.
 *
 * Poche e sparse, giusto per dare il senso della corsa. Partono già in moto
 * (ritardi negativi) e l'ultima si esaurisce PRIMA che il cielo cominci a
 * rallentare, al settimo secondo: vedere scie sfrecciare mentre tutto frena
 * sarebbe una contraddizione.
 *
 * Gli angoli avanzano di 137,5° — l'angolo aureo — così non si allineano mai
 * fra loro e non si riconosce alcun motivo che si ripete.
 */
function buildStreaks(durationMs: number) {
  const total = durationMs / 1000;
  /** Settimo secondo: da qui il cielo comincia a frenare. */
  const brakeAt = total * 0.5;
  /** Di quanto la prima scia è già in viaggio quando la scena appare. */
  const headStart = 1.8;

  return Array.from({ length: STREAK_COUNT }, (_, index) => {
    // Su STREAK_COUNT - 1 e non su STREAK_COUNT: così l'ultima scia ha davvero
    // progresso 1 e cade sul punto calcolato, invece di fermarsi un passo prima.
    const progress = index / (STREAK_COUNT - 1);
    const duration = 1.9 - progress * 0.5;

    /**
     * L'ultima scia deve ESAURIRSI al settimo secondo, non partire allora: il
     * suo ritardo si calcola quindi a ritroso dalla propria durata. Prima le
     * partenze si fermavano al 45% del brano e con la corsa della scia il tutto
     * finiva già intorno al quinto secondo, lasciando due secondi di cielo
     * immobile prima della frenata.
     */
    const lastDelay = brakeAt - duration;

    return {
      angle: (index * 137.5) % 360,
      delay: -headStart + (lastDelay + headStart) * progress,
      duration,
      length: 7 + ((index * 5) % 9),
    };
  });
}

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

  /** Ricalcolate solo se cambia la durata del brano. */
  const streaks = useMemo(() => buildStreaks(duration), [duration]);

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
          {/* Il cielo: otto piani di profondità, dal pulviscolo remoto alle
              stelle che sfrecciano addosso. Più piani ci sono, più il viaggio è
              continuo e più si legge la velocità — con pochi restavano vuoti
              fra un piano e l'altro, e il moto sembrava lento. */}
          <div className="intro-stars intro-stars--veil" />
          <div className="intro-stars intro-stars--deep" />
          <div className="intro-stars intro-stars--far" />
          <div className="intro-stars intro-stars--haze" />
          <div className="intro-stars intro-stars--mid" />
          <div className="intro-stars intro-stars--near" />
          <div className="intro-stars intro-stars--rush" />
          <div className="intro-stars intro-stars--blur" />

          {/* Piani che ciclano: riportano stelle nuove al centro mentre gli
              altri si allargano e svuotano l'inquadratura. */}
          <div className="intro-cycle"><div className="intro-cycle-inner" /></div>
          <div className="intro-cycle intro-cycle--b"><div className="intro-cycle-inner" /></div>
          <div className="intro-cycle intro-cycle--c"><div className="intro-cycle-inner" /></div>

          {streaks.map((streak, index) => (
            <span
              key={index}
              className="intro-streak"
              style={
                {
                  '--a': `${streak.angle}deg`,
                  '--len': `${streak.length}vmin`,
                  animationDelay: `${streak.delay}s`,
                  animationDuration: `${streak.duration}s`,
                } as React.CSSProperties
              }
            />
          ))}

          {/* L'alone che accompagna l'accensione del marchio. */}
          <div className="intro-glow" />

          <img src="/logo-fantasia.png" alt="Fantasia" className="intro-logo" draggable={false} />
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
        className="absolute right-4 bottom-4 z-20 cursor-pointer rounded-full border border-slate-700 bg-black/50 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-sm transition-colors duration-200 hover:border-slate-500 hover:text-slate-100 sm:right-6 sm:bottom-6"
      >
        Salta
      </button>
    </div>
  );
}
