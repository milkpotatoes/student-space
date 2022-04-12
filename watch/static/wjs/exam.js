document.addEventListener("click", (e) => {
    if (e.target == document.querySelector(".back.icon")) {
        history.back()
    }

    if (e.target == document.querySelector(".fullscreen")) {
        e.target.classList.add("exit-fullscreen");
        e.target.classList.remove("fullscreen");
        document.body.requestFullscreen()
    }

    if (e.target == document.querySelector(".exit-fullscreen")) {
        e.target.classList.remove("exit-fullscreen");
        e.target.classList.add("fullscreen");
        document.exitFullscreen()
    }
});

window.addEventListener("load", () => {
    if (!document.body.requestFullscreen) {
        document.querySelector(".fullscreen").classList.remove("fullscreen")
    } else {
        if (window.fullScreen) {
            document.querySelector(".fullscreen").classList.add("exit-fullscreen")
            document.querySelector(".fullscreen").classList.remove("fullscreen")
        }
    }
})