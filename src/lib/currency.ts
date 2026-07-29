/**
 * Valuta del gruppo: il tesoro condiviso da tutta la compagnia.
 *
 * Non è dell'inventario di un personaggio ma della campagna, perché è così che
 * si gioca davvero — l'oro sta in un mucchio e lo si divide (o non lo si
 * divide) a fine avventura.
 *
 * Nome e icona sono scelti dal master nelle impostazioni: la stessa meccanica
 * regge monete d'oro, crediti, razioni, punti karma o teschi, e ogni campagna
 * chiama la propria valuta come vuole.
 */

import type { ComponentType } from 'react';
import { Banknote, Coins, Crown, Diamond, Gem, Skull, Sparkles, Star } from 'lucide-react';

/** Quel poco che serve a disegnare l'icona: non tutta l'API di lucide. */
type IconComponent = ComponentType<{ className?: string }>;

export interface CurrencyIconDefinition {
  id: string;
  /** Nome leggibile, per l'etichetta di accessibilità e il suggerimento. */
  label: string;
  Icon: IconComponent;
}

/**
 * Il set di icone disponibili. Otto voci: stanno su due righe da quattro nel
 * pannello impostazioni, che è largo 320 pixel.
 */
export const CURRENCY_ICONS = [
  { id: 'coins', label: 'Monete', Icon: Coins },
  { id: 'gem', label: 'Gemma', Icon: Gem },
  { id: 'diamond', label: 'Diamante', Icon: Diamond },
  { id: 'banknote', label: 'Banconota', Icon: Banknote },
  { id: 'crown', label: 'Corona', Icon: Crown },
  { id: 'star', label: 'Stella', Icon: Star },
  { id: 'sparkles', label: 'Scintille', Icon: Sparkles },
  { id: 'skull', label: 'Teschio', Icon: Skull },
] as const satisfies readonly CurrencyIconDefinition[];

export type CurrencyIcon = (typeof CURRENCY_ICONS)[number]['id'];

export const DEFAULT_CURRENCY_ICON: CurrencyIcon = 'coins';
export const DEFAULT_CURRENCY_NAME = 'Monete d’oro';

/** Nome della valuta: corto, perché sta accanto al totale. */
export const MAX_CURRENCY_NAME = 24;

/**
 * Tetto del tesoro. Sette cifre bastano a qualunque campagna e tengono il
 * numero leggibile nello spazio che ha.
 */
export const MAX_CURRENCY = 9_999_999;

export interface Currency {
  /**
   * Interruttore generale. Spento non compare da nessuna parte: molte campagne
   * il denaro non lo contano affatto, e un contatore a zero sempre in vista è
   * solo ingombro.
   */
  enabled: boolean;
  name: string;
  icon: CurrencyIcon;
  /** Totale del gruppo. Mai negativo: un debito si annota, non si conta qui. */
  amount: number;
  /**
   * Ogni personaggio tiene il proprio. Alcuni tavoli dividono il bottino
   * subito, altri lo lasciano in comune: qui si scelgono entrambe le cose.
   */
  perPlayer: boolean;
  /**
   * Il totale del gruppo è la SOMMA di quanto hanno i personaggi, invece di un
   * numero a sé. Vale solo con `perPlayer` attivo: senza, non ci sarebbe nulla
   * da sommare.
   */
  sumFromPlayers: boolean;
}

/** Oro del gruppo: la somma dei personaggi, oppure il totale scritto a mano. */
export function groupTotal(currency: Currency, players: { gold?: number }[]): number {
  if (!currency.perPlayer || !currency.sumFromPlayers) return currency.amount;
  return clampCurrency(players.reduce((total, player) => total + (player.gold ?? 0), 0));
}

/** Il totale è calcolato e non si può scrivere a mano. */
export function isComputedTotal(currency: Currency): boolean {
  return currency.perPlayer && currency.sumFromPlayers;
}

const ICON_IDS = new Set<string>(CURRENCY_ICONS.map((definition) => definition.id));

export function isCurrencyIcon(value: string): value is CurrencyIcon {
  return ICON_IDS.has(value);
}

/**
 * Componente dell'icona scelta. Un identificativo sconosciuto — icona rimossa
 * in un aggiornamento — ricade sulle monete invece di non disegnare nulla.
 */
export function currencyIconComponent(id: CurrencyIcon): IconComponent {
  const found = CURRENCY_ICONS.find((definition) => definition.id === id);
  return (found ?? CURRENCY_ICONS[0]).Icon;
}

export function clampCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(value), MAX_CURRENCY));
}

export function createCurrency(): Currency {
  return {
    // Spenta: si accende dalle impostazioni quando serve davvero.
    enabled: false,
    name: DEFAULT_CURRENCY_NAME,
    icon: DEFAULT_CURRENCY_ICON,
    amount: 0,
    perPlayer: false,
    sumFromPlayers: false,
  };
}

/**
 * Totale con il separatore delle migliaia: 12500 diventa "12.500", che a colpo
 * d'occhio si distingue da 1250 mentre una fila di cifre nude no.
 */
export function formatCurrency(amount: number): string {
  return clampCurrency(amount).toLocaleString('it-IT');
}
