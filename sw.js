const CACHE_NAME = "water-count-v3"; // ভার্সন v3 করা হয়েছে, যাতে নতুন করে রিফ্রেশ হয়
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./water-count-logo.png",
  "./manifest.json"
];

// 1. Install Service Worker & Cache Files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  // নতুন আপডেট এলে সাথে সাথে অ্যাপ্লাই করার জন্য
  self.skipWaiting(); 
});

// 2. Activate Service Worker & Delete Old Caches (অটোমেটিক পুরনো ক্যাশ মুছে ফেলবে)
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Data (অফলাইন সাপোর্ট)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // ক্যাশে থাকলে সেটা দেখাবে, না হলে ইন্টারনেট থেকে আনবে
      return response || fetch(event.request);
    })
  );
});