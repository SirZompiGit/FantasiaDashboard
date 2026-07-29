/**
 * Installazione dell'app.
 *
 * Il browser decide da sé se e quando proporre l'installazione, e l'invito
 * nativo è discreto al punto da passare inosservato. Qui l'evento viene
 * intercettato e messo da parte, così l'app può offrire un pulsante esplicito
 * dove ha senso — nelle impostazioni — invece di sperare che qualcuno noti
 * l'icona nella barra degli indirizzi.
 *
 * Dove l'evento non esiste (Safari, Firefox) il pulsante semplicemente non
 * compare: su iOS l'installazione passa da "Aggiungi a schermata Home", che non
 * è pilotabile da una pagina.
 */

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Vero quando la pagina è già aperta come app installata. */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // Il modo di iOS, che non implementa `display-mode`.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export interface UseInstallPromptResult {
  /** C'è un invito da mostrare: il pulsante ha senso solo allora. */
  canInstall: boolean;
  /** L'app è già installata (o si sta guardando la versione installata). */
  installed: boolean;
  /** Apre la finestra del browser. Restituisce true se l'utente ha accettato. */
  install: () => Promise<boolean>;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onBeforeInstall = (nativeEvent: Event) => {
      // Senza `preventDefault` alcuni browser mostrano la propria barra e
      // l'evento non resta utilizzabile più tardi.
      nativeEvent.preventDefault();
      setEvent(nativeEvent as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!event) return false;

    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      // L'invito si consuma: accettato o no, non è più riproponibile.
      setEvent(null);
      return outcome === 'accepted';
    } catch (error) {
      console.warn('[fantasia] installazione non riuscita:', error);
      setEvent(null);
      return false;
    }
  }, [event]);

  return { canInstall: event !== null && !installed, installed, install };
}
