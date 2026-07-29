/**
 * Schede dei giocatori: inventario e bonus.
 *
 * Le due sezioni erano copiate quasi carattere per carattere, un centinaio di
 * righe ciascuna: ora sono un solo componente parametrico.
 * I controlli di modifica ed eliminazione, prima visibili solo al passaggio del
 * mouse, restano raggiungibili su touch.
 */

import { useState } from 'react';
import type { InventoryItem, Player } from '../types';
import type { CampaignAction } from '../state/campaignReducer';
import { Backpack, Check, Edit2, Plus, Sparkles, Trash2, Users, X } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';
import { IconButton } from './ui/IconButton';
import { StatBlock } from './StatBlock';
import { useToasts } from '../hooks/useToasts';
import { newId } from '../lib/ids';
import {
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
  clampQuantity,
  itemQuantity,
  withQuantity,
} from '../lib/inventory';

type Section = 'inventory' | 'bonus';

interface PlayerCardsProps {
  players: Player[];
  activePlayerId: string | null;
  dispatch: React.Dispatch<CampaignAction>;
  statsEnabled: boolean;
  statLabels: string[];
}

interface ItemSectionProps {
  player: Player;
  section: Section;
  title: string;
  placeholder: string;
  emptyText: string;
  accent: boolean;
  /**
   * Aggiunge il contatore accanto al nome. Vale per l'inventario — tre pozioni
   * sono una riga sola — ma non per i bonus, che non si contano.
   */
  quantities?: boolean;
  dispatch: React.Dispatch<CampaignAction>;
  onDeleted: (message: string, undo: () => void) => void;
}

/** Il campo resta una stringa mentre si scrive, così è possibile svuotarlo. */
const readQuantity = (raw: string) =>
  clampQuantity(Number.parseInt(raw, 10) || MIN_ITEM_QUANTITY);

function ItemSection({
  player,
  section,
  title,
  placeholder,
  emptyText,
  accent,
  quantities = false,
  dispatch,
  onDeleted,
}: ItemSectionProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingQuantity, setEditingQuantity] = useState('1');

  /**
   * Una sola forma per entrambe le sezioni: un bonus è un oggetto senza
   * quantità, e `quantity` è facoltativa. Tenendo due tipi distinti ogni
   * lettura del contatore avrebbe richiesto un cast.
   */
  const items: InventoryItem[] = player[section];

  const commit = (next: InventoryItem[]) =>
    dispatch({ type: 'UPDATE_PLAYER', id: player.id, changes: { [section]: next } });

  const addItem = () => {
    const name = draft.trim();
    if (!name) return;
    const item: InventoryItem = { id: newId(), name };
    commit([...items, quantities ? withQuantity(item, readQuantity(draftQuantity)) : item]);
    setDraft('');
    setDraftQuantity('1');
    setAdding(false);
  };

  const removeItem = (item: InventoryItem) => {
    const previous = items;
    commit(items.filter((i) => i.id !== item.id));
    onDeleted(`"${item.name}" rimosso.`, () => commit(previous));
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditingText(item.name);
    setEditingQuantity(String(itemQuantity(item)));
  };

  const saveEdit = (item: InventoryItem) => {
    const name = editingText.trim();
    if (name) {
      commit(
        items.map((i) => {
          if (i.id !== item.id) return i;
          const renamed = { ...i, name };
          return quantities ? withQuantity(renamed, readQuantity(editingQuantity)) : renamed;
        }),
      );
    }
    setEditingId(null);
  };

  return (
    <div className={`space-y-2 ${section === 'bonus' ? 'border-t border-bento-border pt-4' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
          {title} ({items.length})
        </span>
        <IconButton
          label={adding ? 'Annulla aggiunta' : `Aggiungi a ${title}`}
          tone="accent"
          onClick={() => {
            setAdding((v) => !v);
            setDraft('');
          }}
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </IconButton>
      </div>

      {adding && (
        <div className="flex gap-1.5 animate-fade-in">
          <input
            type="text"
            placeholder={placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addItem();
              if (event.key === 'Escape') setAdding(false);
            }}
            autoFocus
            maxLength={80}
            aria-label={placeholder}
            className="min-w-0 flex-grow rounded border border-bento-border bg-bento-bg px-2.5 py-1 text-xs text-slate-100 transition-colors duration-200 focus:border-theme-500 focus:outline-none"
          />
          {/* Il numero si imposta già alla creazione: aggiungere tre pozioni e
              poi riaprire la riga per correggerne la quantità era un passaggio
              in più su un gesto che si ripete a ogni bottino. */}
          {quantities && (
            <input
              type="number"
              inputMode="numeric"
              min={MIN_ITEM_QUANTITY}
              max={MAX_ITEM_QUANTITY}
              value={draftQuantity}
              onChange={(event) => setDraftQuantity(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addItem();
                if (event.key === 'Escape') setAdding(false);
              }}
              onBlur={() => setDraftQuantity(String(readQuantity(draftQuantity)))}
              aria-label="Quantità del nuovo oggetto"
              className="w-14 shrink-0 rounded border border-bento-border bg-bento-bg px-1.5 py-1 text-center font-mono text-xs text-slate-100 transition-colors duration-200 focus:border-theme-500 focus:outline-none"
            />
          )}
          <button
            type="button"
            onClick={addItem}
            disabled={!draft.trim()}
            className="shrink-0 rounded border border-theme-500 bg-theme-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors duration-200 hover:bg-theme-500 disabled:opacity-40"
          >
            Salva
          </button>
        </div>
      )}

      <div className="max-h-40 space-y-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
        {items.length === 0 ? (
          <p className="text-[11px] italic text-slate-600">{emptyText}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group/item flex items-center justify-between gap-2 rounded border border-bento-border bg-bento-bg px-2.5 py-1.5 text-xs transition-colors duration-200 hover:border-slate-600"
            >
              {editingId === item.id ? (
                <div className="flex w-full items-center gap-1">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') saveEdit(item);
                      if (event.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    maxLength={80}
                    aria-label={`Modifica ${item.name}`}
                    className="w-full min-w-0 rounded border border-theme-500/50 bg-bento-panel px-1.5 py-0.5 font-mono text-xs text-slate-100 focus:outline-none"
                  />
                  {quantities && (
                    <input
                      type="number"
                      inputMode="numeric"
                      min={MIN_ITEM_QUANTITY}
                      max={MAX_ITEM_QUANTITY}
                      value={editingQuantity}
                      onChange={(event) => setEditingQuantity(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveEdit(item);
                        if (event.key === 'Escape') setEditingId(null);
                      }}
                      aria-label={`Quantità di ${item.name}`}
                      className="w-12 shrink-0 rounded border border-theme-500/50 bg-bento-panel px-1 py-0.5 text-center font-mono text-xs text-slate-100 focus:outline-none"
                    />
                  )}
                  <IconButton label="Salva" tone="positive" onClick={() => saveEdit(item)}>
                    <Check className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              ) : (
                <>
                  <span
                    className={`min-w-0 truncate pr-2 font-mono ${
                      accent ? 'text-theme-400' : 'text-slate-300'
                    }`}
                  >
                    {item.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {/* La pastiglia compare solo oltre l'unità: un oggetto
                        singolo resta una riga pulita, com'è sempre stato. */}
                    {quantities && itemQuantity(item) > 1 && (
                      <span className="mr-1 rounded border border-bento-border bg-bento-panel px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                        ×{itemQuantity(item)}
                      </span>
                    )}
                    <span className="touch-visible flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover/item:opacity-100 group-focus-within/item:opacity-100">
                      <IconButton
                        label={`Modifica ${item.name}`}
                        tone="accent"
                        onClick={() => startEdit(item)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </IconButton>
                      <IconButton
                        label={`Elimina ${item.name}`}
                        tone="danger"
                        onClick={() => removeItem(item)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </IconButton>
                    </span>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function PlayerCards({
  players,
  activePlayerId,
  dispatch,
  statsEnabled,
  statLabels,
}: PlayerCardsProps) {
  const { notifyUndo } = useToasts();

  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="font-display text-base font-semibold uppercase tracking-wider text-slate-200">
          Schede dei Giocatori
        </h2>
        <span className="h-px flex-grow bg-bento-border" />
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun giocatore"
          hint="Aggiungi i partecipanti nell'intestazione in alto per vedere qui le loro schede."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => {
            const isActive = activePlayerId === player.id;
            return (
              <article
                key={player.id}
                className={`relative flex flex-col overflow-hidden rounded-xl border bg-bento-panel p-4 shadow-panel transition-colors duration-200 sm:p-5 ${
                  isActive
                    ? 'border-theme-500 ring-1 ring-theme-500/20'
                    : 'border-bento-border hover:border-slate-600'
                }`}
              >
                <span
                  className={`absolute inset-y-0 left-0 w-1.5 ${
                    isActive ? 'bg-theme-600' : 'bg-theme-500/5'
                  }`}
                />

                <div className="mb-4 flex items-center justify-between gap-2 border-b border-bento-border pb-3 pl-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate font-display text-base font-extrabold tracking-wide text-slate-100">
                      {player.name}
                    </h3>
                    {isActive && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-theme-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-theme-500">
                        <Sparkles className="h-2.5 w-2.5" /> Turno
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full border border-bento-border bg-bento-bg p-1 text-slate-500">
                    <Backpack className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="flex-grow space-y-5 pl-2">
                  {statsEnabled && (
                    <div className="space-y-1.5">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Statistiche
                      </span>
                      <StatBlock
                        labels={statLabels}
                        stats={player.stats}
                        dense
                        onChange={(next) =>
                          dispatch({
                            type: 'UPDATE_PLAYER',
                            id: player.id,
                            changes: { stats: next },
                          })
                        }
                      />
                    </div>
                  )}

                  <ItemSection
                    player={player}
                    section="inventory"
                    title="Inventario"
                    placeholder="Nuovo oggetto..."
                    emptyText="Inventario vuoto."
                    accent={false}
                    quantities
                    dispatch={dispatch}
                    onDeleted={notifyUndo}
                  />
                  <ItemSection
                    player={player}
                    section="bonus"
                    title="Bonus / Attributi"
                    placeholder="Nuovo bonus (es. +2 Iniziativa)..."
                    emptyText="Nessun bonus registrato."
                    accent
                    dispatch={dispatch}
                    onDeleted={notifyUndo}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
