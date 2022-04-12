window.addEventListener("load", () => {
    const ws = io("/api/authcode")
    const loaddingel = document.querySelector('.loadding')
    const expirel = document.querySelector('.expir-note')
    const authel = document.querySelector(".auth-code")
    const json_mine_type_header = new Headers();
    json_mine_type_header.append('Content-Type', 'application/json');

    function counter(start, len, callback) {
        let t = new Date();
        t = t.getTime();
        sec = 60 - (t - start) / 1000;
        sec = sec > 0 ? sec : 0;
        if (sec > 0) {
            setTimeout(() => {
                counter(start, len, callback);
            }, sec % 1 * 1000);
            if (callback) callback(Math.round(sec))
        }
    }

    function getCookie(key) {
        let reg = new RegExp(`(?<=${key}=)(.+?)(?=;|$)`, "g");
        let value = document.cookie.match(reg);
            value = value? value[0]: ""
        return value;
    }

    function getDevicesInfo() {
        let deviceName = navigator.userAgent.match(/(?:Android|Windows|iPhone|Linux)(.+?)(?=;)/g);
        deviceName = deviceName ? deviceName : "Unknown device";
        return deviceName[0];
    }

    function setUUID(uuid) {
        fetch("/setCookie", {
            method: "POST",
            body: JSON.stringify({
                deviceUUID: uuid
            }),
            headers: json_mine_type_header
        })
    }

    let uuid = getCookie("DeviceUUID");
    if (!uuid) {
        uuid = uuidv4();
        setUUID(uuid)
    }
    // uuid = uuid ? uuid : uuidv4()
    console.log('---before send---')
    ws.emit("get_auth_code", {
        deviceUUID: uuid,
        deviceName: getDevicesInfo()
    })
    console.log('---after send---')

    ws.on("authcode", data => {
        let authcode = data.data.authcode;
        authel.innerHTML = authcode.replace(/(\d{1})/g, "<span>$1</span>");
        authel.style.display = ""
        expirel.style.display = ""
        loaddingel.style.display = "none"
        counter((new Date()).getTime(), 60, (sec) => {
            document.querySelector('.expir-time').textContent = sec;
        })
        window.auth_expir = setTimeout((uuid, devicename) => {
            ws.emit("get_auth_code", {
                deviceUUID: uuid,
                deviceName: devicename            })
        }, 60000, uuid, getDevicesInfo());
        ws.on("authed", data => {
            window.clearTimeout(window.auth_expir)
            // document.cookie = 'userGuid=' + data.data.userGuid
        })
    })
        ws.on("authed", () => {location.assign("/watch")})
})