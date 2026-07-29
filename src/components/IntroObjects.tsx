/**
 * Sagome che si incontrano durante il viaggio dell'introduzione.
 *
 * Cinque presenze — un corpo celeste, un meccanismo del tempo, un luogo, una
 * pietra, una soglia — a dire "qualunque epoca, qualunque mondo". Passano di
 * LATO: al centro deve restare libero il posto del marchio.
 *
 * Sono volutamente marginali: contorni sottili, tinte spente, opacità bassa.
 * Devono farsi notare con la coda dell'occhio, non contendere la scena al
 * cielo stellato.
 *
 * Ognuna fa tre movimenti insieme, su tre livelli distinti — e devono restare
 * distinti, perché il `transform` non si somma sullo stesso elemento:
 *
 *   contenitore  la traiettoria: si allontana dal centro e ingrandisce
 *   fluttuazione l'ondeggiare, come un relitto alla deriva
 *   disegno      la rotazione su sé stesso, continua
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
 * quasi al centro e scivola verso quell'angolo mentre cresce. `at` è quando
 * entra, in frazione del brano; `turn` quanto ruota in un giro completo (il
 * segno decide il verso) e `spin`/`float` i tempi dei due movimenti propri.
 *
 * Gli ingressi sono ravvicinati: ce ne sono sempre due in scena, così il
 * viaggio è popolato invece che scandito da apparizioni isolate. L'ultima esce
 * al settimo secondo — dove il cielo comincia a frenare — perché a quel punto
 * il campo dev'essere già sgombro.
 */
const OBJECTS = [
  { art: 'planet', dx: -0.87, dy: -0.5, at: 0.02, turn: 360, spin: 52, float: 7 },
  { art: 'pyramids', dx: 0.88, dy: 0.47, at: 0.1, turn: -360, spin: 64, float: 8.5 },
  { art: 'astrolabe', dx: 0.9, dy: -0.44, at: 0.18, turn: 360, spin: 38, float: 6.5 },
  { art: 'crystal', dx: -0.55, dy: 0.84, at: 0.26, turn: -360, spin: 44, float: 5.5 },
  { art: 'gate', dx: -0.93, dy: 0.36, at: 0.34, turn: 360, spin: 58, float: 7.5 },
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

/** Piramidi: tre moli sulla sabbia, con lo spigolo in luce. */
function Pyramids() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="intro-object-art">
      {/* Quella dietro, più piccola e più tenue: dà profondità. */}
      <path d="M74 40 96 82H52Z" fill={BODY} stroke={GOLD_SOFT} strokeWidth="1.2" />
      <path d="M74 40V82" stroke={GOLD_SOFT} strokeWidth="0.9" />

      {/* La grande in primo piano. */}
      <path d="M38 14 82 82H-0Z" fill={BODY} stroke={GOLD} strokeWidth="1.4" />
      <path d="M38 14V82" stroke={GOLD} strokeWidth="1.1" />
      {/* La faccia in ombra, appena accennata. */}
      <path d="M38 14 82 82H38Z" fill="rgb(10 18 36 / 0.4)" stroke="none" />

      {/* Linea della sabbia. */}
      <line x1="2" y1="82" x2="98" y2="82" stroke={GOLD_SOFT} strokeWidth="1" />
    </svg>
  );
}

/** Cristallo: gemma sfaccettata, tutta spigoli. */
function Crystal() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="intro-object-art">
      <path d="M50 4 76 34 64 92H36L24 34Z" fill={BODY} stroke={GOLD} strokeWidth="1.4" />
      {/* Le facce: tre tagli soli, di più a distanza diventano rumore. */}
      <path d="M24 34h52" stroke={GOLD_SOFT} strokeWidth="1" />
      <path d="M50 4v88" stroke={GOLD_SOFT} strokeWidth="1" />
      <path d="M36 92 50 34l14 58" fill="none" stroke={GOLD_SOFT} strokeWidth="0.9" />
      {/* Un lampo di luce su una faccia. */}
      <path d="M50 12 68 33 50 33Z" fill="rgb(232 176 75 / 0.16)" stroke="none" />
    </svg>
  );
}

/** Soglia: un arco su due pilastri, come un portale abbandonato nel vuoto. */
function Gate() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="intro-object-art">
      <path
        d="M18 90V46a32 32 0 0 1 64 0v44"
        fill={BODY}
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Il vuoto dentro l'arco: è ciò che lo rende una soglia e non un blocco. */}
      <path d="M32 90V47a18 18 0 0 1 36 0v43" fill="rgb(4 8 18 / 0.5)" stroke={GOLD_SOFT} strokeWidth="1" />
      {/* Basamento e chiave di volta. */}
      <line x1="10" y1="90" x2="90" y2="90" stroke={GOLD} strokeWidth="1.6" />
      <circle cx="50" cy="30" r="3" fill="none" stroke={PALE} strokeWidth="1.2" />
    </svg>
  );
}

const ART = {
  planet: Planet,
  astrolabe: Astrolabe,
  pyramids: Pyramids,
  crystal: Crystal,
  gate: Gate,
};

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
                animationDelay: `${total * object.at}s`,
                animationDuration: `${total * SPAN}s`,
              } as React.CSSProperties
            }
          >
            <div
              className="intro-object-float"
              style={{ animationDuration: `${object.float}s` } as React.CSSProperties}
            >
              <div
                className="intro-object-spin"
                style={
                  {
                    '--turn': `${object.turn}deg`,
                    animationDuration: `${object.spin}s`,
                  } as React.CSSProperties
                }
              >
                <Art />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
