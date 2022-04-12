const ws = io("/api/device")

function getCookie(key) {
    let reg = new RegExp(`(?<=${key}=)(.+?)(?=;|$)`, "g");
    let value = document.cookie.match(reg);
    return value;
}

function save_start_location(e) {
    window.startLocation = e.changedTouches[0]
}

function randomFunName() {
    let str = "abcdefghijklmnopqrstuvwxyz0123456789";
    let name = ""
    str = str.split("")
    name = str[Math.round(Math.random() * 26)]
    for (let i = 0; i < 3; i++) {
        name += str[Math.round(Math.random() * 36)]
    }
    return name
}

window.pass = function pass() {}

function alertDialg(title, content, onconfirm, oncancel, hide_button) {
    let _dialog = document.createElement("div");
    _dialog.classList.add("dialog")
    let confirm = typeof (onconfirm) == "function" ? randomFunName() : "pass";
    let cancel = typeof (oncancel) == "function" ? randomFunName() : "pass";
    if (confirm != "pass") window[confirm] = onconfirm;
    if (cancel != "pass") window[cancel] = oncancel;
    _dialog.innerHTML = `<div class="dialog"><div class="title">${title}</div><div class="content">${content}</div><div class="buttons"><button data="" class="confirm circle-button" onclick="window.${confirm}()" title="确定">确定</button><button data="" class="cancel circle-button" onclick="window.${cancel}()" title="取消">取消</button></div></div>`
    if (hide_button) {
        try {
            _dialog.querySelector("." + hide_button).style.display = "none";
        } catch {}
    }
    document.body.appendChild(_dialog)
    return _dialog
}

function touch_e(e) {
    let view = document.querySelector(".view");
    let app = document.querySelector(".app");
    view.classList.remove("leftest");
    view.classList.remove("rightest")
    view.classList.remove("topest");
    view.classList.remove("bottomest")
    vertical = Math.abs(e.changedTouches[0].clientX - window.startLocation.clientX) < Math.abs(e.changedTouches[0].clientY - window.startLocation.clientY)
    if (!window.direction) {
        window.direction = vertical ? "vertical" : "horizontal"
    }
    if (window.direction == "vertical") {
        window.direction = window.direction ? window.direction : "vertical"
        let mv = (e.changedTouches[0].clientY - window.startLocation.clientY) / screen.height * 100;
        let fst_pg = document.querySelector(".app>.page:nth-child(1)")
        if (mv > 0 & app.getAttribute("showat") * 1 == 1) {
            view.classList.add("topest")
        } else if (mv < 0 & app.getAttribute("showat") * 1 == document.querySelectorAll(".app>.page").length) {
            view.classList.add("bottomest")
        } else {
            fst_pg.style.marginTop = mv + "%";
        }
    } else {
        let page_ctr = document.querySelector(".app>.page:nth-child(" + app.getAttribute("showat") + ")>.page-container")
        // let page_ctr = page.children[0]
        if (!page_ctr) {
            return
        }
        let mv = (e.changedTouches[0].clientX - window.startLocation.clientX) / screen.width * 100;
        let fst_it = page_ctr.children[0]
        if (mv > 0 & page_ctr.getAttribute("showat") * 1 == 1) {
            view.classList.add("leftest")
        } else if (mv < 0 & page_ctr.getAttribute("showat") * 1 == page_ctr.children.length) {
            view.classList.add("rightest")
        } else {
            fst_it.style.marginLeft = mv + "%";
        }
    }
}

function nav_page() {
    let app = document.querySelector(".app");
    let view = document.querySelector(".view");
    view.classList.remove("leftest");
    view.classList.remove("rightest")
    view.classList.remove("topest");
    view.classList.remove("bottomest")
    if (window.direction == "vertical") {
        window.direction = null;

        let fst_pg = document.querySelector(".app>.page:nth-child(1)");
        let mar = fst_pg.style.marginTop.match(/\-?\d+\.\d+/) * 1

        if (Math.abs(mar) > 25) {
            fst_pg.style.marginTop = 100 * mar / Math.abs(mar) + "%";
            fst_pg.style.transition = ".5s";
            setTimeout((app, mar, fst_pg) => {
                let cur_page = app.getAttribute("showat") * 1 - mar / Math.abs(mar)
                app.setAttribute("showat", cur_page);
                app.style.transform = "translateY(" + (cur_page - 1) * -100 + "%)"
                fst_pg.style.marginTop = "";
                fst_pg.style.transition = "";
            }, 500, app, mar, fst_pg);
        } else {
            fst_pg.style.marginTop = "";
            fst_pg.style.transition = ".5s";
            setTimeout((fst_pg) => {
                fst_pg.style.transition = "";
            }, 500, fst_pg);
        }
    } else {
        window.direction = null;

        let page_ctr = document.querySelector(".app>.page:nth-child(" + app.getAttribute("showat") + ")>.page-container")
        if (!page_ctr) {
            return
        }
        let fst_it = page_ctr.children[0]
        let mar = fst_it.style.marginLeft.match(/\-?\d+\.\d+/) * 1

        if (Math.abs(mar) > 25) {
            fst_it.style.marginLeft = 100 * mar / Math.abs(mar) + "%";
            fst_it.style.transition = ".5s";
            setTimeout((page_ctr, mar, fst_it) => {
                let cur_it = page_ctr.getAttribute("showat") * 1 - mar / Math.abs(mar)
                page_ctr.setAttribute("showat", cur_it);
                page_ctr.style.transform = "translateX(" + (cur_it - 1) * -100 + "%)"
                fst_it.style.marginLeft = "";
                fst_it.style.transition = "";
            }, 500, page_ctr, mar, fst_it);
        } else {
            fst_it.style.marginLeft = "";
            fst_it.style.transition = ".5s";
            setTimeout((fst_it) => {
                fst_it.style.transition = "";
            }, 500, fst_it);
        }
    }
}


window.addEventListener('touchmove', touch_e)
window.addEventListener('touchstart', save_start_location)
window.addEventListener('touchend', nav_page)
// console.log(window.startLocation)

ws.send("login", getCookie("DevicesUUID"))

document.addEventListener("click", (e) => {
    if (e.target == document.querySelector(".logout")) {
        alertDialg("退出登录", "", () => {
            ws.emit("recall_device", getCookie("DeviceUUID"));
        });
    }
    let inc = false
    let unclaim_exam_page = document.querySelectorAll(".claim-exam")
    unclaim_exam_page.forEach(i => {
        inc = e.target == i ? true : inc
    })

    if (inc) {
        alertDialg("认领考试", "确定认领该场考试吗", () => {
            let exam_info = JSON.parse(e.target.getAttribute("data"));
            ws.emit("claim_exam", {
                DeviceUUID: getCookie("DeviceUUID"),
                examGuid: exam_info.examGuid,
                studentCode: exam_info.studentCode
            })
        })
    }
    inc = false
    let dialog_buttons = document.querySelectorAll(".buttons>.circle-button")
    unclaim_exam_page.forEach(i => {
        inc = e.target == i ? true : inc
    })

    if (inc) {
        e.target.cloest("dialog").remove();
    }

})

ws.on("logout", data => {
    if (data.status != 200) alert(data.message);
    location.assign("/auth");
})

ws.on("claim_success", data => {
    location.reload();
})