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
  // Sono 11, in rapporto 1:1 con i colori pieni; ognuno ha un'animazione propria.
  | 'arcobaleno'
  | 'aurora'
  | 'tramonto'
  | 'oceano'
  | 'magma'
  | 'veleno'
  | 'spettro'
  | 'brace'
  | 'bosco'
  | 'ghiaccio'
  | 'cromia';

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

  // Temi animati — un set a parte, su una riga a sé nel selettore, in numero
  // pari ai colori pieni (11). Lo swatch è un gradiente animato; il colore qui
  // sotto è solo il fermo-immagine per le particelle su canvas.
  { id: 'arcobaleno', label: 'Arcobaleno', swatch: '#a855f7', accent: '#a855f7', animated: true },
  { id: 'aurora', label: 'Aurora', swatch: '#22d3ee', accent: '#22d3ee', animated: true },
  { id: 'tramonto', label: 'Tramonto', swatch: '#fb7185', accent: '#fb7185', animated: true },
  { id: 'oceano', label: 'Oceano', swatch: '#38bdf8', accent: '#38bdf8', animated: true },
  { id: 'magma', label: 'Magma', swatch: '#f97316', accent: '#f97316', animated: true },
  { id: 'veleno', label: 'Veleno', swatch: '#84cc16', accent: '#84cc16', animated: true },
  { id: 'spettro', label: 'Spettro', swatch: '#8b5cf6', accent: '#8b5cf6', animated: true },
  { id: 'brace', label: 'Brace', swatch: '#f97316', accent: '#ef4444', animated: true },
  { id: 'bosco', label: 'Bosco', swatch: '#22c55e', accent: '#16a34a', animated: true },
  { id: 'ghiaccio', label: 'Ghiaccio', swatch: '#7dd3fc', accent: '#38bdf8', animated: true },
  { id: 'cromia', label: 'Cromia', swatch: '#ec4899', accent: '#a855f7', animated: true },
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
  | 'fumetto'
  | 'taverna'
  | 'olografico'
  | 'nebbia';

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
  // Ultimi tre, rielaborati per avere personalità netta e non somigliarsi.
  { id: 'ombra', label: 'Ombra', hint: 'Cattedrale nera, oro cesellato, alone del tema' },
  { id: 'fumetto', label: 'Fumetto', hint: 'Contorni d’inchiostro, retino, ombre nette' },
  { id: 'taverna', label: 'Taverna', hint: 'Assi di legno, borchie d’ottone, cuoio' },
  // Due design nuovi, tutti giocati sulla trasparenza, sulla scia di Arcano.
  { id: 'olografico', label: 'Olografico', hint: 'Vetro iridescente, riflessi cangianti' },
  { id: 'nebbia', label: 'Nebbia', hint: 'Foschia chiara, vetri smerigliati e soffici' },
];

/**
 * Design su fondo chiaro: il marchio dorato non si legge e va usato quello nero.
 * Sono White, Pergamena, Fumetto (carta bianca) e Nebbia (foschia chiara).
 */
export function isLightStyle(style: CampaignStyle): boolean {
  return (
    style === 'white' ||
    style === 'pergamena' ||
    style === 'fumetto' ||
    style === 'nebbia'
  );
}

/**
 * Design delle SOLE barre della vita — un asse a parte dal design generale.
 * Cambia l'aspetto della traccia e dei segmenti (forma, bagliore, tacche), non
 * i colori, che restano guidati dal tema. `classico` è quello attuale.
 */
export type BarStyle =
  | 'classico'
  | 'piatto'
  | 'cornice'
  | 'vetro'
  | 'tacche'
  | 'reattore'
  | 'onda'
  | 'circolare';

export const DEFAULT_BAR_STYLE: BarStyle = 'classico';

/**
 * Ogni design ridisegna l'INTERA scheda della barra (contenitore, traccia
 * principale e risorse), non solo la barra principale, e usa colori adattivi
 * (token del design, tema, colore della barra) così sta bene su ogni design.
 */
export const BAR_STYLES: { id: BarStyle; label: string; hint: string }[] = [
  { id: 'classico', label: 'Classico', hint: 'Scheda morbida, segmenti che brillano' },
  { id: 'piatto', label: 'Piatto', hint: 'Scheda essenziale, tutto piatto e minimale' },
  { id: 'cornice', label: 'Cornice', hint: 'Scheda incorniciata, filo del tema in cima' },
  { id: 'vetro', label: 'Vetro', hint: 'Scheda di vetro, tracce a pillola lucida' },
  { id: 'tacche', label: 'Tacche', hint: 'Tracce incise a segmenti, bordo tratteggiato' },
  { id: 'reattore', label: 'Reattore', hint: 'Scheda e tracce che pulsano nel colore' },
  { id: 'onda', label: 'Onda', hint: 'Tracce a nastro sinusoidale che scorre' },
  // Non è una skin CSS ma un layout a sé: anelli invece di tracce lineari.
  { id: 'circolare', label: 'Circolare', hint: 'Anelli: barra a destra, risorse a sinistra' },
];

const BAR_STYLE_IDS = new Set<string>(BAR_STYLES.map((b) => b.id));

export function normalizeBarStyle(value: unknown): BarStyle {
  return typeof value === 'string' && BAR_STYLE_IDS.has(value)
    ? (value as BarStyle)
    : DEFAULT_BAR_STYLE;
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
export function applyTheme(
  theme: CampaignTheme,
  style: CampaignStyle = DEFAULT_STYLE,
  barStyle: BarStyle = DEFAULT_BAR_STYLE,
): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = normalizeTheme(theme);
  root.dataset.style = normalizeStyle(style);
  // Terzo asse indipendente: l'aspetto delle sole barre della vita.
  root.dataset.bar = normalizeBarStyle(barStyle);

  if (!root.classList.contains('theme-transitions')) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add('theme-transitions'));
    });
  }
}
