/**
 * Logica delle barre vita, condivisa fra HealthBarsManager e SharedView.
 * Prima `getBarColor` e il raggruppamento erano copiati identici nei due file.
 */

import type { ColoredBar, HealthBar, Resource, StatusEffect } from '../types';
import type { BarStyle } from '../theme';

/**
 * Limite massimo dei punti ferita.
 *
 * La barra disegna un elemento per ogni punto: senza limite, digitare 100000
 * generava centomila nodi DOM e bloccava il browser. L'input era `type="text"`,
 * quindi gli attributi `min`/`max` non venivano nemmeno applicati.
 */
export const MAX_HP = 999;
export const MIN_HP = 1;

/**
 * Oltre questa soglia la barra passa a riempimento continuo invece che a
 * segmenti. L'aspetto non cambia: sopra i 60 punti i segmenti erano già
 * renderizzati con `gap-0`, quindi apparivano già come una barra piena.
 */
export const SEGMENT_THRESHOLD = 60;

/**
 * Stessa soglia, ma per le tracce sottili delle risorse.
 *
 * Molto più bassa: su dieci pixel d'altezza, e con lo spazio fra una tacca e
 * l'altra, cinquanta suddivisioni diventano una zebratura in cui non si
 * distingue più il pieno dal vuoto. Sotto questa soglia i segmenti servono
 * davvero — slot incantesimo, cariche d'ira, pile di scudo si contano a colpo
 * d'occhio; sopra, il riempimento continuo dice la stessa cosa e si legge.
 */
export const THIN_SEGMENT_THRESHOLD = 12;

/**
 * Soglia dei segmenti per la barra verticale.
 *
 * Molto più bassa dell'orizzontale: in verticale l'altezza utile è ~150–270px,
 * e ogni design impone alla traccia un proprio `gap` (Arcano e Retro 3px). Con
 * cinquanta tacche i soli spazi mangiano tutta l'altezza e i segmenti attivi si
 * riducono a un pixel, tanto da far sembrare vuota una barra piena. Sopra questa
 * soglia si passa al riempimento continuo, che non ha spazi e si vede sempre.
 */
export const VERTICAL_SEGMENT_THRESHOLD = 24;

export const DEFAULT_ZERO_HP_TEXT = 'DEFUNTO';

/**
 * Risorse per barra.
 *
 * Dieci è il tetto: nella scheda orizzontale le risorse sono righe che scorrono,
 * quindi ci stanno comodamente; nella barra verticale, dove affiancano la
 * traccia della vita, oltre le due o tre diventano strette, ma il layout non si
 * rompe più (l'indice delle misure è protetto in HealthBarItem).
 */
export const MAX_RESOURCES = 10;

export const DEFAULT_RESOURCE_COLOR = '#3b82f6';

/**
 * Effetti di stato per barra.
 *
 * Cinque è già il limite oltre cui le targhette smettono di stare accanto al
 * nome e la barra diventa illeggibile.
 */
export const MAX_STATUS_EFFECTS = 5;

export const DEFAULT_STATUS_COLOR = '#a855f7';

/**
 * Soglia predefinita dell'allerta visiva, in percentuale.
 *
 * Resta il valore di partenza di ogni barra, ma non è più l'unico possibile:
 * un boss con 400 punti ferita è in pericolo molto prima di un quarto, e un
 * gregario con 8 molto dopo.
 */
export const DEFAULT_LOW_HP_PERCENT = 25;

/**
 * Estremi consentiti. Sotto il 5% l'allerta scatterebbe quando ormai la barra è
 * vuota; sopra il 95% pulserebbe praticamente sempre.
 */
export const MIN_LOW_HP_PERCENT = 5;
export const MAX_LOW_HP_PERCENT = 95;

/** Soglia predefinita come rapporto, per chi ragiona in frazioni di barra. */
export const LOW_HP_THRESHOLD = DEFAULT_LOW_HP_PERCENT / 100;

export function clampLowHpPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LOW_HP_PERCENT;
  return Math.max(MIN_LOW_HP_PERCENT, Math.min(Math.round(value), MAX_LOW_HP_PERCENT));
}

/**
 * Soglia effettiva della barra: la sua, se ne ha una, altrimenti quella
 * predefinita. Assente significa "il solito quarto", così le barre create prima
 * si comportano esattamente come sempre.
 */
export function lowHpPercent(bar: Pick<HealthBar, 'lowHpThreshold'>): number {
  return bar.lowHpThreshold === undefined
    ? DEFAULT_LOW_HP_PERCENT
    : clampLowHpPercent(bar.lowHpThreshold);
}

/**
 * Una barra è in allerta quando è sotto soglia ma non ancora a zero: a zero c'è
 * già l'etichetta "DEFUNTO", e continuare a pulsare sarebbe solo rumore.
 */
export function isLowHp(bar: HealthBar): boolean {
  if (bar.lowHpAlert === false) return false;
  if (bar.currentValue <= 0) return false;
  return healthRatio(bar) <= lowHpPercent(bar) / 100;
}

/**
 * Nome per la copia di una barra.
 *
 * Un numero finale viene incrementato ("Goblin 1" → "Goblin 2"), altrimenti se
 * ne aggiunge uno ("Goblin" → "Goblin 2"). Se il nome così ottenuto è già preso
 * si prosegue: duplicando tre volte lo stesso goblin si ottengono 2, 3 e 4, non
 * tre barre chiamate allo stesso modo.
 */
export function nextCopyName(name: string, existing: Iterable<string>): string {
  const taken = new Set(existing);
  const match = /^(.*?)(\d+)\s*$/.exec(name);
  const base = match ? match[1] : `${name} `;

  let counter = match ? Number(match[2]) + 1 : 2;
  // Il tetto evita un ciclo infinito con una lista assurdamente affollata.
  while (counter < 1000 && taken.has(`${base}${counter}`)) counter++;

  return `${base}${counter}`.slice(0, 60);
}

export const DEFAULT_HEALTH_GROUPS = ['Nemici', 'Alleati', 'PG'];

/**
 * Design con cui una barra viene davvero disegnata: il suo, se ne ha scelto
 * uno, altrimenti quello della campagna.
 */
export function resolveBarStyle(bar: Pick<HealthBar, 'barStyle'>, campaign: BarStyle): BarStyle {
  return bar.barStyle ?? campaign;
}

/**
 * Vero solo se TUTTE le barre indicate finiscono ad anelli.
 *
 * Serve ai contenitori, che con gli anelli affiancano le schede invece di
 * impilarle. Prima la decisione guardava il design della campagna: bastava
 * impostarlo su "circolare" e la lista si stringeva anche quando ogni singola
 * barra usava tutt'altro. Con un misto si resta impilati, che è l'unico
 * impaginato che regge entrambe le forme.
 */
export function areAllCircular(
  bars: Pick<HealthBar, 'barStyle'>[],
  campaign: BarStyle,
): boolean {
  return bars.length > 0 && bars.every((bar) => resolveBarStyle(bar, campaign) === 'circolare');
}

export function clampHp(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(value), max));
}

export function clampMaxHp(value: number): number {
  if (!Number.isFinite(value)) return MIN_HP;
  return Math.max(MIN_HP, Math.min(Math.round(value), MAX_HP));
}

export function healthRatio(bar: Pick<ColoredBar, 'currentValue' | 'maxValue'>): number {
  return bar.maxValue > 0 ? bar.currentValue / bar.maxValue : 0;
}

/**
 * Applica i limiti alla lista delle risorse e restituisce `undefined` quando
 * non ne resta nessuna.
 *
 * L'assenza è voluta: una barra senza risorse deve serializzarsi esattamente
 * come prima che le risorse esistessero, così le stanze e i salvataggi già
 * creati restano identici byte per byte.
 */
export function clampResources(list: Resource[] | undefined): Resource[] | undefined {
  if (!Array.isArray(list) || list.length === 0) return undefined;

  const clamped = list.slice(0, MAX_RESOURCES).map((resource) => {
    const maxValue = clampMaxHp(resource.maxValue);
    return { ...resource, maxValue, currentValue: clampHp(resource.currentValue, maxValue) };
  });

  return clamped.length > 0 ? clamped : undefined;
}

/**
 * Come `clampResources`, per gli effetti di stato: al massimo cinque, e
 * `undefined` quando non ce ne sono, così la barra si serializza identica a
 * prima che gli effetti esistessero.
 */
export function clampStatusEffects(
  list: StatusEffect[] | undefined,
): StatusEffect[] | undefined {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  const clamped = list.slice(0, MAX_STATUS_EFFECTS);
  return clamped.length > 0 ? clamped : undefined;
}

/** Espande #rgb in #rrggbb e restituisce le tre componenti. */
function hexToRgb(hex: string): [number, number, number] {
  let value = hex.replace('#', '').trim();
  if (value.length === 3) {
    value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
  }
  const int = Number.parseInt(value.slice(0, 6), 16);
  return Number.isFinite(int)
    ? [(int >> 16) & 255, (int >> 8) & 255, int & 255]
    : [255, 255, 255];
}

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** Fonde due colori esadecimali. `t` va da 0 (primo) a 1 (secondo). */
function mixHex(from: string, to: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return `#${toHex(r1 + (r2 - r1) * clamped)}${toHex(g1 + (g2 - g1) * clamped)}${toHex(
    b1 + (b2 - b1) * clamped,
  )}`;
}

/**
 * Colore attivo della barra secondo la modalità e la percentuale di salute.
 *
 * Accetta `ColoredBar`, non `HealthBar`: le risorse hanno le stesse tre
 * modalità di colore e passano di qui senza una riga in più.
 */
export function getBarColor(bar: ColoredBar): string {
  if (bar.colorMode === 'static') return bar.staticColor;

  const ratio = healthRatio(bar);
  const { low, mid, high } = bar.gradientColors;

  /**
   * Sfumato: il colore attraversa i tre valori con continuità, invece di
   * scattare da uno all'altro a soglie fisse. La metà bassa interpola
   * basso → medio, quella alta medio → alto.
   */
  if (bar.colorMode === 'smooth') {
    return ratio <= 0.5 ? mixHex(low, mid, ratio / 0.5) : mixHex(mid, high, (ratio - 0.5) / 0.5);
  }

  // A soglie: tre gradini netti.
  if (ratio <= 0.33) return low;
  if (ratio <= 0.66) return mid;
  return high;
}

export interface GroupedBars {
  /** Gruppi non vuoti, nell'ordine definito dall'utente. */
  groups: { name: string; bars: HealthBar[] }[];
  /** Barre senza gruppo, o con un gruppo che non esiste più. */
  ungrouped: HealthBar[];
}

export function groupBars(healthBars: HealthBar[], healthGroups: string[]): GroupedBars {
  const byGroup = new Map<string, HealthBar[]>();
  const ungrouped: HealthBar[] = [];
  const known = new Set(healthGroups);

  for (const bar of healthBars) {
    if (bar.group && known.has(bar.group)) {
      const list = byGroup.get(bar.group);
      if (list) list.push(bar);
      else byGroup.set(bar.group, [bar]);
    } else {
      ungrouped.push(bar);
    }
  }

  const groups = healthGroups
    .map((name) => ({ name, bars: byGroup.get(name) ?? [] }))
    .filter((g) => g.bars.length > 0);

  return { groups, ungrouped };
}
