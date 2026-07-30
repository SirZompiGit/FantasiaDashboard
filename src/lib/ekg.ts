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
 * I battiti, in coordinate normalizzate: `t` va da 0 a 1 dentro lo spazio del
 * battito, `a` è l'ampiezza da −1 (sotto la linea di base) a +1 (il picco).
 *
 * Tre forme e non una: la stessa sagoma ripetuta a stampino si riconosceva come
 * un motivo grafico, non come un tracciato. Restano tutte della stessa famiglia
 * — gobba bassa (P), tuffo (Q), picco stretto (R), contraccolpo (S), gobba larga
 * finale (T) — ma un battito è pieno, uno più ampio e uno debole.
 */
const NORMALE: readonly (readonly [number, number])[] = [
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

/** Battito ampio: tuffo più profondo e gobba finale larga. */
const AMPIO: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.14, 0],
  [0.2, 0.26],
  [0.27, 0],
  [0.33, 0],
  [0.37, -0.34],
  [0.43, 1],
  [0.49, -0.78],
  [0.56, 0],
  [0.66, 0],
  [0.75, 0.42],
  [0.86, 0],
  [1, 0],
];

/** Battito debole: nessuna gobba iniziale e picco a metà altezza. */
const DEBOLE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.3, 0],
  [0.36, -0.16],
  [0.42, 0.52],
  [0.47, -0.34],
  [0.53, 0],
  [0.63, 0],
  [0.69, 0.18],
  [0.76, 0],
  [1, 0],
];

const SHAPES = [NORMALE, AMPIO, NORMALE, DEBOLE, AMPIO, NORMALE] as const;

/**
 * Rumore ripetibile fra 0 e 1.
 *
 * Deve essere deterministico: con `Math.random` la traccia cambierebbe forma a
 * ogni ridisegno — quindi a ogni punto ferita tolto — e il tracciato sembrerebbe
 * riscritto invece che percorso.
 */
function noise(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

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

  // Capo iniziale sulla linea di base: qualunque battito parta più avanti, la
  // traccia comincia comunque dal bordo.
  const points: [number, number][] = [[0, baseline]];

  for (let beat = 0; beat < beats; beat++) {
    const shape = SHAPES[Math.floor(noise(beat, 1) * SHAPES.length) % SHAPES.length];
    /**
     * Forza del battito. Mai sopra 1: l'ampiezza disponibile è calcolata sul
     * picco pieno, e un guadagno maggiore lo farebbe sporgere dalla traccia.
     */
    const gain = 0.72 + noise(beat, 2) * 0.28;
    /**
     * Ritardo dentro il proprio spazio, compresso e non traslato: i picchi non
     * cadono più a intervalli esatti — un cuore non è un metronomo — ma il
     * battito resta dentro i suoi confini.
     */
    const delay = noise(beat, 3) * 0.12;

    for (const [t, a] of shape) {
      const position = (beat + delay + t * (1 - delay)) * span;
      // Sulla linea di base un filo di tremolio, come su un tracciato vero:
      // perfettamente piatta si riconosceva come un disegno.
      const value =
        a === 0 ? (noise(beat * 37 + t * 100, 4) - 0.5) * 0.08 : a * gain;
      points.push([position, baseline - value * amplitude]);
    }
  }

  points.push([along, baseline]);

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
 * Lunghezza minima del lampo, in pixel.
 *
 * Sotto questa misura, su una barra stretta, la luce non rivela un battito ma un
 * frammento di battito: il tracciato non si legge più.
 */
export const MIN_DASH = 40;

/**
 * Lunghezza del nucleo luminoso, in pixel: circa un battito, così a ogni
 * istante si vede una forma intera e non un pezzo di linea.
 */
export function sweepDash(length: number): number {
  return Math.max(MIN_DASH, round(length * 0.2));
}

/**
 * Quanto è più lungo l'alone rispetto al nucleo.
 *
 * L'alone è la stessa luce, più larga e più tenue, centrata sul nucleo: sporge
 * davanti e dietro, ed è ciò che fa sfumare le due estremità del lampo invece di
 * troncarle di netto.
 */
export const HALO_FACTOR = 2;

/**
 * Estremi dell'animazione del tratteggio, in pixel.
 *
 * Il lampo entra da fuori e esce dall'altro capo — il giro si chiude senza che
 * appaia già a metà strada — e l'alone è spostato di mezza differenza, così
 * resta centrato sul nucleo per tutta la corsa invece di seguirlo.
 */
export function sweepRange(length: number, dash: number, centered = false): [number, number] {
  const shift = centered ? (dash * HALO_FACTOR - dash) / 2 : 0;
  return [round(dash + shift), round(-length + shift)];
}
