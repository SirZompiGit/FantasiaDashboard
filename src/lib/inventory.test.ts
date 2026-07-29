import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '../types';
import { MAX_ITEM_QUANTITY, clampQuantity, itemQuantity, withQuantity } from './inventory';

describe('quantità degli oggetti', () => {
  it('non scende sotto uno né supera il tetto', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-7)).toBe(1);
    expect(clampQuantity(NaN)).toBe(1);
    expect(clampQuantity(10_000)).toBe(MAX_ITEM_QUANTITY);
    expect(clampQuantity(2.6)).toBe(3);
  });

  it('assente vale uno: gli oggetti creati prima non diventano zero', () => {
    expect(itemQuantity({})).toBe(1);
    expect(itemQuantity({ quantity: undefined })).toBe(1);
    expect(itemQuantity({ quantity: 4 })).toBe(4);
  });

  /**
   * Il vincolo di compatibilità: un oggetto singolo deve serializzarsi
   * esattamente come prima che la quantità esistesse, altrimenti ogni campagna
   * già salvata cambierebbe forma al primo caricamento.
   */
  it('toglie del tutto la chiave quando vale uno', () => {
    const item = { id: 'i', name: 'Corda', quantity: 3 };

    expect(withQuantity(item, 1)).not.toHaveProperty('quantity');
    expect(JSON.stringify(withQuantity(item, 1))).toBe(
      JSON.stringify({ id: 'i', name: 'Corda' }),
    );
  });

  it('conserva il resto dell oggetto e limita il valore', () => {
    const item: InventoryItem = { id: 'i', name: 'Frecce' };

    expect(withQuantity(item, 20)).toEqual({ id: 'i', name: 'Frecce', quantity: 20 });
    expect(withQuantity(item, 10_000).quantity).toBe(MAX_ITEM_QUANTITY);
  });
});
