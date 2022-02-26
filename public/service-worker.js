const filesToCache = [
  "/", 
  "/index.html",
  "/css/style.css",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/js/index.js",
]
const staticCache = "static-cache-v1"
const runTimeCache = "runtime-cache"

self.addEventListener("install", (event)=>{
  event.waitUntil(
    caches.open(staticCache)
      .then((cache)=>{
        cache.addAll(filesToCache)
      })
      .then(()=>{
        self.skipWaiting()
      })
  )
})

self.addEventListener("activate", (event)=>{
  const currentCaches = [staticCache, runTimeCache]
  event.waitUntil(
    caches.keys()
      .then((cacheNames)=>{
        return cacheNames.filter((cacheName)=>{
          return !currentCaches.includes(cacheName)
        })
      })
      .then((cachesToDelete)=>{
        return Promise.all(
          cachesToDelete.map((cacheToDelete)=>{
            return caches.delete(cacheToDelete)
          })
        )
      })
      .then(()=>{
        self.clients.claim()
      })
  )
})

self.addEventListener("fetch", (event)=>{
  if(event.request.method != "GET" || !event.request.url.startsWith(self.location.origin)){
    event.respondWith(fetch(event.request))
    return
  }

  if(event.request.url.includes("/api/transaction")){
    event.respondWith(
      caches.open(runTimeCache)
      .then((cache)=>{
        return fetch(event.request)
          .then((response)=>{
            cache.put(event.request, response.clone())
            return response
          })
          .catch(()=>{
            return caches.match(event.request)
          })
      })
    )
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse)=>{
        if(cachedResponse){
          return cachedResponse
        }

        return caches.open(runTimeCache)
          .then((cache)=>{
            return fetch(event.request)
              .then((response)=>{
                return cache.put(event.request, response.clone())
                  .then(()=>{
                    return response
                  })
              })
          })
      })
  )
})