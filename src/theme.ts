/**
 * Temi di FANTASIA.
 *
 * Prima questo file esportava `getThemeColors()`, che restituiva stringhe di
 * classi Tailwind poi composte a runtime nei componenti (`hover:${colors.hoverBg}`).
 * Tailwind estrae i nomi delle classi dal testo sorgente a build time, quindi
 * quelle classi non venivano MAI generate: hover, focus ring e trasparenze
 * legate al tema erano no-op silenziosi in ~127 punti dell'interfaccia.
 *
 * Ora il tema vive in variabili CSS su <html data-theme="...">, definite in
 * index.css. I componenti usano classi statiche reali: `bg-theme-600`,
 * `hover:bg-theme-500`, `focus:ring-theme-500/20`, `text-theme-400`.
 */

export type CampaignTheme =
  | 'crimson'
  | 'emerald'
  | 'sapphire'
  | 'amber'
  | 'amethyst'
  | 'abyss'
  | 'rose'
  | 'obsidian'
  | 'lime'
  | 'indigo'
  | 'gold'
  // Temi animati: la palette scorre nel tempo (vedi @keyframes in index.css).
  | 'arcobaleno'
  | 'aurora'
  | 'tramonto'
  | 'oceano'
  | 'magma';

export const DEFAULT_THEME: CampaignTheme = 'crimson';

export interface ThemeDefinition {
  id: CampaignTheme;
  /** Nome mostrato nel selettore temi. */
  label: string;
  /** Colore del pallino nel selettore. Statico: non dipende dal tema attivo. */
  swatch: string;
  /** Esadecimale del colore d'accento, per canvas/particelle che non usano CSS. */
  accent: string;
  /**
   * Tema animato: la palette cambia nel tempo via CSS (@keyframes). Nel
   * selettore lo swatch mostra un gradiente animato invece di un colore pieno,
   * e questi temi vivono su una riga a parte. `accent` resta un colore fisso
   * rappresentativo, per le particelle su canvas che leggono l'esadecimale.
   */
  animated?: boolean;
}

/**
 * I quattro temi storici conservano chiave e colori esatti, così le campagne
 * già salvate (localStorage e database) si riaprono identiche.
 */
export const THEMES: ThemeDefinition[] = [
  { id: 'crimson', label: 'Vampiro', swatch: '#ef4444', accent: '#ef4444' },
  { id: 'emerald', label: 'Druido', swatch: '#10b981', accent: '#10b981' },
  { id: 'sapphire', label: 'Mago', swatch: '#3b82f6', accent: '#3b82f6' },
  { id: 'amber', label: 'Oste', swatch: '#f59e0b', accent: '#f59e0b' },
  { id: 'amethyst', label: 'Stregone', swatch: '#8b5cf6', accent: '#8b5cf6' },
  { id: 'abyss', label: 'Monaco', swatch: '#06b6d4', accent: '#06b6d4' },
  // Chiave invariata per compatibilità; il colore è magenta, non più rosa.
  { id: 'rose', label: 'Bardo', swatch: '#d946ef', accent: '#d946ef' },
  { id: 'obsidian', label: 'Ladro', swatch: '#94a3b8', accent: '#94a3b8' },
  // Tinte nuove, in gamme non ancora usate: verde acido, indaco e oro.
  { id: 'lime', label: 'Alchimista', swatch: '#84cc16', accent: '#84cc16' },
  { id: 'indigo', label: 'Illusionista', swatch: '#6366f1', accent: '#6366f1' },
  // Giallo pieno, spostato verso il limone: distinto dall'arancio dell'Oste.
  { id: 'gold', label: 'Paladino', swatch: '#facc15', accent: '#facc15' },

  // Temi animati — un set a parte, su una seconda riga nel selettore. Lo swatch
  // è un gradiente animato; il colore qui sotto serve solo alle particelle.
  { id: 'arcobaleno', label: 'Arcobaleno', swatch: '#a855f7', accent: '#a855f7', animated: true },
  { id: 'aurora', label: 'Aurora', swatch: '#22d3ee', accent: '#22d3ee', animated: true },
  { id: 'tramonto', label: 'Tramonto', swatch: '#fb7185', accent: '#fb7185', animated: true },
  { id: 'oceano', label: 'Oceano', swatch: '#38bdf8', accent: '#38bdf8', animated: true },
  { id: 'magma', label: 'Magma', swatch: '#f97316', accent: '#f97316', animated: true },
];

/** Solo i temi a colore pieno: prima riga di swatch e default sicuri. */
export const SOLID_THEMES: ThemeDefinition[] = THEMES.filter((t) => !t.animated);

/** I temi animati, resi su una riga a parte con swatch a gradiente. */
export const ANIMATED_THEMES: ThemeDefinition[] = THEMES.filter((t) => t.animated);

/**
 * Asse indipendente dal colore: cambia forme, densità e tipografia, non la
 * palette. I due assi si combinano liberamente (11 colori × 11 design).
 */
export type CampaignStyle =
  | 'grimorio'
  | 'arcano'
  | 'runico'
  | 'white'
  | 'retro'
  | 'pergamena'
  | 'neon'
  | 'ferro'
  | 'ombra'
  | 'cristallo'
  | 'taverna';

export const DEFAULT_STYLE: CampaignStyle = 'grimorio';

export interface StyleDefinition {
  id: CampaignStyle;
  label: string;
  hint: string;
}

/**
 * Tre linguaggi visivi distinti, non tre regolazioni dello stesso.
 * Cambiano forme, superfici, profondità e carattere tipografico; il colore
 * resta guidato dal tema scelto.
 */
export const STYLES: StyleDefinition[] = [
  { id: 'grimorio', label: 'Grimorio', hint: 'Angoli vivi, bordi spessi, serif' },
  { id: 'arcano', label: 'Arcano', hint: 'Vetro sfocato, aloni di luce, curve ampie' },
  { id: 'runico', label: 'Runico', hint: 'Piatto, monospace, nessuna curva' },
  { id: 'white', label: 'White', hint: 'Chiaro, pulito, testo scuro' },
  { id: 'retro', label: 'Retro', hint: 'Pixel, scanline, cornici spesse' },
  { id: 'pergamena', label: 'Pergamena', hint: 'Carta antica, sepia, serif caldo' },
  { id: 'neon', label: 'Neon', hint: 'Contorni luminosi, griglia, sci-fi' },
  { id: 'ferro', label: 'Ferro', hint: 'Acciaio, smussi, condensato industriale' },
  { id: 'ombra', label: 'Ombra', hint: 'Nero pieno, contrasto forte, serif gotico' },
  { id: 'cristallo', label: 'Cristallo', hint: 'Chiaro, vetro ghiacciato, nitido' },
  { id: 'taverna', label: 'Taverna', hint: 'Legno scuro, cuoio, ottone caldo' },
];

/**
 * Design su fondo chiaro: il marchio dorato non si legge e va usato quello nero.
 * White, Pergamena e Cristallo sono i tre design chiari.
 */
export function isLightStyle(style: CampaignStyle): boolean {
  return style === 'white' || style === 'pergamena' || style === 'cristallo';
}

/**
 * Variante del marchio.
 *
 * `normal`  — il logo dorato originale
 * `colored` — la sagoma del logo riempita con il colore del tema scelto
 *
 * Il design chiaro fa eccezione e usa sempre la versione nera: l'oro su fondo
 * chiaro non si legge.
 */
export type LogoVariant = 'normal' | 'colored';

export const DEFAULT_LOGO_VARIANT: LogoVariant = 'normal';

export const LOGO_VARIANTS: { id: LogoVariant; label: string; hint: string }[] = [
  { id: 'normal', label: 'Normale', hint: 'Oro originale' },
  { id: 'colored', label: 'Colorato', hint: 'Segue il colore scelto' },
];

export function normalizeLogoVariant(value: unknown): LogoVariant {
  return value === 'colored' ? 'colored' : DEFAULT_LOGO_VARIANT;
}

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id));
const STYLE_IDS = new Set<string>(STYLES.map((s) => s.id));

export function normalizeStyle(value: unknown): CampaignStyle {
  return typeof value === 'string' && STYLE_IDS.has(value)
    ? (value as CampaignStyle)
    : DEFAULT_STYLE;
}

/** Normalizza un valore arrivato da localStorage o dal database. */
export function normalizeTheme(value: unknown): CampaignTheme {
  return typeof value === 'string' && THEME_IDS.has(value)
    ? (value as CampaignTheme)
    : DEFAULT_THEME;
}

export function getThemeDefinition(theme: CampaignTheme): ThemeDefinition {
  return THEMES.find((t) => t.id === theme) ?? THEMES[0];
}

/** Esadecimale d'accento, per le particelle disegnate via style inline. */
export function getThemeAccent(theme: CampaignTheme): string {
  return getThemeDefinition(theme).accent;
}

/**
 * Applica il tema al documento.
 *
 * La classe `theme-transitions` viene aggiunta solo dopo il primo paint: le
 * proprietà registrate con @property sono interpolabili, e senza questa
 * accortezza al primo caricamento si vedrebbe una dissolvenza dal colore
 * iniziale a quello salvato.
 */
export function applyTheme(theme: CampaignTheme, style: CampaignStyle = DEFAULT_STYLE): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = normalizeTheme(theme);
  root.dataset.style = normalizeStyle(style);

  if (!root.classList.contains('theme-transitions')) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add('theme-transitions'));
    });
  }
}
