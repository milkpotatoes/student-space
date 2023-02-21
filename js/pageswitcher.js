import Render from "./render.js";
import Szone from "./szone.js";
import PageLoader from "./pageloader.js";

export class PageSwitcher {

    #mPageLoader;
    #mSzone;

    /**
     * 
     * @param {PageLoader} mPageLoader 
     * @param {Szone} mSzone 
     * @returns 
     */
    constructor(mPageLoader, mSzone) {
        this.#mPageLoader = mPageLoader;
        this.#mSzone = mSzone;
        return this;
    }

    resetPage() {
        $(".loaded").removeClass("loaded");
        $(".exam-item-pgs").removeClass("exam-end").removeClass("mdui-hidden");
        $("_examList").empty();
        $("_unClaimExamList").empty();
        $(".no-uncaim-cxam").text("").addClass("mdui-hidden");
        $("_login-btn").val("登录");
        this.#mPageLoader.resetExamPage()
    }

    load_import_list() {
        fetch("json/import.json")
            .then(res => res.json())
            .then(data => {
                let imRender = new Render("about", "import-item", "append", ".import-list");
                let imData = [];
                for (const element of data) imData.push({
                    projectUrl: element.url,
                    projectName: element.name,
                    projectIcon: element.iconType == "img" ? '<img src="' + element.icon + '">' : element.icon,
                    projectDescription: element.description,
                    projectVersion: element.version
                });

                imRender.renderList(imData);
            });
    }

    load_friend_link() {
        fetch("json/friend_link.json")
            .then(res => res.json())
            .then(data => {
                let flRender = new Render("about", "friend-link-item", "append", ".friend-link");
                let flData = [];
                for (const element of data) flData.push({
                    frndLnkUrl: element.url,
                    frndLnkTitle: element.title,
                    frndLnkDesc: element.description
                });
                flRender.renderList(flData);
            });
    }


    bandOrder() {
        /* let SzoneBandOrder = this.#mSzone.bandOrder */
        let band_promt = mdui.dialog({
            title: "绑定订单",
            content: (new Render("dialog", "band-order")).getTemplate(),
            buttons: [{
                text: "取消",
                close: true
            },
            {
                text: "绑定",
                bold: true,
                close: false,
                onClick: function (dialog) {
                    dialog.$element.find(".mdui-textfield").removeClass("mdui-textfield-invalid");
                    let order_id = dialog.$element.find("input.order-id").val();
                    let auto_band = dialog.$element.find("input.auto-band").is(":checked");
                    let err_msg = dialog.$element.find(".mdui-textfield-error");
                    if (!order_id.match(/^\d{8,27}$/g)) {
                        err_msg.text("订单号应为小于27位数字");
                        dialog.$element.find(".mdui-textfield").addClass("mdui-textfield-invalid");
                        return false;
                    };

                    this.#mSzone.bandOrder(order_id, auto_band)
                        .then(data => {
                            if (data.status == 200) {
                                mdui.snackbar("绑定成功");
                                dialog.close();
                            } else {
                                err_msg.text(data.message);
                                dialog.$element.find(".mdui-textfield").addClass("mdui-textfield-invalid");
                            };
                        });
                }
            },
            ],
            history: false,
            type: "text",
            onClose: () => this.checkSubscribeInfo(true)

        });
        mdui.mutation();
        band_promt.$element.find(".mdui-dialog-content").addClass("mdui-p-b-0");
        band_promt.$element.find("input.order-id").on("input", event => {
            let box_class = event.target.closest(".mdui-textfield").classList;
            box_class.remove("mdui-textfield-invalid");

            if (event.target.value.match(/[^\d]/)) {
                event.target.nextElementSibling.textContent = "订单号只由数字组成";
                box_class.add("mdui-textfield-invalid");
            }
        });
        band_promt.handleUpdate();
    }


    startTrial(dialog) {
        this.#mSzone.startTrial()
            .then(json => {
                if (json.status == 200) {
                    dialog.close();
                    this.checkSubscribeInfo();
                }
                else mdui.snackbar(json.message)
            })
    }

    subscribeExpiredDialog() {
        this.#mSzone.getTrialInfo()
            .then(data => {
                let btns = [
                    {
                        text: "开启试用",
                        bold: true,
                        onClick: () => this.startTrial(),
                        close: false
                    },
                    {
                        text: "绑定订单",
                        bold: false,
                        onClick: () => this.bandOrder(),
                        close: true
                    },
                    {
                        text: "使用Github Pages",
                        close: false,
                        onClick: () => window.open("https://milkpotatoes.github.io/student-space/#/")
                    },
                    {
                        text: "关闭",
                        close: true
                    }
                ];
                if (data.status == 200) {
                    btns.splice(0, 1);
                    btns[0].bold = true;
                };
                mdui.dialog({
                    title: "订阅已过期",
                    content: (new Render("dialog", "subscribe-expired")).getTemplate(),
                    buttons: btns,
                    stackedButtons: true,
                    history: false
                });
            });
    }

    /**
     * 
     * @param {boolean} nodialog 
     * @returns 
     */
    async checkSubscribeInfo(nodialog) {
        const sub_info = await this.#mSzone.getSubscribeInfo();
        if (sub_info.status !== 200) {
            if (!nodialog)
                this.subscribeExpiredDialog();
        }
        else if (sub_info.data.expire_time && sub_info.data.effective_time) {
            document.querySelector(".expire-time").textContent = (new Date(sub_info.data.expire_time * 1000)).toLocaleString() + (sub_info.status == 200 ? "" : " (已失效)");
            document.querySelector(".effective-time").textContent = (new Date(sub_info.data.effective_time * 1000)).toLocaleString();
        } else {
            document.querySelector(".expire-time").textContent = "无订阅记录";
        }
        return sub_info;
    }

    switchDisplay(e, hide) {
        e = $(e);
        /* //console.log(123, hide); */
        if (hide) {
            if (e.hasClass("score-summary-table")) e.children().first().addClass("mdui-hidden");
            /* console.log(e.find()) */
            e.children("div").addClass("mdui-hidden").each((i, el) => {
                if (i <= 4 && !e.hasClass("score-summary-table")) $(el).removeClass("mdui-hidden");
            });

            e.find("span").text(e.hasClass("score-summary-table") ? "查看各科成绩" : "展开");
            e.find("i").text("expand_more");
        } else {
            if (e.hasClass("score-summary-table")) e.find("div:first-child").removeClass("mdui-hidden");

            e.children("div").removeClass("mdui-hidden");
            e.find("span").text(e.hasClass("score-summary-table") ? "隐藏各科成绩" : "收起");
            e.find("i").text("expand_less");
        }
    }

    /* 任意时候加载的事项 */
    loadAnyway(page_name) {
        let page = document.querySelector("[page~=" + page_name);
        switch (page_name) {
            case "home":
                let homeSize = page.getClientRects()[0];
                let navBar = document.querySelector("footer").getClientRects()[0];
                document.querySelector(".navigator-container header").classList.remove("mdui-hidden");

                if (homeSize.bottom <= navBar.bottom && !$("[page~=home] .exam-item-pgs").hasClass(
                    "exam-end") && $(".app-show").is(("[page~=home]"))) {
                    this.#mPageLoader.getExamList($(".exam-item").length, 5);
                };

                document.querySelector(".navigator-container footer>.mdui-bottom-nav-active").classList.remove("mdui-bottom-nav-active");
                document.querySelector(".navigator-container footer>a:nth-child(1)").classList.add("mdui-bottom-nav-active");

                break;
            case "exam":
                this.#mPageLoader.resetExamPage();
                this.checkSubscribeInfo()
                    .then(sub_info => {
                        if (sub_info.status == 200) this.#mPageLoader.loadExamPage();
                        else history.back();
                    });
                break;
            case "user":
                this.#mPageLoader.setBG();
                setTimeout(this.#mPageLoader.setBG, 300);
                break;
            case "unclaim":
                document.querySelector(".navigator-container header").classList.remove("mdui-hidden");
                document.querySelector(".navigator-container footer>.mdui-bottom-nav-active").classList.remove("mdui-bottom-nav-active");
                document.querySelector(".navigator-container footer>a:nth-child(2)").classList.add("mdui-bottom-nav-active");
                break;
            case "profile":
                document.querySelector(".navigator-container header").classList.add("mdui-hidden");
                document.querySelector(".navigator-container footer>.mdui-bottom-nav-active").classList.remove("mdui-bottom-nav-active");
                document.querySelector(".navigator-container footer>a:nth-child(3)").classList.add("mdui-bottom-nav-active");
                break;
            case "settings":
                this.#mPageLoader.loadSettings();
                break;
            default:
                break;
        };
    }
    /* 首次加载页面执行 */
    firstLoad(page_name) {
        $(`[page~=${page_name}]`).addClass("loaded");
        /* this.#mPageLoader.setUserInfo(); */
        switch (page_name) {
            case "home":
                document.querySelector(".navigator-container>header").classList.remove("mdui-hidden");
                this.#mPageLoader.firstLoadHome();
                break;
            case "exam":
                this.loadAnyway(page_name);
                break;
            case "profile":
                this.#mPageLoader.setUserInfo();
                this.loadAnyway(page_name);
                break;
            case "user":
                this.#mPageLoader.setBG();
                setTimeout(this.#mPageLoader.setBG, 300);
                this.#mPageLoader.setUserInfo();
                break;
            case "unclaim":
                document.querySelector(".navigator-container>header").classList.remove("mdui-hidden");
                this.#mPageLoader.getUnclaimExamList();
                this.loadAnyway(page_name);
                break;
            case "about":
                fetch("json/version.json")
                    .then(res => res.json())
                    .then(app_info => document.querySelector(".appVersion").innerText = "v" + app_info.version);
                this.load_import_list();
                this.load_friend_link();
                break;
            case "settings":
                this.loadAnyway(page_name);
                break;
            case "login":
                this.resetPage();
                break;
            default:
                this.#mPageLoader.loadDocumentPage(page_name);
                break;
        }
    }
    /**
     * 
     * @param {boolean} hide true表示显示，false表示隐藏
     */
    showBackTopBtn(hide) {
        if (hide) {
            $(".back-up-btn-box").removeClass("mdui-hidden");
        } else {
            $(".back-up-btn-box").addClass("mdui-hidden");
        }
    }

    /**
     * 
     * @param {String} page_path 页面路由路径
     * @param {*} add_history 是否添加到浏览器历史记录，true为添加
     * @param {*} state 附加状态
     */

    showPage(page_path, add_history, state) {
        if (page_path == "index") page_path = "home";

        if (page_path !== "login") {
            document.querySelector("[page=login]").classList.remove("app-show");
            document.querySelector(".full-container").style.zIndex = -1;
        };
        
        switch (add_history) {
            case true:
                history.pushState(state, document.title, "#/" + page_path);
                break;
            case false:
                history.replaceState(state, document.title, "#/" + page_path);
                break;
            case undefined:
                break;
        }

        let page_name = page_path == "" ? "home" : page_path;
        let page = document.querySelector(`[page~=${page_name}]`);

        if (page.closest(".full-container")) page.closest(".full-container").style.zIndex = 2;

        let siblings = page.parentElement.querySelectorAll("[page]");
        page.style.zIndex = 1;
        siblings.forEach(sibling => {
            if (!sibling.isEqualNode(page)) {
                sibling.style.zIndex = 0;
                if (page.parentElement.classList.contains("subpage-container")) setTimeout((sibling) => sibling.classList.remove("app-show"), 200, sibling);
                else sibling.classList.remove("app-show");
            };

        });


        this.showBackTopBtn(page.getAttribute("back-up-btn") === "true");
        let simple_header = document.querySelector(".simple-appbar");
        if (page.getAttribute("appbar") == "simple-appbar") {
            let curr_header = page.querySelector(".simple-appbar");
            if (curr_header) page.querySelector(".simple-appbar .mdui-typo-title").textContent = page.getAttribute("page-title");
            else {
                curr_header = simple_header.cloneNode(true);
                curr_header.classList.remove("mdui-hidden");
                curr_header.querySelector(".mdui-typo-title").textContent = page.getAttribute("page-title");
                if (page.getAttribute("back-btn") === "true") curr_header.querySelector("a").classList.remove("mdui-hidden");
                else curr_header.querySelector("a").classList.add("mdui-hidden");
                page.append(curr_header);
            };
        };

        page.classList.add("app-show");

        document.title = page.getAttribute("page-title");

        if (!page.classList.contains("loaded")) this.firstLoad(page_name);
        else this.loadAnyway(page_name);

    }

    logout() {
        mdui.snackbar({
            message: "退出登录",
            buttonText: "确定",
            onButtonClick: () => {
                localStorage.removeItem("Token");
                mPageSwitcher.showPage("login", false, null);
                mPageSwitcher.resetPage();
            }
        });
    }
}
export default PageSwitcher;