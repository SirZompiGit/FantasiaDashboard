/**
 * Sagoma del dado, disegnata in SVG.
 *
 * Solo il profilo esterno: niente spigoli interni, che affollavano una forma
 * già piccola. Il numero è testo SVG dimensionato in unità del viewBox, non con
 * le classi di Tailwind. Due vantaggi: resta sempre proporzionato alla sagoma
 * qualunque sia la sua dimensione, e non risente del rimpicciolimento che il
 * design Retro applica a `.font-display`, che qui lo avrebbe reso minuscolo.
 */

import { useMemo } from 'react';
import { parseSides } from '../lib/dice';

/** Profili in coordinate del viewBox 100×100. */
const PROFILES: Record<number, string> = {
  3: '50,10 93,84 7,84',
  4: '50,8 93,84 7,84',
  6: '13,13 87,13 87,87 13,87',
  8: '50,5 91,50 50,95 9,50',
  10: '50,4 90,36 74,92 26,92 10,36',
  12: '50,5 93,36 77,88 23,88 7,36',
  20: '50,4 90,27 90,73 50,96 10,73 10,27',
};

const FALLBACK = PROFILES[6];

/**
 * Baricentro del poligono.
 *
 * Centrare il numero a 50,50 funziona solo per le sagome simmetriche: in un
 * triangolo finirebbe troppo in alto, fuori dalla massa della forma. Il
 * baricentro lo colloca dove l'occhio si aspetta il centro, qualunque sia il
 * profilo — e senza numeri magici da riaggiustare a ogni sagoma.
 */
function centroid(points: string): { x: number; y: number } {
  const coords = points.split(' ').map((pair) => pair.split(',').map(Number));
  const sum = coords.reduce((acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
  return { x: sum.x / coords.length, y: sum.y / coords.length };
}

/**
 * Colori dell'esito. Non seguono il tema: un critico deve essere oro e un
 * fallimento rosso in qualunque palette, altrimenti in tema Druido il colpo
 * fortunato sarebbe verde come tutto il resto e smetterebbe di saltare
 * all'occhio.
 */
export const CRITICAL_COLOR = '#fbbf24';
export const FUMBLE_COLOR = '#ef4444';

export type DiceShapeState = 'idle' | 'rolling' | 'result';

/**
 * `full`   — numero pieno e visibile
 * `dimmed` — visibile ma spento: il master vede il proprio lancio nascosto
 * `hidden` — sostituito da `?`: è ciò che vedono i giocatori
 */
export type DiceReveal = 'full' | 'dimmed' | 'hidden';

interface DiceShapeProps {
  diceType: string;
  value: number | null;
  state: DiceShapeState;
  accent: string;
  reveal?: DiceReveal;
  outcome?: 'critical' | 'fumble' | null;
  className?: string;
}

export function DiceShape({
  diceType,
  value,
  state,
  accent,
  reveal = 'full',
  outcome = null,
  className = '',
}: DiceShapeProps) {
  const outline = PROFILES[parseSides(diceType)] ?? FALLBACK;
  const center = useMemo(() => centroid(outline), [outline]);

  const text = reveal === 'hidden' || value === null ? '?' : String(value);
  // Più cifre, più piccolo il numero: un 20 non può occupare quanto un 4.
  const fontSize = text.length >= 3 ? 28 : text.length === 2 ? 36 : 46;

  const animation =
    state === 'rolling' ? 'dice-tumble' : state === 'result' ? 'dice-settle' : '';

  // Sagoma e numero prendono il colore dell'esito, quando c'è.
  const color =
    outcome === 'critical' ? CRITICAL_COLOR : outcome === 'fumble' ? FUMBLE_COLOR : accent;

  const textColor = outcome ? color : reveal === 'full' ? '#ffffff' : color;

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={
        state === 'rolling'
          ? `Lancio di un ${diceType} in corso`
          : reveal === 'hidden'
            ? `Risultato del ${diceType} nascosto`
            : `${diceType}: ${text}`
      }
      className={`${animation} ${className}`}
      style={{
        overflow: 'visible',
        // La rotazione gira attorno al baricentro, non al centro del riquadro.
        // Con `50% 50%` le sagome asimmetriche — i triangoli del d3 e del d4 —
        // ruotavano fuori asse, come una ruota storta.
        transformOrigin: `${center.x}% ${center.y}%`,
      }}
    >
      {/* Alone che stacca la sagoma dal fondo. Sta dietro, non dentro. */}
      <polygon
        points={outline}
        fill={color}
        opacity={outcome ? 0.34 : 0.18}
        style={{ filter: 'blur(7px)' }}
      />

      {/* Solo il profilo esterno. */}
      <polygon
        points={outline}
        fill={color}
        fillOpacity={outcome ? 0.16 : 0.1}
        stroke={color}
        strokeWidth={outcome ? 3.5 : 3}
        strokeLinejoin="round"
      />

      <text
        x={center.x}
        y={center.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fillOpacity={reveal === 'dimmed' ? 0.55 : 1}
        fontSize={fontSize}
        fontWeight={800}
        style={{
          fontFamily: 'var(--font-display)',
          filter: reveal === 'dimmed' ? 'none' : `drop-shadow(0 0 8px ${color}90)`,
        }}
      >
        {text}
      </text>
    </svg>
  );
}
