/**
 * service-worker.js - Service Worker pour PWA
 * Cache les ressources pour fonctionnement hors ligne
 */

const CACHE_NAME = "gestion-locative-v2.1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/gestion-locative/menu.html",
  "/gestion-locative/settings.html",
  "/gestion-locative/bien.html",
  "/gestion-locative//proprietaire.html",
  "/gestion-locative/locataire.html",
  "/gestion-locative/bail.html",
  "/gestion-locative/quittance.html",
  "/gestion-locative/liaison-bien-proprietaire.html",
  "/js/app.js",
  "/js/db.js",
  "/js/storage.js",
  "/manifest.json",
  "/favicon.png"
];

/**
 * Installation du Service Worker
 */
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker: Installation...");
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📥 Cache ouvert, ajout des ressources...");
      
      // Essayer de cacher chaque ressource individuellement
      return Promise.allSettled(
        URLS_TO_CACHE.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((response) => {
              if (!response.ok) {
                console.warn(`⚠️ Échec chargement: ${url} (${response.status})`);
                return null;
              }
              return cache.put(url, response.clone());
            })
            .catch((err) => {
              console.warn(`⚠️ Erreur cache ${url}:`, err.message);
              return null;
            })
        )
      ).then((results) => {
        const successes = results.filter(r => r.status === "fulfilled" && r.value !== null).length;
        const failures = results.filter(r => r.status === "rejected" || r.value === null).length;
        console.log(`✅ Cache: ${successes} succès, ${failures} échecs`);
      });
    })
  );
  
  // Forcer l'activation immédiate
  self.skipWaiting();
});

/**
 * Activation du Service Worker
 */
self.addEventListener("activate", (event) => {
  console.log("🔄 Service Worker: Activation...");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log(`🗑️ Suppression ancien cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Prendre le contrôle immédiatement
  return self.clients.claim();
});

/**
 * Interception des requêtes
 * Stratégie hybride: Network First pour les pages, Cache First pour les assets
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== "GET") {
    return;
  }
  
  // Ignorer les requêtes Chrome extensions et autres protocoles
  if (!url.protocol.startsWith("http")) {
    return;
  }
  
  // Stratégie différente selon le type de ressource
  if (request.headers.get("accept").includes("text/html")) {
    // Pour les pages HTML: Network First, puis Cache
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Pour les assets (CSS, JS, images): Cache First, puis Network
    event.respondWith(cacheFirstStrategy(request));
  }
});

/**
 * Stratégie Network First
 * Essaie d'abord le réseau, puis le cache en fallback
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    // Si la réponse est valide, la mettre en cache
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Si le réseau échoue, essayer le cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si rien en cache, retourner une page d'erreur
    return getOfflinePage();
  }
}

/**
 * Stratégie Cache First
 * Essaie d'abord le cache, puis le réseau en fallback
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Mettre à jour le cache en arrière-plan
    fetch(request).then(response => {
      if (response && response.status === 200) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
      // Ignorer les erreurs de mise à jour
    });
    
    return cachedResponse;
  }
  
  // Si pas en cache, aller chercher sur le réseau
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Si le réseau échoue aussi, retourner une erreur
    return new Response("Ressource non disponible", {
      status: 503,
      statusText: "Service Unavailable"
    });
  }
}

/**
 * Page hors ligne personnalisée
 */
function getOfflinePage() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hors ligne</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 2rem;
        }
        .container {
          max-width: 500px;
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .icon {
          font-size: 5rem;
          margin-bottom: 1rem;
          animation: pulse 2s ease infinite;
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        p {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          opacity: 0.95;
        }
        button {
          margin-top: 2rem;
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border: 2px solid white;
          background: transparent;
          color: white;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        button:hover {
          background: white;
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }
        .tip {
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.9rem;
          backdrop-filter: blur(10px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>Mode hors ligne</h1>
        <p>Vous êtes actuellement déconnecté d'internet.</p>
        <p>Cette page n'est pas disponible dans le cache de l'application.</p>
        <button onclick="window.location.reload()">🔄 Réessayer</button>
        <div class="tip">
          💡 <strong>Astuce :</strong> Certaines fonctionnalités restent disponibles hors ligne grâce à IndexedDB.
        </div>
      </div>
    </body>
    </html>`,
    {
      headers: { 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    }
  );
}

/**
 * Gestion des messages du client
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("⏭️ Skip waiting demandé");
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("🗑️ Nettoyage du cache demandé");
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
        console.log("✅ Cache nettoyé");
      })
    );
  }
  
  if (event.data && event.data.type === "GET_VERSION") {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_NAME });
    }
  }
});

/**
 * Background Sync (optionnel, pour futures fonctionnalités)
 */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    console.log("🔄 Synchronisation en arrière-plan...");
    event.waitUntil(
      // Logique de synchronisation ici
      Promise.resolve()
    );
  }
});

/**
 * Notification Push (optionnel, pour futures fonctionnalités)
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || "Nouvelle notification",
    icon: "/favicon.png",
    badge: "/favicon.png",
    vibrate: [200, 100, 200],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || "Gestion Locative", options)
  );
});

console.log("✅ Service Worker chargé - Version:", CACHE_NAME);
