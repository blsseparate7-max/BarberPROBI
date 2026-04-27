
/**
 * GBCortes7 - Service Worker Transpiler (XAMPP Friendly)
 */

// Usando link direto para evitar o erro "Redirect disallowed"
importScripts('https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.0/babel.min.js');

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.origin === self.location.origin && (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts'))) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (!response.ok) return response;
          const source = await response.text();
          
          try {
            const transformed = Babel.transform(source, {
              presets: [
                ['react', { runtime: 'automatic' }],
                ['typescript', { isTSX: true, allExtensions: true }]
              ],
              filename: url.pathname
            }).code;

            return new Response(transformed, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          } catch (err) {
            console.error('Babel Error:', err.message);
            return new Response(`console.error("Erro Babel em ${url.pathname}:", ${JSON.stringify(err.message)});`, {
              headers: { 'Content-Type': 'application/javascript' }
            });
          }
        })
    );
  }
});
