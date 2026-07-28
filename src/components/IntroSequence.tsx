/**
 * Introduzione della piattaforma — "Oltre le nuvole".
 *
 * All'avvio non compaiono subito le tre scelte: c'è solo un invito a cliccare.
 * Quel clic non è una formalità, è l'unico modo per far partire l'audio: i
 * browser bloccano qualunque riproduzione automatica finché l'utente non
 * interagisce con la pagina. Da lì in poi anche gli effetti sonori dei dadi
 * (Web Audio) funzionano senza bisogno di un altro gesto.
 *
 * La scena: le nuvole si aprono su un cielo stellato, si spalanca un tunnel di
 * anelli ritagliati — stelle, creature, torri, vascelli che sfilano — e in
 * fondo arriva il marchio, che si rivela per intero sul culmine del brano. Poi,
 * mentre la musica sfuma, sparisce e lascia il posto alla schermata iniziale.
 *
 * I colori NON seguono il tema della campagna: l'introduzione ha una sua
 * palette notturna (blu, oro, corallo, crema) che non deve cambiare a seconda
 * del colore scelto per la dashboard.
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

/** Momento della rivelazione, in frazione del brano: l'ottavo dei quattordici. */
const REVEAL_RATIO = 0.571;

/** Anelli che compongono il tunnel e scie del cielo stellato. */
const RING_COUNT = 11;
const STREAK_COUNT = 44;

/**
 * Palette dell'introduzione: fissa, indipendente dal tema della campagna, e
 * volutamente ristretta a ciò che la piattaforma usa già — nero, blu notte,
 * oro (la tinta del marchio) e bianco. Qualunque altro colore stonerebbe con
 * la dashboard che si apre subito dopo.
 */
const INK = {
  night: '#0a1224',
  deep: '#16233f',
  blue: '#274064',
  goldDim: '#a97c2f',
  gold: '#e8b04b',
  white: '#f4f1e8',
} as const;

const RING_COLORS = [INK.deep, INK.gold, INK.blue, INK.white, INK.goldDim, INK.blue];

/**
 * Sagome che sfilano dentro gli anelli: sono ciò che racconta "qualunque luogo,
 * qualunque epoca" — una torre, un veliero, un drago, un viandante, un razzo.
 * Disegnate dentro un riquadro 24×24 e ridotte al volo.
 */
const FIGURES = [
  // Torre
  'M8 22V9l4-5 4 5v13h-3v-5h-2v5z',
  // Veliero
  'M12 3v12M12 5l6 3-6 3zM4 17h16l-2 4H6z',
  // Drago
  'M3 14c3-4 6-2 8-5 1 3 4 2 6 0 1 3-1 6-4 6l1 3-3-2-2 2-1-3c-2 0-4-1-5-1z',
  // Viandante
  'M12 3a2 2 0 110 4 2 2 0 010-4zM10 8h4l1 6h-2l-1 8h-2l-1-8H8z',
  // Razzo
  'M12 2c3 3 4 7 4 11l-2 3h-4l-2-3c0-4 1-8 4-11zM8 17l-3 4 4-1zM16 17l3 4-4-1z',
] as const;

/** Stella a cinque punte, per i decori sparsi negli anelli. */
const STAR =
  'M12 2l2.6 6.5L21 9.7l-4.8 4.3 1.4 6.6L12 17.3 6.4 20.6l1.4-6.6L3 9.7l6.4-1.2z';

/**
 * Profilo di un anello "ritagliato nella carta".
 *
 * Il raggio ondeggia lungo la circonferenza: ne esce un bordo mosso, come una
 * silhouette tagliata a mano, invece del cerchio perfetto che rendeva evidente
 * la ripetizione.
 */
function ringPath(radius: number, waves: number, amplitude: number): string {
  const steps = waves * 10;
  const points: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius + Math.sin(angle * waves) * amplitude;
    points.push(`${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`);
  }

  return `M${points.join('L')}Z`;
}

/**
 * Il tunnel.
 *
 * Ogni anello attraversa la scena UNA volta sola: niente cicli, che a occhio si
 * riconoscono subito. I ritardi crescono con una potenza e le durate calano, e
 * da lì nasce il crescendo — gli anelli si infittiscono e accelerano fino alla
 * rivelazione.
 */
function buildRings(durationMs: number) {
  const window = (durationMs * REVEAL_RATIO) / 1000;

  return Array.from({ length: RING_COUNT }, (_, index) => {
    const progress = index / RING_COUNT;
    const waves = 7 + (index % 4) * 3;

    return {
      path: ringPath(78, waves, index % 2 === 0 ? 6 : 3.5),
      color: RING_COLORS[index % RING_COLORS.length],
      width: index % 3 === 0 ? 14 : 9,
      spin: index % 2 === 0 ? 26 : -26,
      delay: window * Math.pow(progress, 1.55) - 0.6,
      duration: 3.4 - progress * 1.5,
      // Solo alcuni anelli portano decori: se li avessero tutti sarebbe caos.
      figure: index % 3 === 1 ? FIGURES[index % FIGURES.length] : null,
      stars: index % 2 === 0,
    };
  });
}

/**
 * Le scie del cielo stellato: bianche, sottili, in tutte le direzioni, come
 * quando ci si muove fra le stelle. Gli angoli avanzano di 137,5° — l'angolo
 * aureo — così non si allineano mai e non si riconosce alcun motivo.
 */
function buildStreaks(durationMs: number) {
  const window = (durationMs * REVEAL_RATIO) / 1000;

  return Array.from({ length: STREAK_COUNT }, (_, index) => {
    const progress = index / STREAK_COUNT;
    return {
      angle: (index * 137.5) % 360,
      delay: window * Math.pow(progress, 1.5),
      duration: 2.2 - progress * 1.1,
      // Lunghezze diverse: alcune sono vicine, altre lontanissime.
      length: 6 + ((index * 7) % 11),
    };
  });
}

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

  /** Ricalcolati solo se cambia la durata del brano. */
  const rings = useMemo(() => buildRings(duration), [duration]);
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
          <div className="intro-stars" />
          <div className="intro-stars intro-stars--far" />

          <div className="intro-tunnel">
            {rings.map((ring, index) => (
              <svg
                key={index}
                className="intro-ring"
                viewBox="-100 -100 200 200"
                aria-hidden
                style={
                  {
                    '--spin': `${ring.spin}deg`,
                    animationDelay: `${ring.delay}s`,
                    animationDuration: `${ring.duration}s`,
                  } as React.CSSProperties
                }
              >
                <path
                  d={ring.path}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={ring.width}
                  strokeLinejoin="round"
                />

                {ring.stars && (
                  <>
                    <path d={STAR} fill={INK.gold} transform="translate(-88 -12) scale(0.7)" />
                    <path d={STAR} fill={INK.white} transform="translate(58 62) scale(0.5)" />
                    <path d={STAR} fill={INK.gold} transform="translate(52 -84) scale(0.6)" />
                  </>
                )}

                {ring.figure && (
                  <path
                    d={ring.figure}
                    fill={INK.white}
                    transform="translate(-74 44) scale(1.5)"
                    opacity={0.9}
                  />
                )}
              </svg>
            ))}
          </div>

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

          <img src="/logo-fantasia.png" alt="Fantasia" className="intro-logo" draggable={false} />

          <div className="intro-flash" />

          {/* Le nuvole stanno sopra tutto: si aprono e scoprono la scena. */}
          <div className="intro-cloud intro-cloud--left" />
          <div className="intro-cloud intro-cloud--right" />
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
