/**
 * Sagoma del dado, disegnata in SVG.
 *
 * Ogni tipo ha il proprio profilo — triangolo per il d4, quadrato per il d6,
 * rombo per il d8, e così via — con qualche spigolo interno che suggerisce le
 * facce. Durante il lancio la sagoma rotola; all'uscita del risultato si posa
 * con un rimbalzo.
 *
 * Il numero è testo SVG dimensionato in unità del viewBox, non con le classi
 * di Tailwind. Due vantaggi: resta sempre proporzionato alla sagoma qualunque
 * sia la sua dimensione, e non risente del rimpicciolimento che il design
 * Retro applica a `.font-display`, che qui lo avrebbe reso minuscolo.
 */

import { parseSides } from '../lib/dice';

interface DieProfile {
  /** Profilo esterno, in coordinate del viewBox 100×100. */
  outline: string;
  /** Spigoli interni che danno l'idea del solido. */
  facets?: string[];
  /** Quanto in basso sta il numero: alcune sagome hanno il centro spostato. */
  textY?: number;
}

const PROFILES: Record<number, DieProfile> = {
  // d3 e d4: triangolo
  3: { outline: '50,10 93,84 7,84', textY: 64 },
  4: { outline: '50,8 93,84 7,84', facets: ['50,8 50,84'], textY: 64 },
  // d6: quadrato
  6: { outline: '13,13 87,13 87,87 13,87' },
  // d8: ottaedro visto di fronte, un rombo
  8: { outline: '50,5 91,50 50,95 9,50', facets: ['9,50 91,50'] },
  // d10: trapezoedro, la sagoma a aquilone
  10: {
    outline: '50,4 90,36 74,92 26,92 10,36',
    facets: ['10,36 50,56 90,36', '50,56 50,92'],
    textY: 46,
  },
  // d12: dodecaedro, pentagono
  12: { outline: '50,5 93,36 77,88 23,88 7,36', textY: 56 },
  // d20: icosaedro, esagono con la faccia superiore in evidenza
  20: {
    outline: '50,4 90,27 90,73 50,96 10,73 10,27',
    facets: ['26,40 74,40 50,78 26,40'],
    textY: 58,
  },
};

const FALLBACK: DieProfile = { outline: '13,13 87,13 87,87 13,87' };

export type DiceShapeState = 'idle' | 'rolling' | 'result';

interface DiceShapeProps {
  diceType: string;
  /** Valore mostrato. `null` durante l'attesa del primo lancio. */
  value: number | null;
  state: DiceShapeState;
  /** Colore della sagoma. */
  accent: string;
  /** Lancio nascosto ai giocatori: la sagoma resta, il numero no. */
  hidden?: boolean;
  /** Esito speciale, per evidenziare critico e fallimento. */
  outcome?: 'critical' | 'fumble' | null;
  className?: string;
}

export function DiceShape({
  diceType,
  value,
  state,
  accent,
  hidden = false,
  outcome = null,
  className = '',
}: DiceShapeProps) {
  const profile = PROFILES[parseSides(diceType)] ?? FALLBACK;

  // Più cifre, più piccolo il numero: un 20 non può occupare quanto un 4.
  const text = hidden ? '?' : value === null ? '?' : String(value);
  const fontSize = text.length >= 3 ? 26 : text.length === 2 ? 34 : 42;

  const animation =
    state === 'rolling' ? 'dice-tumble' : state === 'result' ? 'dice-settle' : '';

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={
        state === 'rolling'
          ? `Lancio di un ${diceType} in corso`
          : hidden
            ? `Risultato del ${diceType} nascosto`
            : `${diceType}: ${text}`
      }
      className={`${animation} ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* Alone dietro la sagoma, per staccarla dal fondo. */}
      <polygon
        points={profile.outline}
        fill={accent}
        opacity={outcome === 'critical' ? 0.3 : 0.16}
        style={{ filter: 'blur(6px)' }}
      />

      <polygon
        points={profile.outline}
        fill={accent}
        fillOpacity={0.14}
        stroke={accent}
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {profile.facets?.map((facet, index) => (
        <polyline
          key={index}
          points={facet}
          fill="none"
          stroke={accent}
          strokeWidth={1.5}
          strokeLinejoin="round"
          opacity={0.5}
        />
      ))}

      <text
        x={50}
        y={profile.textY ?? 50}
        textAnchor="middle"
        dominantBaseline="central"
        fill={hidden ? accent : '#ffffff'}
        fontSize={fontSize}
        fontWeight={800}
        style={{
          fontFamily: 'var(--font-display)',
          // La sfocatura del lancio nascosto vale solo per il numero: la
          // sagoma deve restare nitida, altrimenti sembra un errore di resa.
          filter: hidden ? 'blur(3px)' : `drop-shadow(0 0 6px ${accent}66)`,
        }}
      >
        {text}
      </text>
    </svg>
  );
}
