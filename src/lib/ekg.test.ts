import { describe, expect, it } from 'vitest';
import {
  BEAT_PIXELS,
  MAX_AMPLITUDE,
  MIN_AMPLITUDE,
  SWEEP_FAST,
  SWEEP_SLOW,
  buildTrace,
  sweepDash,
  sweepSeconds,
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

  it('il lampo resta visibile anche su una traccia corta', () => {
    expect(sweepDash(60)).toBeGreaterThanOrEqual(18);
    // Su una traccia lunga cresce con lei, invece di restare un puntino.
    expect(sweepDash(1000)).toBeGreaterThan(sweepDash(400));
  });
});
