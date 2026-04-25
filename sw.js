// ─── INFYN Service Worker ─────────────────────────────────────────
const CACHE = 'infyn-v1';
const SHELL = ['/', '/index.html'];

// Instalar: cachear el shell de la app
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activar: borrar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first con fallback a caché
self.addEventListener('fetch', e => {
  // Solo interceptar GETs al mismo origen
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // Supabase y Google Fonts van directo a la red, sin cache
  const url = e.request.url;
  if (url.includes('supabase.co') || url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Guardar respuesta fresca en caché
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
