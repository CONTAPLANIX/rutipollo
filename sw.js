var CACHE_NAME = "rutipollo-v4";
var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./firebase-config.js",
  "./assets/logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js",
  "https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
];

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(PRECACHE_URLS.map(function(url){
        return fetch(url, { mode: "cors" }).then(function(res){
          return cache.put(url, res);
        }).catch(function(){
          return fetch(url, { mode: "no-cors" }).then(function(res){
            return cache.put(url, res);
          }).catch(function(){});
        });
      }));
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET") return;
  if(req.url.indexOf("firestore.googleapis.com") > -1) return;
  if(req.url.indexOf("googleapis.com/identitytoolkit") > -1) return;

  if(req.mode === "navigate"){
    event.respondWith(
      fetch(req, { cache: "no-store" }).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached){
      var fetchPromise = fetch(req).then(function(res){
        if(res && (res.status === 200 || res.type === "opaque")){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
