import { describe, expect, it } from 'vitest';
import {
  BEAT_PIXELS,
  HEAD_DASH,
  MAX_AMPLITUDE,
  MIN_AMPLITUDE,
  MIN_TRAIL,
  SWEEP_FAST,
  SWEEP_SLOW,
  SWEEP_BASE,
  TRAIL_LAYERS,
  buildSweep,
  buildTrace,
  sweepRate,
  sweepSeconds,
  trailLength,
} from './ekg';

/** Coppie di numeri dalla stringa `points` di una polilinea. */
const parse = (points: string) =>
  points
    .split(' ')
    .filter(Boolean)
    .map((pair) => pair.split(',').map(Number) as [number, number]);

describe('geometria del tracciato', () => {
  it('parte da un capo e arriva all altro, sempre intera', () => {
    const points = parse(buildTrace(400, 24).points);

    expect(points[0][0]).toBe(0);
    expect(points.at(-1)?.[0]).toBe(400);
  });

  /**
   * Il battito ha una larghezza fissa: su una traccia lunga ce ne stanno più di
   * uno, non uno stirato. Stirandolo, la stessa forma sarebbe irriconoscibile da
   * una barra all'altra.
   */
  it('ripete il battito invece di allungarlo', () => {
    expect(buildTrace(BEAT_PIXELS, 24).beats).toBe(1);
    expect(buildTrace(BEAT_PIXELS * 4, 24).beats).toBe(4);
    // Anche una traccia cortissima ne contiene almeno uno.
    expect(buildTrace(20, 24).beats).toBe(1);
  });

  /**
   * La stessa sagoma ripetuta a stampino si riconosceva come un motivo grafico,
   * non come un tracciato: i battiti devono essere diversi fra loro.
   */
  it('non ripete lo stesso battito', () => {
    const along = BEAT_PIXELS * 8;
    const trace = buildTrace(along, 24);
    const span = along / trace.beats;
    const points = parse(trace.points);

    // Punto più alto di ogni battito (in SVG la y cresce verso il basso).
    const peaks = trace.beats
      ? Array.from({ length: trace.beats }, (_, beat) => {
          const ys = points
            .filter(([x]) => x >= beat * span && x < (beat + 1) * span)
            .map(([, y]) => y);
          return Math.round(Math.min(...ys));
        })
      : [];

    expect(peaks).toHaveLength(8);
    expect(new Set(peaks).size).toBeGreaterThan(2);
  });

  /**
   * La varietà è pseudo-casuale ma RIPETIBILE: con un rumore vero la traccia
   * cambierebbe forma a ogni ridisegno — quindi a ogni punto ferita tolto — e
   * sembrerebbe riscritta invece che percorsa.
   */
  it('si ridisegna sempre identica', () => {
    expect(buildTrace(520, 24).points).toBe(buildTrace(520, 24).points);
    expect(buildTrace(520, 24, true).points).toBe(buildTrace(520, 24, true).points);
  });

  it('sta dentro l altezza che ha, senza sporgere', () => {
    for (const across of [10, 14, 24, 40]) {
      const ys = parse(buildTrace(300, across).points).map(([, y]) => y);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...ys)).toBeLessThanOrEqual(across);
    }
  });

  it('usa tutta l ampiezza disponibile, entro i limiti dichiarati', () => {
    const baseline = 24 / 2;
    const ys = parse(buildTrace(300, 24).points).map(([, y]) => y);
    const peak = baseline - Math.min(...ys);

    expect(peak).toBeGreaterThanOrEqual(MIN_AMPLITUDE);
    expect(peak).toBeLessThanOrEqual(MAX_AMPLITUDE);
  });

  /** In verticale la traccia sale: il primo punto sta in basso. */
  it('in verticale corre dal basso verso l alto', () => {
    const points = parse(buildTrace(300, 24, true).points);

    expect(points[0][1]).toBe(300);
    expect(points.at(-1)?.[1]).toBe(0);
    // L'ampiezza sporge ai lati, quindi resta dentro la larghezza.
    for (const [x] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(24);
    }
  });

  /**
   * La lunghezza regola i tratteggi della luce: se fosse più corta della strada
   * reale, il lampo ricomincerebbe a metà traccia.
   */
  it('misura una lunghezza almeno pari alla distanza fra i due capi', () => {
    const trace = buildTrace(400, 24);
    expect(trace.length).toBeGreaterThan(400);
  });

  it('non produce nulla senza spazio, invece di calcolare su misure assurde', () => {
    for (const [along, across] of [
      [0, 24],
      [300, 0],
      [-10, 24],
      [Number.NaN, 24],
    ]) {
      const trace = buildTrace(along, across);
      expect(trace.points).toBe('');
      expect(trace.length).toBe(0);
    }
  });
});

describe('ritmo della luce', () => {
  it('è rapida a piena vita e lentissima in agonia', () => {
    expect(sweepSeconds(1)).toBe(SWEEP_FAST);
    expect(sweepSeconds(0)).toBe(SWEEP_SLOW);
  });

  it('rallenta senza tornare indietro, mai fuori dai due estremi', () => {
    let previous = 0;
    for (let ratio = 1; ratio >= 0; ratio -= 0.05) {
      const seconds = sweepSeconds(ratio);
      expect(seconds).toBeGreaterThanOrEqual(SWEEP_FAST);
      expect(seconds).toBeLessThanOrEqual(SWEEP_SLOW);
      // Scendendo, la durata cresce (o resta ferma dentro un gradino).
      expect(seconds).toBeGreaterThanOrEqual(previous);
      previous = seconds;
    }
  });

  /**
   * La quantizzazione non è un dettaglio: trascinando la levetta il rapporto
   * cambia decine di volte al secondo, e cambiare la durata a un'animazione in
   * corso la fa saltare. A gradini la durata resta ferma per buona parte del
   * gesto.
   */
  it('procede a gradini, non a ogni singolo punto ferita', () => {
    const durations = new Set<number>();
    for (let value = 0; value <= 100; value++) durations.add(sweepSeconds(value / 100));
    // Nove valori possibili con otto gradini, non centouno.
    expect(durations.size).toBeLessThanOrEqual(9);
  });

  /**
   * La durata nel CSS è fissa: a cambiare è il passo. Cambiare la durata a
   * un'animazione in corso ne sposta il fotogramma, e la scia saltava a ogni
   * punto ferita tolto.
   */
  it('il passo corrisponde alla durata voluta', () => {
    for (const ratio of [0, 0.25, 0.5, 1]) {
      expect(sweepRate(ratio) * sweepSeconds(ratio)).toBeCloseTo(SWEEP_BASE, 1);
    }
    // A piena vita corre più che in agonia.
    expect(sweepRate(1)).toBeGreaterThan(sweepRate(0));
  });

  /**
   * Il rallentamento deve leggersi come un ritmo che cala, non come
   * un'animazione inceppata: sotto soglia la passata resta di pochi secondi.
   */
  it('non rallenta fino a sembrare ferma', () => {
    expect(sweepSeconds(0)).toBeLessThanOrEqual(3);
    expect(sweepSeconds(0.25)).toBeLessThan(2.5);
  });

  it('la scia resta leggibile anche su una traccia corta', () => {
    expect(trailLength(60)).toBeGreaterThanOrEqual(MIN_TRAIL);
    // Su una traccia lunga cresce con lei, invece di restare un trattino.
    expect(trailLength(1000)).toBeGreaterThan(trailLength(400));
  });
});

describe('scia della luce', () => {
  const sweep = buildSweep(600);

  it('è fatta di più strati, con la punta disegnata per ultima', () => {
    expect(sweep).toHaveLength(TRAIL_LAYERS);
    expect(sweep.filter((layer) => layer.head)).toHaveLength(1);
    // In SVG chi disegna per ultimo sta davanti: la punta è l'ultima.
    expect(sweep.at(-1)?.head).toBe(true);
  });

  /**
   * La rastremazione e la dissolvenza nascono dalla sovrapposizione: gli strati
   * condividono la punta e si allungano all'indietro, sempre più sottili e
   * spenti. Invertito l'ordine, la scia sarebbe un trattino con una coda spessa.
   */
  it('si assottiglia e si spegne verso la coda', () => {
    const head = sweep.at(-1)!;
    const tail = sweep[0];

    expect(head.dash).toBe(HEAD_DASH);
    expect(tail.dash).toBe(trailLength(600));
    expect(head.width).toBeGreaterThan(tail.width);
    expect(head.opacity).toBeGreaterThan(tail.opacity);
  });

  /**
   * Tutti gli strati devono percorrere la stessa distanza nello stesso tempo:
   * con corse diverse la scia si sfilaccerebbe dopo pochi giri, e sarebbe un
   * difetto lentissimo da notare.
   */
  it('tutti gli strati corrono la stessa distanza', () => {
    const distances = new Set(sweep.map((layer) => layer.from - layer.to));
    expect(distances.size).toBe(1);
  });

  it('parte da fuori: nessuno strato è già in scena al primo fotogramma', () => {
    for (const layer of sweep) {
      // Con offset pari alla propria lunghezza il tratto sta tutto prima
      // dell'inizio della traccia, quindi invisibile.
      expect(layer.from).toBe(layer.dash);
      expect(layer.to).toBeLessThan(0);
    }
  });

  /**
   * Il tratteggio si ripete ogni `dash + gap`: se quel passo non coincide con la
   * corsa dell'animazione, all'ultimo fotogramma il disegno non combacia con il
   * primo e a ogni giro la scia fa uno scatto all'indietro. È il difetto che si
   * vedeva come «reset» a un certo punto dell'animazione.
   */
  it('il passo del tratteggio coincide con la corsa: il giro si chiude senza salto', () => {
    for (const layer of sweep) {
      expect(layer.dash + layer.gap).toBeCloseTo(layer.from - layer.to, 5);
    }
  });

  /**
   * Con uno spazio più corto della traccia si vedrebbero due scie insieme, una
   * che entra mentre l'altra non è ancora uscita.
   */
  it('non lascia mai due scie in scena insieme', () => {
    for (const layer of sweep) expect(layer.gap).toBeGreaterThanOrEqual(600);
  });

  it('senza traccia non produce strati, invece di dividere per zero', () => {
    expect(buildSweep(0)).toEqual([]);
    expect(buildSweep(-5)).toEqual([]);
  });
});
