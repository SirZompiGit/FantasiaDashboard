/**
 * Quantità degli oggetti d'inventario.
 *
 * "Pozione di cura" scritta tre volte era l'unico modo per averne tre, e la
 * lista si riempiva di righe identiche. Ora l'oggetto è uno solo e porta con sé
 * quante se ne hanno.
 *
 * Il campo resta ASSENTE quando la quantità è uno: un oggetto singolo si
 * serializza esattamente come prima che la quantità esistesse, quindi le
 * campagne già salvate e le stanze aperte non cambiano di una virgola.
 */

import type { InventoryItem } from '../types';

export const MIN_ITEM_QUANTITY = 1;

/**
 * Tetto della quantità. Tre cifre bastano a monete, frecce e razioni, e tengono
 * la pastiglia "×N" della stessa larghezza in ogni riga.
 */
export const MAX_ITEM_QUANTITY = 999;

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_ITEM_QUANTITY;
  return Math.max(MIN_ITEM_QUANTITY, Math.min(Math.round(value), MAX_ITEM_QUANTITY));
}

/** Quantità effettiva: assente vale uno. */
export function itemQuantity(item: Pick<InventoryItem, 'quantity'>): number {
  return item.quantity === undefined ? MIN_ITEM_QUANTITY : clampQuantity(item.quantity);
}

/**
 * Applica la quantità a un oggetto, togliendo del tutto la chiave quando vale
 * uno. È il punto unico che garantisce la compatibilità descritta sopra.
 */
export function withQuantity<T extends InventoryItem>(item: T, quantity: number): T {
  const clamped = clampQuantity(quantity);
  if (clamped === MIN_ITEM_QUANTITY) {
    const { quantity: _dropped, ...rest } = item;
    return rest as T;
  }
  return { ...item, quantity: clamped };
}
