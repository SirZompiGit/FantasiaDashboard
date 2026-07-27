import { describe, expect, it } from 'vitest';
import {
  ANIMATED_THEMES,
  BAR_STYLES,
  DEFAULT_BAR_STYLE,
  DEFAULT_LOGO_VARIANT,
  DEFAULT_STYLE,
  LOGO_VARIANTS,
  SOLID_THEMES,
  STYLES,
  THEMES,
  isLightStyle,
  normalizeBarStyle,
  normalizeLogoVariant,
  normalizeStyle,
  normalizeTheme,
} from './theme';

describe('temi di colore', () => {
  it('conserva le chiavi storiche, che sono salvate nelle campagne', () => {
    for (const id of ['crimson', 'emerald', 'sapphire', 'amber']) {
      expect(THEMES.some((t) => t.id === id)).toBe(true);
      expect(normalizeTheme(id)).toBe(id);
    }
  });

  it('ricade sul predefinito su valori sconosciuti', () => {
    expect(normalizeTheme('boh')).toBe('crimson');
    expect(normalizeTheme(null)).toBe('crimson');
    expect(normalizeTheme(42)).toBe('crimson');
  });

  it('include i colori nuovi', () => {
    for (const id of ['lime', 'indigo', 'gold']) {
      expect(THEMES.some((t) => t.id === id)).toBe(true);
      expect(normalizeTheme(id)).toBe(id);
    }
  });

  it('include il set animato, marcato come tale', () => {
    const ids = ANIMATED_THEMES.map((t) => t.id);
    expect(ids).toEqual([
      'arcobaleno',
      'aurora',
      'tramonto',
      'oceano',
      'magma',
      'veleno',
      'spettro',
      'brace',
      'bosco',
      'ghiaccio',
      'cromia',
    ]);
    for (const def of ANIMATED_THEMES) {
      expect(def.animated).toBe(true);
      expect(normalizeTheme(def.id)).toBe(def.id);
    }
    // Le due liste partizionano THEMES: pieni + animati = tutto, senza overlap.
    expect(SOLID_THEMES.length + ANIMATED_THEMES.length).toBe(THEMES.length);
    expect(SOLID_THEMES.every((t) => !t.animated)).toBe(true);
  });

  // Requisito V5: gli animati sono in rapporto 1:1 con i colori pieni.
  it('ha tanti temi animati quanti colori pieni', () => {
    expect(ANIMATED_THEMES.length).toBe(SOLID_THEMES.length);
  });

  /**
   * Vampiro e Bardo erano entrambi rossi e distavano 10° sulla ruota dei
   * colori: a schermo risultavano indistinguibili.
   */
  it('non ha due colori confondibili', () => {
    // Solo le tinte piene devono avere swatch distinti: gli swatch degli
    // animati sono solo un'anteprima a gradiente e possono ripetere un colore.
    const swatches = SOLID_THEMES.map((t) => t.swatch);
    expect(new Set(swatches).size).toBe(SOLID_THEMES.length);

    const bardo = THEMES.find((t) => t.id === 'rose');
    const vampiro = THEMES.find((t) => t.id === 'crimson');
    expect(bardo?.swatch).not.toBe('#f43f5e');
    expect(bardo?.swatch).not.toBe(vampiro?.swatch);
  });
});

describe('design', () => {
  it('il predefinito esiste nell elenco', () => {
    expect(STYLES.some((s) => s.id === DEFAULT_STYLE)).toBe(true);
  });

  it('accetta quelli in elenco', () => {
    for (const style of STYLES) {
      expect(normalizeStyle(style.id)).toBe(style.id);
    }
  });

  it('include i design nuovi', () => {
    for (const id of ['pergamena', 'neon', 'ferro', 'ombra', 'fumetto', 'taverna', 'olografico', 'nebbia']) {
      expect(STYLES.some((s) => s.id === id)).toBe(true);
      expect(normalizeStyle(id)).toBe(id);
    }
  });

  // 'cristallo' è stato sostituito da 'fumetto': i vecchi salvataggi ricadono
  // sul predefinito invece di rompersi.
  it('fa ricadere il design cristallo, ora rimosso, sul predefinito', () => {
    expect(normalizeStyle('cristallo')).toBe(DEFAULT_STYLE);
    // `id` non contiene più 'cristallo' nel tipo: confronto via stringa.
    expect(STYLES.some((s) => (s.id as string) === 'cristallo')).toBe(false);
  });

  /**
   * Solo i design su fondo chiaro impongono il marchio nero: White, Pergamena,
   * Fumetto (carta) e Nebbia (foschia). Ombra, Taverna e Olografico sono scuri.
   */
  it('segna come chiari solo i design su fondo chiaro', () => {
    for (const light of ['white', 'pergamena', 'fumetto', 'nebbia'] as const) {
      expect(isLightStyle(light)).toBe(true);
    }
    for (const dark of [
      'grimorio',
      'arcano',
      'runico',
      'retro',
      'neon',
      'ferro',
      'ombra',
      'taverna',
      'olografico',
    ] as const) {
      expect(isLightStyle(dark)).toBe(false);
    }
  });

  /**
   * I design rimossi lungo il percorso non devono impedire di riaprire una
   * campagna che li aveva salvati.
   */
  it('fa ricadere sul predefinito i design rimossi', () => {
    for (const removed of ['bento', 'compatto', 'sangue-scuro', 'sangue-chiaro']) {
      expect(normalizeStyle(removed)).toBe(DEFAULT_STYLE);
    }
    expect(normalizeStyle(undefined)).toBe(DEFAULT_STYLE);
  });
});

describe('design delle barre', () => {
  it('parte dal classico, presente in elenco', () => {
    expect(DEFAULT_BAR_STYLE).toBe('classico');
    expect(BAR_STYLES.some((b) => b.id === 'classico')).toBe(true);
  });

  it('propone diversi design oltre al classico', () => {
    expect(BAR_STYLES).toHaveLength(8);
    for (const id of ['piatto', 'cornice', 'vetro', 'tacche', 'reattore', 'onda', 'circolare']) {
      expect(BAR_STYLES.some((b) => b.id === id)).toBe(true);
    }
  });

  it('accetta i valori previsti e ricade sul classico', () => {
    for (const b of BAR_STYLES) expect(normalizeBarStyle(b.id)).toBe(b.id);
    expect(normalizeBarStyle('boh')).toBe(DEFAULT_BAR_STYLE);
    expect(normalizeBarStyle(undefined)).toBe(DEFAULT_BAR_STYLE);
    expect(normalizeBarStyle(42)).toBe(DEFAULT_BAR_STYLE);
  });
});

describe('variante del marchio', () => {
  it('ne offre due', () => {
    expect(LOGO_VARIANTS.map((v) => v.id)).toEqual(['normal', 'colored']);
  });

  it('parte da quella originale', () => {
    expect(DEFAULT_LOGO_VARIANT).toBe('normal');
  });

  it('accetta solo i valori previsti', () => {
    expect(normalizeLogoVariant('colored')).toBe('colored');
    expect(normalizeLogoVariant('normal')).toBe('normal');
    // Le campagne salvate prima non hanno il campo.
    expect(normalizeLogoVariant(undefined)).toBe('normal');
    expect(normalizeLogoVariant('arcobaleno')).toBe('normal');
    expect(normalizeLogoVariant(42)).toBe('normal');
  });
});
