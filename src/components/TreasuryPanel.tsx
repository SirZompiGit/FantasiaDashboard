/**
 * Tesoro del gruppo.
 *
 * Due forme, molto diverse fra loro perché servono due cose diverse:
 *
 *  - `TreasuryPanel` — il comando del master, sopra il lancio dei dadi: casella
 *    scrivibile e scatti rapidi, perché è lì che il denaro si muove davvero.
 *  - `TreasuryTag` — una riga e basta, per lo schermo condiviso e per le schede
 *    dei personaggi. Niente cornice: il totale è un'informazione, non un
 *    pannello, e circondarlo di bordi in una vista già piena di riquadri lo
 *    farebbe sembrare più importante di quanto sia.
 *
 * Quando il totale è la somma dei portafogli dei personaggi il pannello diventa
 * di sola lettura: scriverlo a mano vorrebbe dire contraddire la somma.
 */

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Currency } from '../lib/currency';
import {
  MAX_CURRENCY,
  clampCurrency,
  currencyIconComponent,
  formatCurrency,
  isComputedTotal,
} from '../lib/currency';

/** Scatti dei pulsanti rapidi: la mancia e il bottino. */
const STEPS = [-100, -10, 10, 100] as const;

interface TreasuryTagProps {
  currency: Currency;
  amount: number;
  /** Nasconde il nome della valuta dove lo spazio è quello di una riga di lista. */
  compact?: boolean;
  className?: string;
}

export function TreasuryTag({ currency, amount, compact = false, className = '' }: TreasuryTagProps) {
  const Icon = currencyIconComponent(currency.icon);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-theme-500" />
      <span className="font-display font-bold tabular-nums text-theme-400">
        {formatCurrency(amount)}
      </span>
      {!compact && (
        <span className="min-w-0 truncate font-mono text-[11px] uppercase tracking-wider text-slate-500">
          {currency.name}
        </span>
      )}
    </span>
  );
}

interface TreasuryPanelProps {
  currency: Currency;
  /** Totale mostrato: il proprio, oppure la somma dei personaggi. */
  amount: number;
  onChange: (amount: number) => void;
}

export function TreasuryPanel({ currency, amount, onChange }: TreasuryPanelProps) {
  const Icon = currencyIconComponent(currency.icon);
  const computed = isComputedTotal(currency);

  /**
   * Testo in corso di scrittura, mentre il campo è sotto le dita.
   *
   * Senza, svuotare la casella per riscrivere la cifra la riportava subito a
   * zero e il numero nuovo si attaccava dietro allo zero. Al termine si torna
   * al valore vero, che è quello dello stato.
   */
  const [draft, setDraft] = useState<string | null>(null);

  const apply = (next: number) => {
    setDraft(null);
    onChange(next);
  };

  return (
    <section className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-bento-border bg-bento-panel px-3 py-2 shadow-panel">
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-theme-500" />
        <span className="min-w-0 truncate font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {currency.name}
        </span>
      </span>

      {computed ? (
        <span className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
            somma dei personaggi
          </span>
          <span className="font-display text-lg font-bold tabular-nums text-theme-400">
            {formatCurrency(amount)}
          </span>
        </span>
      ) : (
        <span className="ml-auto flex items-center gap-1">
          {STEPS.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => apply(clampCurrency(amount + step))}
              aria-label={`${step > 0 ? 'Aggiungi' : 'Togli'} ${Math.abs(step)}`}
              title={`${step > 0 ? '+' : '−'}${Math.abs(step)}`}
              className={`flex items-center rounded-lg px-1.5 py-1 font-mono text-[10px] font-bold text-slate-400 transition-colors duration-200 hover:bg-bento-button ${
                step > 0 ? 'hover:text-emerald-400' : 'hover:text-red-400'
              }`}
            >
              {step > 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {Math.abs(step)}
            </button>
          ))}

          {/* Il totale è un campo, non un'etichetta: dopo una compravendita si
              riscrive la cifra invece di inseguirla a colpi di più e meno. */}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_CURRENCY}
            value={draft ?? String(amount)}
            onChange={(event) => {
              const raw = event.target.value;
              setDraft(raw);
              // La casella vuota non è uno zero: è un totale non ancora scritto.
              if (raw.trim()) onChange(clampCurrency(Number.parseInt(raw, 10)));
            }}
            onBlur={() => setDraft(null)}
            aria-label={`Totale: ${currency.name}`}
            className="w-24 rounded-lg border border-bento-border bg-bento-bg px-2 py-1 text-right font-display text-base font-bold tabular-nums text-theme-400 transition-colors duration-200 focus:border-theme-500 focus:outline-none focus:ring-1 focus:ring-theme-500/20"
          />
        </span>
      )}
    </section>
  );
}
