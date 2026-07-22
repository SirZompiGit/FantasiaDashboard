import { describe, expect, it } from 'vitest';
import {
  migrateStoredState,
  normalizeCampaign,
  parseImportedCampaign,
  serializeState,
} from './migrations';

/**
 * Prima l'import controllava solo `title` e `players` e poi salvava tutto: un
 * file senza `healthBars` faceva esplodere il render successivo, e lo stato
 * corrotto era già in localStorage — l'app non si riapriva più.
 */
describe('normalizeCampaign non lancia mai', () => {
  const junk: unknown[] = [
    null,
    undefined,
    42,
    'stringa',
    [],
    {},
    { title: 'X' },
    { title: 'X', players: null, healthBars: null },
    { title: 'X', players: [null, 3, { name: '' }] },
    { title: 'X', healthBars: [{ nope: 1 }] },
    { title: 'X', rollHistory: [{ diceType: 'nope' }] },
    { title: 'X', theme: 'inesistente', style: 42 },
  ];

  it.each(junk.map((input, i) => [i, input]))(
    'input malformato #%i produce comunque una campagna valida',
    (_index, input) => {
      const state = normalizeCampaign(input);
      expect(Array.isArray(state.players)).toBe(true);
      expect(Array.isArray(state.healthBars)).toBe(true);
      expect(Array.isArray(state.rollHistory)).toBe(true);
      expect(typeof state.title).toBe('string');
    },
  );
});

describe('normalizeCampaign applica i limiti', () => {
  it('taglia un massimo HP fuori scala', () => {
    const state = normalizeCampaign({
      title: 'X',
      healthBars: [{ name: 'Boss', maxValue: 999999, currentValue: -5 }],
    });
    expect(state.healthBars[0].maxValue).toBe(999);
    expect(state.healthBars[0].currentValue).toBe(0);
  });

  it('azzera un giocatore attivo che non esiste piu', () => {
    expect(normalizeCampaign({ title: 'X', activePlayerId: 'fantasma' }).activePlayerId).toBeNull();
  });

  it('scarta i lanci non validi e tiene quelli buoni', () => {
    const state = normalizeCampaign({
      title: 'X',
      rollHistory: [{ diceType: 'nope' }, { diceType: 'd20', result: 20, timestamp: 1 }],
    });
    expect(state.rollHistory).toHaveLength(1);
  });

  it('attiva l allerta sulle barre create prima che esistesse', () => {
    const state = normalizeCampaign({
      title: 'X',
      healthBars: [{ name: 'Vecchia', maxValue: 10, currentValue: 5 }],
    });
    expect(state.healthBars[0].lowHpAlert).toBe(true);
  });

  it('conserva una disattivazione esplicita', () => {
    const state = normalizeCampaign({
      title: 'X',
      healthBars: [{ name: 'Spenta', maxValue: 10, currentValue: 5, lowHpAlert: false }],
    });
    expect(state.healthBars[0].lowHpAlert).toBe(false);
  });

  it('accetta le tre modalita colore e rifiuta le altre', () => {
    const mode = (colorMode: unknown) =>
      normalizeCampaign({ title: 'X', healthBars: [{ name: 'B', colorMode }] }).healthBars[0]
        .colorMode;

    expect(mode('gradient')).toBe('gradient');
    expect(mode('smooth')).toBe('smooth');
    expect(mode('arcobaleno')).toBe('static');
  });
});

describe('formati salvati', () => {
  it('legge il formato senza involucro delle versioni precedenti', () => {
    const legacy = JSON.stringify({
      title: 'Campagna storica',
      players: [{ id: 'p1', name: 'Kaelen', inventory: [], bonus: [] }],
      theme: 'emerald',
      healthGroups: ['Nemici'],
    });

    const state = migrateStoredState(legacy);
    expect(state?.title).toBe('Campagna storica');
    expect(state?.theme).toBe('emerald');
    expect(state?.healthGroups[0]).toBe('Nemici');
    // Il design non esisteva ancora: ricade sul predefinito senza perdite.
    expect(state?.style).toBe('grimorio');
  });

  it('fa il giro completo con l involucro versionato', () => {
    const original = normalizeCampaign({ title: 'Mia campagna' });
    const restored = migrateStoredState(serializeState(original));
    expect(restored?.title).toBe('Mia campagna');
    expect(JSON.parse(serializeState(original)).v).toBe(2);
  });

  it('restituisce null su dati illeggibili invece di lanciare', () => {
    expect(migrateStoredState('{rotto')).toBeNull();
    expect(migrateStoredState(null)).toBeNull();
    expect(migrateStoredState('[]')).toBeNull();
  });
});

describe('parseImportedCampaign', () => {
  it('accetta un file valido', () => {
    expect(parseImportedCampaign('{"title":"Ok","players":[]}').ok).toBe(true);
  });

  it('rifiuta con un messaggio leggibile', () => {
    expect(parseImportedCampaign('non json').error).toBeTruthy();
    expect(parseImportedCampaign('{"players":[]}').ok).toBe(false);
  });
});
