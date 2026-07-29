import { describe, expect, it } from 'vitest';
import {
  CURRENCY_ICONS,
  MAX_CURRENCY,
  clampCurrency,
  createCurrency,
  currencyIconComponent,
  formatCurrency,
  groupTotal,
  isComputedTotal,
  isCurrencyIcon,
} from './currency';

describe('tesoro del gruppo', () => {
  it('parte da zero con nome e icona predefiniti', () => {
    const currency = createCurrency();
    expect(currency.amount).toBe(0);
    expect(currency.name).toBeTruthy();
    expect(isCurrencyIcon(currency.icon)).toBe(true);
  });

  it('non ammette totali negativi: un debito si annota, non si conta qui', () => {
    expect(clampCurrency(-100)).toBe(0);
    expect(clampCurrency(NaN)).toBe(0);
    expect(clampCurrency(1e12)).toBe(MAX_CURRENCY);
    expect(clampCurrency(12.6)).toBe(13);
  });

  it('riconosce solo le icone esistenti', () => {
    for (const definition of CURRENCY_ICONS) {
      expect(isCurrencyIcon(definition.id)).toBe(true);
    }
    expect(isCurrencyIcon('patatina')).toBe(false);
  });

  /**
   * Un'icona rimossa in un aggiornamento futuro resterebbe scritta nelle
   * campagne salvate: deve ricadere sul simbolo predefinito, non sparire.
   */
  it('un identificativo ignoto ricade sulle monete invece di non disegnare nulla', () => {
    expect(currencyIconComponent('coins')).toBe(CURRENCY_ICONS[0].Icon);
    // @ts-expect-error: è proprio il caso del valore letto da un salvataggio.
    expect(currencyIconComponent('patatina')).toBe(CURRENCY_ICONS[0].Icon);
  });

  it('separa le migliaia, altrimenti le cifre non si distinguono a colpo d occhio', () => {
    // Lo spazio unificatore usato da alcune localizzazioni non deve trarre in
    // inganno: si controlla che i gruppi ci siano, non quale segno li separi.
    expect(formatCurrency(12500)).toMatch(/^12\D?500$/);
    expect(formatCurrency(0)).toBe('0');
  });

  it('parte spenta: una campagna che non conta il denaro non deve vederla', () => {
    expect(createCurrency().enabled).toBe(false);
  });

  it('ogni icona ha identificativo ed etichetta propri', () => {
    const ids = CURRENCY_ICONS.map((definition) => definition.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const definition of CURRENCY_ICONS) {
      expect(definition.label.length).toBeGreaterThan(0);
    }
  });
});

describe('totale del gruppo', () => {
  const players = [{ gold: 120 }, { gold: 30 }, {}];
  const base = { ...createCurrency(), enabled: true, amount: 1000 };

  it('è il proprio numero finché non si chiede la somma', () => {
    expect(groupTotal(base, players)).toBe(1000);
    expect(groupTotal({ ...base, perPlayer: true }, players)).toBe(1000);
  });

  it('diventa la somma dei portafogli quando la funzione è attiva', () => {
    const summed = { ...base, perPlayer: true, sumFromPlayers: true };
    // Chi non ha oro conta zero, non fa saltare il totale.
    expect(groupTotal(summed, players)).toBe(150);
    expect(groupTotal(summed, [])).toBe(0);
  });

  /** Senza portafogli non c'è nulla da sommare: la somma non deve avere effetto. */
  it('ignora la somma quando l oro per personaggio è spento', () => {
    const inconsistent = { ...base, perPlayer: false, sumFromPlayers: true };
    expect(groupTotal(inconsistent, players)).toBe(1000);
    expect(isComputedTotal(inconsistent)).toBe(false);
  });

  it('un totale calcolato non si scrive a mano', () => {
    expect(isComputedTotal({ ...base, perPlayer: true, sumFromPlayers: true })).toBe(true);
    expect(isComputedTotal(base)).toBe(false);
  });
});
