/**
 * Service worker di Fantasia.
 *
 * Fa una cosa sola e la fa in modo prudente: rendere l'app apribile e utilizzabile
 * anche senza rete. NON è una cache generalizzata, perché una cache aggressiva su
 * un'app che si aggiorna spesso è il modo migliore per lasciare addosso alla gente
 * una versione vecchia senza che se ne accorga.
 *
 * Due strategie, scelte per come si comportano i file:
 *
 *  - **Navigazioni** (aprire l'app): prima la rete, la copia salvata solo se la
 *    rete non risponde. Così un aggiornamento pubblicato si vede subito, e chi è
 *    offline apre comunque la dashboard.
 *  - **File statici con impronta** (`/assets/*.js`, `/assets/*.css`): prima la
 *    cache. Il nome contiene l'hash del contenuto, quindi lo stesso indirizzo
 *    corrisponde per sempre allo stesso file: non può diventare obsoleto.
 *
 * Tutto il resto passa direttamente alla rete. In particolare NON si tocca
 * Firebase: lo stato della campagna deve arrivare dal database, mai da una copia.
 */

// Cambiando l'elenco qui sotto va cambiata anche la versione, altrimenti chi ha
// già installato l'app resta con la lista vecchia in cache.
const VERSION = 'fantasia-v6.1';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

/** Il minimo per aprire l'app da fermo. */
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon_fantasia_rounded-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // `addAll` fallisce in blocco se manca un solo file: qui una risorsa non
      // raggiungibile non deve impedire l'installazione.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo le letture: una scrittura non si mette in cache né si ripete.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() =>
          caches
            .match('/index.html')
            .then(
              (cached) =>
                cached ??
                new Response('Fantasia non è disponibile offline.', {
                  status: 503,
                  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                }),
            ),
        ),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            // Le risposte parziali o di errore non vanno conservate.
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
