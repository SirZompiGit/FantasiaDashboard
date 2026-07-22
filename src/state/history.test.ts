import { describe, expect, it, vi } from 'vitest';
import { canRedo, canUndo, createHistory, historyReducer } from './history';
import { createSeedCampaign } from './defaults';

const start = () => createHistory(createSeedCampaign());

describe('annulla e ripeti', () => {
  it('parte vuota', () => {
    const h = start();
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it('torna indietro e riapplica', () => {
    let h = historyReducer(start(), { type: 'SET_ACTIVE_PLAYER', id: 'p2' });
    expect(h.present.activePlayerId).toBe('p2');

    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present.activePlayerId).toBeNull();
    expect(canRedo(h)).toBe(true);

    h = historyReducer(h, { type: 'REDO' });
    expect(h.present.activePlayerId).toBe('p2');
  });

  /**
   * Il caso che l'annulla globale risolve davvero: prima un click distratto su
   * una barra vita cambiava gli HP senza alcun ritorno.
   */
  it('recupera un click distratto su una barra vita', () => {
    const h0 = start();
    const id = h0.present.healthBars[0].id;
    const before = h0.present.healthBars[0].currentValue;

    let h = historyReducer(h0, { type: 'UPDATE_HEALTH_BAR', id, changes: { currentValue: 3 } });
    expect(h.present.healthBars[0].currentValue).toBe(3);

    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present.healthBars[0].currentValue).toBe(before);
  });

  it('non fa nulla se non c e nulla da annullare', () => {
    const h = start();
    expect(historyReducer(h, { type: 'UNDO' }).present).toBe(h.present);
    expect(historyReducer(h, { type: 'REDO' }).present).toBe(h.present);
  });

  it('una nuova azione azzera il ramo di ripetizione', () => {
    let h = historyReducer(start(), { type: 'SET_TITLE', title: 'Uno' });
    h = historyReducer(h, { type: 'UNDO' });
    expect(canRedo(h)).toBe(true);

    h = historyReducer(h, { type: 'SET_TITLE', title: 'Due' });
    expect(canRedo(h)).toBe(false);
  });

  it('limita la profondita', () => {
    let h = start();
    for (let i = 0; i < 120; i++) {
      h = historyReducer(h, { type: 'ADD_PLAYER', name: `G${i}` });
    }
    expect(h.past).toHaveLength(60);
  });
});

/**
 * Senza fusione, trascinare una barra o scrivere una nota riempirebbe la
 * cronologia: un solo Ctrl+Z tornerebbe indietro di un punto ferita o di un
 * carattere.
 */
describe('fusione delle azioni continue', () => {
  it('un trascinamento occupa una sola voce', () => {
    let h = start();
    const id = h.present.healthBars[0].id;
    const before = h.present.healthBars[0].currentValue;

    for (let v = 60; v >= 40; v--) {
      h = historyReducer(h, { type: 'UPDATE_HEALTH_BAR', id, changes: { currentValue: v } });
    }

    expect(h.past).toHaveLength(1);
    expect(historyReducer(h, { type: 'UNDO' }).present.healthBars[0].currentValue).toBe(before);
  });

  it('separa i gesti distanti nel tempo', () => {
    vi.useFakeTimers();
    try {
      let h = historyReducer(start(), { type: 'SET_NOTES', text: 'a' });
      h = historyReducer(h, { type: 'SET_NOTES', text: 'ab' });
      expect(h.past).toHaveLength(1);

      vi.advanceTimersByTime(1000);
      h = historyReducer(h, { type: 'SET_NOTES', text: 'abc' });
      expect(h.past).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('non fonde modifiche di natura diversa sulla stessa barra', () => {
    let h = start();
    const id = h.present.healthBars[0].id;

    h = historyReducer(h, { type: 'UPDATE_HEALTH_BAR', id, changes: { name: 'A' } });
    h = historyReducer(h, { type: 'UPDATE_HEALTH_BAR', id, changes: { name: 'B' } });

    expect(h.past).toHaveLength(2);
  });

  it('non fonde barre diverse fra loro', () => {
    let h = start();
    const [a, b] = h.present.healthBars;

    h = historyReducer(h, { type: 'UPDATE_HEALTH_BAR', id: a.id, changes: { currentValue: 5 } });
    h = historyReducer(h, { type: 'UPDATE_HEALTH_BAR', id: b.id, changes: { currentValue: 5 } });

    expect(h.past).toHaveLength(2);
  });
});

describe('sincronizzazione fra schede', () => {
  it('non entra in cronologia: Ctrl+Z non deve annullare il lavoro altrui', () => {
    let h = historyReducer(start(), { type: 'SET_TITLE', title: 'Mia' });
    const depth = h.past.length;

    h = historyReducer(h, {
      type: 'SYNC',
      state: { ...h.present, title: 'Da un altra scheda' },
    });

    expect(h.past).toHaveLength(depth);
    expect(h.present.title).toBe('Da un altra scheda');
  });
});
