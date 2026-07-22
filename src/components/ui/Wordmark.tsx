/**
 * Marchio di Fantasia.
 *
 * Tre file, tre usi diversi:
 *  - `logo-fantasia.png` (oro) — variante "Normale" sui design scuri
 *  - `logo-fantasia-black.png` — sempre sul design chiaro, dove l'oro sparirebbe
 *  - `logo-fantasia-white.png` — base della variante "Colorato"
 *
 * Il colorato non è un'immagine colorata: la sagoma bianca viene usata come
 * MASCHERA su un fondo pieno nel colore del tema. Così il marchio prende
 * esattamente la tinta scelta dall'utente, e la segue anche durante la
 * dissolvenza del cambio tema, senza bisogno di un file per ogni colore.
 *
 * Se un file manca, si ricade sulla scritta composta con il carattere del
 * design: l'app resta presentabile e non compare mai l'icona di immagine rotta.
 */

import { useState } from 'react';
import type { CampaignStyle, LogoVariant } from '../../theme';

const LOGO_GOLD = '/logo-fantasia.png';
const LOGO_BLACK = '/logo-fantasia-black.png';
const LOGO_WHITE = '/logo-fantasia-white.png';

/** Proporzioni originali del marchio: 2254 × 531. */
const ASPECT = '2254 / 531';

interface WordmarkProps {
  /** Design in vigore: il chiaro impone la variante nera. */
  style?: CampaignStyle;
  /** Scelta dell'utente fra marchio originale e marchio colorato. */
  variant?: LogoVariant;
  /** Classi per il marchio: serve almeno un'altezza. */
  className?: string;
  /** Classi per la scritta di riserva, che deve pesare quanto il logo. */
  fallbackClassName?: string;
}

export function Wordmark({
  style = 'grimorio',
  variant = 'normal',
  className = 'h-8',
  fallbackClassName = 'font-display text-lg font-extrabold uppercase tracking-wider text-slate-100',
}: WordmarkProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className={fallbackClassName}>Fantasia</span>;
  }

  // Sul design chiaro il colore del marchio non è una scelta: l'oro e il
  // bianco sparirebbero entrambi.
  const isLightDesign = style === 'white';
  const colored = variant === 'colored' && !isLightDesign;

  if (colored) {
    return (
      <span
        role="img"
        aria-label="Fantasia"
        className={`block select-none bg-theme-500 ${className}`}
        style={{
          aspectRatio: ASPECT,
          // Il canale alfa del PNG bianco ritaglia il fondo colorato.
          maskImage: `url("${LOGO_WHITE}")`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url("${LOGO_WHITE}")`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
        }}
      />
    );
  }

  const source = isLightDesign ? LOGO_BLACK : LOGO_GOLD;

  return (
    <img
      // La `key` forza il ricaricamento al cambio design: senza, il browser
      // terrebbe l'immagine precedente.
      key={source}
      src={source}
      alt="Fantasia"
      // `w-auto` con l'altezza data dal chiamante: il marchio è molto largo e
      // deve scalare in proporzione, mai deformarsi.
      className={`w-auto select-none ${className}`}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
