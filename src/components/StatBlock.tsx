/**
 * Le sei statistiche di un personaggio.
 *
 * Un solo componente per i due posti in cui compaiono: la scheda PG in
 * dashboard (modificabile dal master) e la condivisione (sola lettura, solo per
 * il giocatore di turno). La sigla è nella cella, il nome completo nel tooltip
 * — così ogni cella si spiega da sola anche nella colonna stretta della
 * proiezione.
 *
 * `dense` le mette tutte e sei su **una riga**, molto strette: è la forma più
 * compatta, quella che occupa meno spazio nelle schede.
 */

import { clampStat, readStats, statAbbr } from '../lib/stats';
import { Tooltip } from './ui/Tooltip';

interface StatBlockProps {
  labels: string[];
  /** Valori grezzi dal Player; i mancanti ricadono sul default. */
  stats: number[] | undefined;
  /** Assente = sola lettura. Riceve l'intero array aggiornato. */
  onChange?: (next: number[]) => void;
  /** Sei celle su una riga sola, più piccole. */
  dense?: boolean;
}

export function StatBlock({ labels, stats, onChange, dense = false }: StatBlockProps) {
  const values = readStats(stats);
  const editable = Boolean(onChange);

  const setAt = (index: number, raw: number) => {
    if (!onChange) return;
    const next = values.slice();
    next[index] = clampStat(raw);
    onChange(next);
  };

  return (
    <div className={`grid gap-1 ${dense ? 'grid-cols-6' : 'grid-cols-3 gap-1.5'}`}>
      {labels.map((label, index) => (
        <Tooltip key={index} label={label} className="w-full">
          <div
            className={`flex w-full flex-col items-center rounded-md border border-bento-border bg-bento-bg ${
              dense ? 'px-0.5 py-0.5' : 'rounded-lg px-1.5 py-1.5'
            }`}
          >
            <span
              className={`font-mono font-bold uppercase tracking-wider text-slate-500 ${
                dense ? 'text-[8px]' : 'text-[9px]'
              }`}
            >
              {statAbbr(label)}
            </span>
            {editable ? (
              <input
                type="number"
                inputMode="numeric"
                value={values[index]}
                onChange={(event) => setAt(index, Number.parseInt(event.target.value, 10) || 0)}
                aria-label={label}
                className={`w-full bg-transparent text-center font-display font-black text-slate-100 focus:outline-none ${
                  dense ? 'text-sm' : 'text-lg'
                }`}
              />
            ) : (
              <span
                className={`font-display font-black text-slate-100 ${
                  dense ? 'text-sm' : 'text-lg'
                }`}
              >
                {values[index]}
              </span>
            )}
          </div>
        </Tooltip>
      ))}
    </div>
  );
}
