/**
 * Design «Tracciato»: la linea resta intera, la luce la percorre.
 *
 * È la versione alternativa di Battito. Là il tracciato è il riempimento e si
 * accorcia con i punti ferita; qui il grafico non si tocca — resta intero da un
 * capo all'altro, ma NON è disegnato: lo si vede solo dove passa la luce, che ne
 * rivela un pezzo per volta. Il livello si legge da due cose sole:
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
import { HALO_FACTOR, buildTrace, sweepDash, sweepRange, sweepSeconds } from '../lib/ekg';

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

  const speed = sweepSeconds(ratio);
  const dash = sweepDash(trace.length);
  const halo = dash * HALO_FACTOR;
  const coreRange = sweepRange(trace.length, dash);
  const haloRange = sweepRange(trace.length, dash, true);

  return (
    <div ref={boxRef} className="relative h-full w-full">
      {trace.length > 0 && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          aria-hidden
          // La dissolvenza ai due capi: il lampo non compare e non sparisce di
          // netto contro il bordo, ci entra e ne esce.
          className={`ekg-fade absolute inset-0 overflow-visible ${
            vertical ? 'ekg-fade--vertical' : ''
          }`}
        >
          {flat ? (
            /**
             * Niente più da misurare: resta la linea piatta, l'unica cosa che si
             * vede quando la luce non passa. È anche il motivo per cui la
             * traccia spenta non è disegnata — la si vede solo quando la
             * percorre la luce, o quando non c'è più nulla da percorrere.
             */
            <line
              x1={vertical ? width / 2 : 0}
              y1={vertical ? 0 : height / 2}
              x2={vertical ? width / 2 : width}
              y2={vertical ? height : height / 2}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              className="ekg-flatline"
              style={{ filter: `drop-shadow(0 0 3px ${color})` }}
            />
          ) : (
            /**
             * La luce, in due strati sovrapposti.
             *
             * L'alone è lungo il doppio del nucleo e centrato su di esso: sporge
             * davanti e dietro, ed è ciò che fa sfumare le estremità del lampo
             * invece di troncarle di netto. Un solo strato con i capi arrotondati
             * finiva e cominciava troppo secco.
             *
             * Le due animazioni hanno la stessa durata e partono insieme, quindi
             * restano allineate per tutta la sessione.
             */
            <>
              <polyline
                points={trace.points}
                fill="none"
                stroke={color}
                strokeWidth={3.5}
                strokeOpacity={0.22}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="ekg-light"
                style={
                  {
                    strokeDasharray: `${halo} ${trace.length}`,
                    filter: `blur(2.5px)`,
                    '--ekg-from': `${haloRange[0]}px`,
                    '--ekg-to': `${haloRange[1]}px`,
                    '--ekg-speed': `${speed}s`,
                  } as React.CSSProperties
                }
              />

              <polyline
                points={trace.points}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="ekg-light"
                style={
                  {
                    strokeDasharray: `${dash} ${trace.length}`,
                    /**
                     * Neon: un nucleo netto più due bagliori sempre più larghi e
                     * tenui. Un'unica ombra diffusa fa una macchia; è la somma
                     * di nucleo e alone a leggersi come tubo al neon. Restano
                     * contenuti — è un dettaglio, non un faro.
                     */
                    filter: `drop-shadow(0 0 1.5px ${color}) drop-shadow(0 0 5px ${color}a0) drop-shadow(0 0 11px ${color}4d)`,
                    '--ekg-from': `${coreRange[0]}px`,
                    '--ekg-to': `${coreRange[1]}px`,
                    '--ekg-speed': `${speed}s`,
                  } as React.CSSProperties
                }
              />
            </>
          )}
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
