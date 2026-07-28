import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLIP_VOLUME,
  MAX_SOUND_CLIPS,
  clampClips,
  clampVolume,
  isPlayableUrl,
  normalizeClipPlayback,
} from './soundClips';

describe('indirizzo della clip', () => {
  it('accetta http, https e i file dell app', () => {
    expect(isPlayableUrl('https://files.catbox.moe/abc.mp3')).toBe(true);
    expect(isPlayableUrl('http://esempio.it/tuono.ogg')).toBe(true);
    expect(isPlayableUrl('/main_music.mp3')).toBe(true);
  });

  /**
   * `data:` rimetterebbe il file dentro il database — proprio ciò che si vuole
   * evitare — e `blob:` vale solo nella scheda che l'ha creato, quindi agli
   * altri collegati non arriverebbe alcun suono.
   */
  it('rifiuta gli schemi che non arriverebbero agli altri', () => {
    expect(isPlayableUrl('data:audio/mp3;base64,AAAA')).toBe(false);
    expect(isPlayableUrl('blob:https://app/1234')).toBe(false);
    expect(isPlayableUrl('non un indirizzo')).toBe(false);
    expect(isPlayableUrl('')).toBe(false);
  });

  it('rifiuta gli indirizzi troppo lunghi per il database', () => {
    expect(isPlayableUrl(`https://esempio.it/${'a'.repeat(700)}.mp3`)).toBe(false);
  });
});

describe('volume', () => {
  it('resta fra zero e uno', () => {
    expect(clampVolume(1.8)).toBe(1);
    expect(clampVolume(-2)).toBe(0);
    expect(clampVolume(0.55)).toBe(0.55);
  });

  it('ricade sul valore predefinito quando non è un numero', () => {
    expect(clampVolume('forte')).toBe(DEFAULT_CLIP_VOLUME);
    expect(clampVolume(undefined)).toBe(DEFAULT_CLIP_VOLUME);
  });
});

describe('elenco delle clip', () => {
  const clip = (extra: Record<string, unknown> = {}) => ({
    id: 'a',
    name: 'Tuono',
    url: 'https://esempio.it/t.mp3',
    volume: 0.5,
    ...extra,
  });

  it('non ne tiene più del massimo consentito', () => {
    const many = Array.from({ length: MAX_SOUND_CLIPS + 2 }, (_, i) =>
      clip({ id: `c${i}` }),
    );
    expect(clampClips(many)).toHaveLength(MAX_SOUND_CLIPS);
  });

  it('scarta quelle senza un indirizzo utilizzabile', () => {
    const list = clampClips([clip(), clip({ id: 'b', url: 'data:audio/mp3;base64,AA' })]);
    expect(list).toHaveLength(1);
    expect(list?.[0].id).toBe('a');
  });

  it('resta assente quando non ce ne sono: il salvataggio non cambia', () => {
    for (const input of [undefined, [], 'niente', [null], [{ url: 'boh' }]]) {
      expect(clampClips(input)).toBeUndefined();
    }
  });

  it('dà un nome di ripiego a chi non ce l ha', () => {
    expect(clampClips([clip({ name: '   ' })])?.[0].name).toBe('Clip');
  });
});

describe('stato di riproduzione', () => {
  it('vale solo con clip e istante di partenza', () => {
    expect(normalizeClipPlayback({ clipId: 'a', startedAt: 12 })).toEqual({
      clipId: 'a',
      startedAt: 12,
    });
  });

  /** Senza `startedAt` nessuno saprebbe quando far partire il suono. */
  it('scarta i valori incompleti', () => {
    for (const input of [null, undefined, {}, { clipId: 'a' }, { startedAt: 5 }, 'x']) {
      expect(normalizeClipPlayback(input)).toBeNull();
    }
  });
});
