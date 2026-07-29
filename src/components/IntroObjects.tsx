/**
 * Sagome che si incontrano durante il viaggio dell'introduzione.
 *
 * Una per registro — il meccanismo del tempo, il corpo celeste, il luogo — a
 * dire "qualunque epoca, qualunque mondo". Sono soltanto tre e passano di
 * LATO: al centro deve restare libero il posto del marchio.
 *
 * Sono volutamente marginali: contorni sottili, tinte spente, opacità bassa.
 * Devono farsi notare con la coda dell'occhio, non contendere la scena al
 * cielo stellato.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * PER TOGLIERLE: basta eliminare la riga `<IntroObjects …/>` in
 * IntroSequence.tsx. Questo file e il blocco "Sagome del viaggio" in index.css
 * restano inerti e si possono cancellare con calma. Nient'altro le richiama.
 * ────────────────────────────────────────────────────────────────────────────
 */

/**
 * Palette volutamente smorzata, dentro le tinte dell'introduzione: oro spento e
 * un azzurro polvere. Niente colori pieni — a piena intensità rubavano
 * l'attenzione al marchio, che è l'unica cosa che deve brillare.
 */
const GOLD = 'rgb(232 176 75 / 0.55)';
const GOLD_SOFT = 'rgb(232 176 75 / 0.3)';
const PALE = 'rgb(200 214 235 / 0.4)';
const BODY = 'rgb(10 18 36 / 0.55)';

/**
 * `dx`/`dy` sono la direzione di fuga (un versore): la sagoma nasce minuscola
 * quasi al centro e scivola verso quell'angolo mentre cresce, finché non esce
 * di scena. `at` è quando entra, in frazione del brano.
 *
 * Tutte si esauriscono entro il settimo secondo — dove il cielo comincia a
 * frenare — perché a quel punto il campo dev'essere già sgombro.
 */
const OBJECTS = [
  { art: 'planet', dx: -0.86, dy: -0.5, at: 0.03, spin: 34 },
  { art: 'astrolabe', dx: 0.9, dy: -0.4, at: 0.17, spin: -22 },
  { art: 'castle', dx: -0.6, dy: 0.8, at: 0.31, spin: 14 },
] as const;

/** Quanto dura il passaggio di una sagoma, in frazione del brano. */
const SPAN = 0.16;

/** Pianeta con anello: due archi e qualche cratere, nulla di fragile. */
function Planet() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="intro-object-art">
      <circle cx="50" cy="50" r="25" fill={BODY} stroke={GOLD} strokeWidth="1.4" />
      <circle cx="41" cy="42" r="5" fill="none" stroke={GOLD_SOFT} strokeWidth="1" />
      <circle cx="58" cy="58" r="3.4" fill="none" stroke={GOLD_SOFT} strokeWidth="1" />
      <ellipse
        cx="50"
        cy="50"
        rx="46"
        ry="13"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.4"
        transform="rotate(-20 50 50)"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="10"
        fill="none"
        stroke={GOLD_SOFT}
        strokeWidth="1"
        transform="rotate(-20 50 50)"
      />
    </svg>
  );
}

/** Astrolabio: anelli concentrici, tacche e due lancette. */
function Astrolabe() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="intro-object-art">
      <circle cx="50" cy="50" r="46" fill={BODY} stroke={GOLD} strokeWidth="1.4" />
      <circle cx="50" cy="50" r="34" fill="none" stroke={GOLD_SOFT} strokeWidth="1" />
      <circle cx="50" cy="50" r="19" fill="none" stroke={GOLD_SOFT} strokeWidth="1" />

      {/* Dodici tacche sul bordo, come le ore. */}
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="6"
          x2="50"
          y2={i % 3 === 0 ? 15 : 11}
          stroke={GOLD}
          strokeWidth={i % 3 === 0 ? 1.6 : 1}
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}

      <line x1="50" y1="50" x2="50" y2="24" stroke={PALE} strokeWidth="1.8" />
      <line x1="50" y1="50" x2="67" y2="59" stroke={PALE} strokeWidth="1.4" />
      <circle cx="50" cy="50" r="2.4" fill={GOLD} />
    </svg>
  );
}

/** Castello: silhouette di torri merlate, senza dettagli che a distanza spariscono. */
function Castle() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="intro-object-art">
      <path
        d="M12 92V44h5v-7h6v7h5V32h7v-7h6v7h7v12h6V32h7v-7h6v7h7v12h5v-7h6v7h5v48Z"
        fill={BODY}
        stroke={GOLD}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Il portone e due feritoie: quanto basta perché si legga "castello". */}
      <path d="M44 92V72a6 6 0 0 1 12 0v20Z" fill="none" stroke={GOLD_SOFT} strokeWidth="1.1" />
      <line x1="27" y1="58" x2="27" y2="66" stroke={GOLD_SOFT} strokeWidth="1.6" />
      <line x1="73" y1="58" x2="73" y2="66" stroke={GOLD_SOFT} strokeWidth="1.6" />
    </svg>
  );
}

const ART = { planet: Planet, astrolabe: Astrolabe, castle: Castle };

interface IntroObjectsProps {
  /** Durata del brano in millisecondi: i tempi si ricavano da qui. */
  duration: number;
}

export function IntroObjects({ duration }: IntroObjectsProps) {
  const total = duration / 1000;

  return (
    <>
      {OBJECTS.map((object) => {
        const Art = ART[object.art];

        return (
          <div
            key={object.art}
            className="intro-object"
            style={
              {
                '--dx': object.dx,
                '--dy': object.dy,
                '--spin': `${object.spin}deg`,
                animationDelay: `${total * object.at}s`,
                animationDuration: `${total * SPAN}s`,
              } as React.CSSProperties
            }
          >
            <Art />
          </div>
        );
      })}
    </>
  );
}
