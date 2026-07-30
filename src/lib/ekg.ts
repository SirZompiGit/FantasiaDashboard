/**
 * Geometria e ritmo del design «Tracciato».
 *
 * L'idea è opposta a quella di tutte le altre barre: il livello NON si legge da
 * quanto è pieno qualcosa. La linea del tracciato resta sempre intera — un
 * elettrocardiogramma non si accorcia quando il paziente peggiora — e a cambiare
 * è la VELOCITÀ con cui la luce la percorre: rapida a pieni punti ferita, sempre
 * più lenta mentre scendono, ferma e piatta a zero. Il valore preciso lo dice una
 * piccola levetta che scorre lungo la traccia.
 *
 * Qui c'è solo il calcolo, senza React: le misure arrivano dal componente, che
 * osserva quanto spazio ha davvero.
 */

/**
 * Quanti pixel occupa un battito.
 *
 * Fisso, non proporzionale alla barra: su un elettrocardiogramma la carta scorre
 * a velocità costante, quindi i battiti hanno sempre la stessa larghezza e una
 * traccia lunga ne contiene semplicemente di più. Con un battito stirato a
 * riempire la barra, la stessa forma sarebbe irriconoscibile da una barra
 * all'altra.
 */
export const BEAT_PIXELS = 130;

/** Ampiezza minima e massima del picco, in pixel. */
export const MIN_AMPLITUDE = 3;
export const MAX_AMPLITUDE = 11;

/** Durata di una passata della luce: a pieni punti ferita e in agonia. */
export const SWEEP_FAST = 0.9;
export const SWEEP_SLOW = 5.4;

/**
 * Un battito, in coordinate normalizzate: `t` va da 0 a 1 lungo la traccia,
 * `a` è l'ampiezza da −1 (sotto la linea di base) a +1 (il picco).
 *
 * È la forma canonica di un elettrocardiogramma: una gobba bassa (P), il tuffo
 * prima del picco (Q), il picco alto e stretto (R), il contraccolpo sotto la
 * linea (S) e la gobba larga finale (T).
 */
const BEAT: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.16, 0],
  [0.22, 0.2], // P
  [0.28, 0],
  [0.34, 0],
  [0.38, -0.3], // Q
  [0.44, 1], // R
  [0.5, -0.65], // S
  [0.55, 0],
  [0.64, 0],
  [0.71, 0.32], // T
  [0.79, 0],
  [1, 0],
];

export interface Trace {
  /** Punti pronti per l'attributo `points` di una polilinea SVG. */
  points: string;
  /** Lunghezza percorsa, in pixel: regola i tratteggi della luce. */
  length: number;
  /** Quanti battiti ci stanno. */
  beats: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Costruisce la traccia nello spazio in PIXEL del contenitore.
 *
 * Niente `viewBox` stirato: le coordinate sono già quelle reali, così lo spessore
 * della linea non si deforma e — soprattutto — i tratteggi della luce misurano
 * quello che sembrano misurare. Con un sistema di coordinate stirato la luce
 * percorreva una frazione della traccia e ricominciava a metà.
 *
 * @param along  Lunghezza nel senso di marcia della traccia.
 * @param across Misura dell'altro asse: l'ampiezza ci sta dentro.
 * @param vertical Traccia che sale invece di correre da sinistra a destra.
 */
export function buildTrace(along: number, across: number, vertical = false): Trace {
  if (!(along > 0) || !(across > 0)) return { points: '', length: 0, beats: 0 };

  const beats = Math.max(1, Math.round(along / BEAT_PIXELS));
  const span = along / beats;
  const baseline = across / 2;
  const amplitude = Math.max(MIN_AMPLITUDE, Math.min(across / 2 - 1.5, MAX_AMPLITUDE));

  const points: [number, number][] = [];
  for (let beat = 0; beat < beats; beat++) {
    for (const [t, a] of BEAT) {
      // Il primo punto di un battito coincide con l'ultimo del precedente.
      if (beat > 0 && t === 0) continue;
      points.push([beat * span + t * span, baseline - a * amplitude]);
    }
  }

  // In verticale la traccia sale dal basso, quindi l'asse di marcia è invertito
  // e l'ampiezza sporge ai lati.
  const oriented: [number, number][] = points.map(([position, offset]) =>
    vertical ? [offset, along - position] : [position, offset],
  );

  let length = 0;
  for (let i = 1; i < oriented.length; i++) {
    length += Math.hypot(oriented[i][0] - oriented[i - 1][0], oriented[i][1] - oriented[i - 1][1]);
  }

  return {
    points: oriented.map(([x, y]) => `${round(x)},${round(y)}`).join(' '),
    length: round(length),
    beats,
  };
}

/**
 * Quanto dura una passata della luce, in secondi.
 *
 * Il valore è QUANTIZZATO in pochi gradini, e non è un dettaglio: trascinando la
 * levetta il rapporto cambia decine di volte al secondo, e cambiare la durata a
 * un'animazione già in corso la fa saltare avanti e indietro. A gradini la
 * durata resta ferma per buona parte del gesto, e il cambio di ritmo si legge
 * come un cambio di ritmo invece che come uno sfarfallio.
 */
export function sweepSeconds(ratio: number, steps = 8): number {
  const quantized = Math.round(clamp01(ratio) * steps) / steps;
  // Esponente sopra 1: la differenza si sente soprattutto quando la barra è
  // bassa, dove serve accorgersene.
  return round(SWEEP_FAST + (1 - quantized) ** 1.5 * (SWEEP_SLOW - SWEEP_FAST));
}

/**
 * Lunghezza del lampo di luce, in pixel: una frazione della traccia, mai così
 * corta da diventare un puntino su una barra larga.
 */
export function sweepDash(length: number): number {
  return Math.max(18, round(length * 0.14));
}
