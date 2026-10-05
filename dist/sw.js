const CACHE='musuroom-public-1.8.5';
const FILES=['/trai-nghiem.html','/tri-thuc.html','/fonts.css','/styles.css','/portal.css','/app.js','/assistant-ui.js','/experience.js','/portal-ui.js','/form-state.js','/core.js','/offline-draft.js','/pwa.js','/knowledge.js','/knowledge-data.js','/assets/favicon.svg','/manifest.webmanifest','/assets/icon-192.png','/assets/icon-512.png'];
FILES.push(...["/assets/fonts/roboto-italic-latin-ext.woff2","/assets/fonts/roboto-italic-latin.woff2","/assets/fonts/roboto-italic-vietnamese.woff2","/assets/fonts/roboto-normal-latin-ext.woff2","/assets/fonts/roboto-normal-latin.woff2","/assets/fonts/roboto-normal-vietnamese.woff2"]);
const allowed=new Set(FILES);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('musuroom-public-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!allowed.has(url.pathname))return;
 // No API, portal, report, trace record, session or credential is cached.
 event.respondWith(fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put(url.pathname,response.clone());}return response;}).catch(async()=>{const cached=await caches.match(url.pathname);return cached||Response.error();}));
});
