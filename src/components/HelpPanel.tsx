/**
 * Guida rapida: scorciatoie e installazione.
 *
 * Prima era il solo elenco delle scorciatoie, raggiungibile da un collegamento
 * in fondo alla pagina — cioè sotto tutta la dashboard, dove non lo trovava
 * nessuno. Ora c'è un "?" nella barra in alto, sempre in vista, e dietro ci
 * sono le due cose che si vanno a cercare: come si comanda l'app da tastiera e
 * come la si installa.
 *
 * Due schede e non un unico elenco: sono argomenti diversi, e appaiati
 * costringerebbero a scorrere oltre venti scorciatoie per arrivare alle
 * istruzioni di installazione.
 */

import { useEffect, useState } from 'react';
import { Check, HelpCircle, Keyboard, MonitorDown } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = 'shortcuts' | 'install';

const GROUPS: { title: string; items: { keys: string[]; action: string }[] }[] = [
  {
    title: 'Dadi',
    items: [
      { keys: ['1', '…', '7'], action: 'Seleziona il dado, da d3 a d20' },
      { keys: ['Spazio'], action: 'Lancia il dado selezionato' },
      { keys: ['R'], action: 'Lancia il dado selezionato' },
    ],
  },
  {
    title: 'Barre della vita',
    items: [
      { keys: ['←', '→'], action: 'Regola gli HP della barra che ha il focus' },
      { keys: ['Shift', '+', '←/→'], action: 'Regola gli HP a passi di 5' },
      { keys: ['Home'], action: 'Porta la barra a 0' },
      { keys: ['Fine'], action: 'Porta la barra al massimo' },
    ],
  },
  {
    title: 'Campagna',
    items: [
      { keys: ['Ctrl', '+', 'Z'], action: 'Annulla l’ultima modifica' },
      { keys: ['Ctrl', '+', 'Shift', '+', 'Z'], action: 'Ripeti' },
      { keys: ['Ctrl', '+', 'S'], action: 'Esporta la campagna in JSON' },
      { keys: ['Trascina'], action: 'Rilascia un file JSON sulla pagina per importarlo' },
    ],
  },
  {
    title: 'Interfaccia',
    items: [
      { keys: ['?'], action: 'Apri questa guida' },
      { keys: ['Esc'], action: 'Chiudi finestre e anteprima condivisa' },
    ],
  },
];

/**
 * Istruzioni per piattaforma.
 *
 * Scritte per esteso e non riassunte in "usa il menu del browser": il percorso
 * cambia da un browser all'altro, e su iPhone il pulsante di installazione non
 * può proprio esistere — Apple non consente a una pagina di avviarlo.
 */
const PLATFORMS: { title: string; steps: string[] }[] = [
  {
    title: 'Windows e Mac — Chrome o Edge',
    steps: [
      'Nella barra degli indirizzi, a destra, compare un’icona con un monitor e una freccia: cliccala e conferma «Installa».',
      'In alternativa: menu ⋮ → Trasmetti, salva e condividi → Installa Fantasia. Su Edge: ⋯ → App → Installa questo sito come app.',
    ],
  },
  {
    title: 'Android — Chrome',
    steps: ['Menu ⋮ → Aggiungi a schermata Home, oppure il pulsante qui sopra.'],
  },
  {
    title: 'iPhone e iPad — Safari',
    steps: [
      'Tasto Condividi (il quadrato con la freccia) → Aggiungi a Home.',
      'Qui il pulsante automatico non compare: Apple non permette a una pagina di avviare l’installazione. Icona e schermo pieno funzionano lo stesso.',
    ],
  },
];

export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
  const [tab, setTab] = useState<Tab>('shortcuts');
  const { canInstall, installed, install } = useInstallPrompt();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '?') return;

      // Il punto interrogativo si scrive: mentre si compila un campo la
      // scorciatoia non deve attivarsi.
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
      ) {
        return;
      }

      event.preventDefault();
      onOpenChange(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange]);

  const tabClass = (id: Tab) =>
    `flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${
      tab === id
        ? 'border-theme-500/50 bg-bento-item text-theme-400'
        : 'border-bento-border bg-bento-panel/40 text-slate-500 hover:border-slate-600 hover:text-slate-300'
    }`;

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      size="md"
      fitContent
      title={
        <>
          <HelpCircle className="h-4 w-4 text-theme-500" /> Guida
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab('shortcuts')} className={tabClass('shortcuts')}>
          <Keyboard className="h-3.5 w-3.5" /> Scorciatoie
        </button>
        <button type="button" onClick={() => setTab('install')} className={tabClass('install')}>
          <MonitorDown className="h-3.5 w-3.5" /> Installa l&apos;app
        </button>
      </div>

      {tab === 'shortcuts' ? (
        <>
          <div className="grid grid-cols-1 gap-5 overflow-y-auto sm:grid-cols-2 scrollbar-thin">
            {GROUPS.map((group) => (
              <section key={group.title}>
                <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-theme-500">
                  {group.title}
                </h3>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.action} className="flex items-start justify-between gap-3">
                      <span className="flex shrink-0 items-center gap-1">
                        {item.keys.map((key, index) =>
                          key === '+' || key === '…' ? (
                            <span key={index} className="text-[10px] text-slate-600">
                              {key}
                            </span>
                          ) : (
                            <kbd
                              key={index}
                              className="rounded border border-bento-border bg-bento-void px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-300"
                            >
                              {key}
                            </kbd>
                          ),
                        )}
                      </span>
                      <span className="text-right text-xs leading-snug text-slate-400">
                        {item.action}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-5 border-t border-bento-border pt-3 text-[11px] text-slate-600">
            Le scorciatoie si disattivano da sole mentre scrivi in un campo di testo.
          </p>
        </>
      ) : (
        <div className="space-y-4 overflow-y-auto scrollbar-thin">
          <p className="text-xs leading-relaxed text-slate-400">
            Installata, Fantasia ha una propria icona, si apre a schermo pieno senza barra degli
            indirizzi e parte anche senza rete. La campagna resta la stessa: i dati sono già sul
            dispositivo, non vengono spostati né duplicati.
          </p>

          {installed ? (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10 px-3 py-2 text-xs font-semibold text-emerald-400">
              <Check className="h-4 w-4 shrink-0" /> Stai già usando l&apos;app installata.
            </p>
          ) : canInstall ? (
            <button
              type="button"
              onClick={() => {
                void install();
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-theme-500 bg-theme-600 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-theme-500"
            >
              <MonitorDown className="h-4 w-4" />
              Installa adesso
            </button>
          ) : (
            <p className="rounded-lg border border-bento-border bg-bento-panel/40 px-3 py-2 text-[11px] leading-snug text-slate-500">
              Il tuo browser non offre l&apos;installazione automatica: segui il percorso della tua
              piattaforma qui sotto. Firefox su computer non la supporta affatto.
            </p>
          )}

          {PLATFORMS.map((platform) => (
            <section key={platform.title}>
              <h3 className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-theme-500">
                {platform.title}
              </h3>
              <ul className="space-y-1">
                {platform.steps.map((step) => (
                  <li key={step} className="flex gap-2 text-xs leading-snug text-slate-400">
                    <span aria-hidden className="text-slate-600">
                      ·
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <p className="border-t border-bento-border pt-3 text-[11px] leading-snug text-slate-600">
            Serve un indirizzo <strong className="text-slate-500">https</strong> (oppure
            localhost): su una connessione non protetta nessun browser installa nulla.
          </p>
        </div>
      )}
    </Modal>
  );
}
