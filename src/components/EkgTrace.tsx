/**
 * Design «Tracciato»: la linea resta intera, la luce la percorre.
 *
 * È la versione alternativa di Battito. Là il tracciato è il riempimento e si
 * accorcia con i punti ferita; qui il grafico non si tocca — resta disegnato per
 * intero da un capo all'altro, appena accennato — e il livello si legge da due
 * cose sole:
 *
 *  - la VELOCITÀ della luce che lo attraversa: svelta a piena vita, sempre più
 *    lenta mentre scende;
 *  - una piccola levetta che scorre lungo la traccia e dice il valore esatto.
 *
 * A zero il tracciato si appiattisce e la luce si spegne, come su un monitor
 * quando non c'è più niente da misurare.
 *
 * Le misure vengono osservate, non stimate: la traccia è costruita nello spazio
 * in pixel del contenitore, così lo spessore della linea non si deforma e la
 * luce percorre davvero tutta la lunghezza. Con un `viewBox` stirato faceva un
 * pezzo di strada e ricominciava a metà.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildTrace, sweepDash, sweepSeconds } from '../lib/ekg';

interface EkgTraceProps {
  value: number;
  max: number;
  color: string;
  /** Traccia che sale invece di correre da sinistra a destra. */
  vertical: boolean;
}

export function EkgTrace({ value, max, color, vertical }: EkgTraceProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = boxRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setBox((current) =>
        // Solo i cambi di almeno un pixel: senza questo confronto un
        // arrotondamento avanti e indietro rimonterebbe la traccia in continuo.
        current &&
        Math.round(current.width) === Math.round(rect.width) &&
        Math.round(current.height) === Math.round(rect.height)
          ? current
          : { width: rect.width, height: rect.height },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const width = box?.width ?? 0;
  const height = box?.height ?? 0;

  const trace = useMemo(
    () =>
      vertical ? buildTrace(height, width, true) : buildTrace(width, height, false),
    [width, height, vertical],
  );

  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  /** A zero non c'è più niente da misurare: la linea diventa piatta. */
  const flat = value <= 0;
  const dash = sweepDash(trace.length);

  return (
    <div ref={boxRef} className="relative h-full w-full">
      {trace.length > 0 && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          aria-hidden
          className="absolute inset-0 overflow-visible"
        >
          {/**
           * Lo schiacciamento agisce sul gruppo, non sui punti: `transform-box`
           * predefinito degli elementi SVG è il `viewBox`, quindi «centro»
           * coincide con la linea di base e `scale` a zero la appiattisce
           * esattamente lì, con una transizione invece di uno scatto.
           */}
          <g
            style={{
              transform: vertical ? `scaleX(${flat ? 0 : 1})` : `scaleY(${flat ? 0 : 1})`,
              transformOrigin: 'center',
              transition: 'transform 500ms ease-out',
            }}
          >
            {/* La traccia: appena accennata, quel tanto che basta a leggere la
                forma anche quando la luce è altrove. */}
            <polyline
              points={trace.points}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={0.16}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* La luce. Un solo tratto acceso lungo tutta la traccia: lo spazio
                del tratteggio è lungo quanto la traccia, quindi non se ne vede
                mai più di uno per volta. */}
            {!flat && (
              <polyline
                points={trace.points}
                fill="none"
                stroke={color}
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="ekg-light"
                style={
                  {
                    strokeDasharray: `${dash} ${trace.length}`,
                    filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 7px ${color}80)`,
                    // Entra da fuori e esce dall'altro capo: il giro si chiude
                    // senza che il lampo appaia già a metà strada.
                    '--ekg-from': `${dash}px`,
                    '--ekg-to': `-${trace.length}px`,
                    '--ekg-speed': `${sweepSeconds(ratio)}s`,
                  } as React.CSSProperties
                }
              />
            )}
          </g>
        </svg>
      )}

      {/* La levetta: il valore esatto, per chi lo vuole leggere invece di
          dedurlo dal ritmo. È anche l'appiglio visivo del trascinamento, che
          resta gestito da tutta la traccia. */}
      <span
        aria-hidden
        className={`ekg-knob ${vertical ? 'ekg-knob--vertical' : ''}`}
        style={{ '--ekg-pos': ratio } as React.CSSProperties}
      />
    </div>
  );
}
