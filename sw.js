const cacheName = "stusp-v1.3.6",
    appShellFiles = ["index.html", "404.html", "css/style.css", "css/viewer.min.css", "js/base64.min.js", "js/switch_device.js", "js/showdown.min.js", "js/viewer.min.js", "json/manifest.json", "json/province.json", "json/version.json", "md/help.md", "src/ic_launcher.png", "src/lz_load.png", "src/Ultimate Material Lollipop Collection - 456.jpg"],
    neverCacheUrls = [/stusp\.milkpotatoes\.cn\/([a-z]+?)(?<!index|questionnaire)\.html/, "stusp.milkpotatoes.cn/json/friend_link.json", /7net\.cc/, /hm\.baidu\.com/, /s\.union\.360\.cn/];

function checkNeverCacheList(url) {
    return !this.match(url)
}

self.addEventListener("install", e => {
    e.waitUntil(caches.open(cacheName).then((function (cache) {
        return cache.addAll(appShellFiles)
    })))
});

self.addEventListener("fetch", e => {
    if (neverCacheUrls.every(checkNeverCacheList, e.request.url) && "GET" === e.request.method) {
        e.respondWith(caches.match(e.request).then(r => {
            return r || fetch(e.request).then(response => {
                if (e.request.url.match(/^(http|https):\/\//)) {
                    return caches.open(e.request.url.match(/7net\.cc/) || e.request.url.match(/aliyuncs\.com/) ? "7net-cache" : cacheName).then(cache => {
                        cache.put(e.request, response.clone())
                        return response
                    })
                } else {
                    return response
                }
            })
        }))
    }
});

function clearCache() {
    caches.delete(cacheName);
}

function callClient(id, message) {
    new Promise((_reslove, _reject) => {
        self.clients.matchAll()
            .then(clients => {
                clients.forEach(client => {
                    if (id == client.id) client.postMessage(message);
                })
            })
    })
}

self.addEventListener("message", e => {
    if (e.data.message = "clear-cache") {
        clearCache();
        callClient(e.source.id, {
            message: "success", "callback": e.data.callback
        })
    }

});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(
            keyList => Promise.all(keyList.map(key => {
                if (key !== cacheName) caches.delete(key)
            }))
        )
    )
});
