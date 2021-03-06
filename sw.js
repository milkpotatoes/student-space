const cacheName = "stusp-v1.3.0",
    appShellFiles = ["index.html", "404.html", "css/style.min.css", "css/viewer.min.css", "js/base64.min.js", "js/switch_device.min.js", "js/showdown.min.js", "js/showdown.min.js.map", "js/viewer.min.js", "json/manifest.json", "json/province.json", "json/version.json", "md/help.md", "src/ic_launcher.png", "src/lz_load.png", "src/Ultimate Material Lollipop Collection - 456.jpg"],
    neverCacheUrls = [/stusp\.milkpotatoes\.cn\/([a-z]+?)(?<!index|questionnaire)\.html/, "stusp.milkpotatoes.cn/json/friend_link.json", /7net\.cc/, /hm\.baidu\.com/, /s\.union\.360\.cn/];

function checkNeverCacheList(url) {
    return !this.match(url)
}
self.addEventListener("install", (function (e) {
    e.waitUntil(caches.open(cacheName).then((function (cache) {
        return cache.addAll(appShellFiles)
    })))
})), self.addEventListener("fetch", (function (e) {
    neverCacheUrls.every(checkNeverCacheList, e.request.url) && "GET" === e.request.method && e.respondWith(caches.match(e.request).then((function (r) {
        return r || fetch(e.request).then((function (response) {
            return e.request.url.match(/^(http|https):\/\//) ? caches.open(cacheName).then((function (cache) {
                return cache.put(e.request, response.clone()), response
            })) : response
        }))
    })))
})), self.addEventListener("activate", e => {
    e.waitUntil(caches.keys().then(keyList => Promise.all(keyList.map(key => {
        if (key !== cacheName) return caches.delete(key)
    }))))
});