/**
 * Nuvoletta esplicativa per elementi che **non** sono bottoni: celle
 * statistiche, targhette di stato, pastiglie colore.
 *
 * `IconButton` ha già il suo tooltip per i controlli icona; questo copre tutto
 * il resto, così ogni icona senza un'etichetta accanto può spiegarsi da sola al
 * passaggio del mouse o al focus da tastiera, invece di affidarsi al `title`
 * nativo (lento e fuori stile).
 *
 * La nuvoletta viene disegnata in fondo al documento (portale) e posizionata a
 * schermo: con un semplice `position: absolute` veniva TAGLIATA dal primo
 * antenato che scorre — la lista delle barre, per dirne una — e di fatto
 * spariva proprio dove serviva.
 */

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Tip = 'top' | 'bottom' | 'left' | 'right';

/** Distanza fra la nuvoletta e l'elemento che la richiama. */
const GAP = 6;

interface TooltipProps {
  /** Testo della nuvoletta. */
  label: string;
  children: ReactNode;
  tip?: Tip;
  className?: string;
  /**
   * Rende il contenitore focalizzabile per far comparire la nuvoletta da
   * tastiera. Va lasciato `false` quando dentro c'è già un elemento
   * focalizzabile (un bottone): eviterebbe di raddoppiare la tappa di tab e di
   * sovrapporre due etichette. In quel caso il figlio porta la propria
   * `aria-label` e il focus su di esso mostra comunque la nuvoletta.
   */
  focusable?: boolean;
}

export function Tooltip({
  label,
  children,
  tip = 'top',
  className = '',
  focusable = true,
}: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; transform: string } | null>(null);

  const show = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;

    const places: Record<Tip, { top: number; left: number; transform: string }> = {
      top: {
        top: rect.top - GAP,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      },
      bottom: {
        top: rect.bottom + GAP,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, 0)',
      },
      left: {
        top: rect.top + rect.height / 2,
        left: rect.left - GAP,
        transform: 'translate(-100%, -50%)',
      },
      right: {
        top: rect.top + rect.height / 2,
        left: rect.right + GAP,
        transform: 'translate(0, -50%)',
      },
    };

    setBox(places[tip]);
  }, [tip]);

  const hide = useCallback(() => setBox(null), []);

  return (
    <span
      ref={anchorRef}
      className={`group/tip relative inline-flex ${className}`}
      tabIndex={focusable ? 0 : undefined}
      aria-label={focusable ? label : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {box !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: box.top, left: box.left, transform: box.transform }}
            className="pointer-events-none fixed z-[200] whitespace-nowrap rounded-md border border-bento-border bg-bento-void px-2 py-1 text-[10px] font-medium text-slate-200 shadow-raised"
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
