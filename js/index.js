import Szone from "./szone.js";
import Render from "./render.js";
import PageLoader from "./pageloader.js";
import PageSwitcher from "./pageswitcher.js";
import mdui from "../modules/mdui/js/mdui.esm.js";
import { Base64 } from "../modules/js-base64/base64.mjs";

window.mdui = mdui;
window.$ = mdui.$;
fitSystemConfig();

window.addEventListener("load", () => {
    let page_name = location.hash.substring(2);
    switchPage(page_name);
});


const mSzone = new Szone(localStorage.CurrentUser);
if (!localStorage.CurrentUser && localStorage.Token) mSzone.setToken(localStorage.Token);
let click_item, claim_dialog;
const mPageLoader = new PageLoader(mSzone);
const mPageSwitcher = new PageSwitcher(mPageLoader, mSzone);

await mSzone.tokenSet();


let [navigator_scroll_top, subpage_scroll_top] = [0, 0];

mSzone.getUserInfo()
    .then(user_info => {
        if (user_info.userGuid) mPageSwitcher.checkSubscribeInfo(true);
    });

$.fn.extend({
    scrollTop: function (element) {
        if (typeof (element) === "object" || element === undefined) {
            return -document.body.getBoundingClientRect().top;
        } else {
            return -document.querySelector(element).getBoundingClientRect().top;
        }
    },
    click: function (func) {
        return this.each((_i, e) => {
            $(e).on("click", func)
        });
    },
    select: function () {
        this.each((_i, e) => {
            if (document.selection) {
                let range = document.body.createTextRange();
                range.moveToElementText(e);
                range.select();
            } else if (window.getSelection) {
                let range = document.createRange();
                range.selectNode(e);
                window.getSelection().addRange(range);
            }
        })
    },
    focus: function () {
        this.each((_i, e) => {
            e.focus();
        })
    }
});

fetch("json/version.json")
    .then(res => res.json())
    .then(app_info => {
        let update_log = localStorage.update;
        if (update_log === undefined) {
            update_log = {
                current: {
                    id: app_info.code,
                    version: app_info.version,
                    time: (new Date()).getTime()
                },
                history: []
            };
            _hmt.push(['_trackEvent', "appinfo", "install", app_info.version + "(" + app_info.code + ")", update_log.current.time]);
            localStorage.update = JSON.stringify(update_log);
        } else {
            update_log = JSON.parse(update_log);
            if (app_info.code > update_log.current.id) {
                update_log.history.push(update_log.current);
                update_log.current = {
                    id: app_info.code,
                    version: app_info.version,
                    time: (new Date()).getTime()
                };
                localStorage.update = JSON.stringify(update_log);
                _hmt.push(['_trackEvent', "appinfo", "update", app_info.version + "(" + app_info.code + ")", update_log.current.time]);
            };
        };
        $(".page-loading-version").text("v" + app_info.version + (location.host.includes("dev") ? " - 仅供调试用" : ""));
    });

/* 动态设置背景图显示位置 */

function countDown(lefttime, callback, ...args) {
    lefttime--;
    let timer;
    args.splice(0, 0, lefttime);

    if (lefttime > 0) {
        timer = setTimeout(() => {
            countDown.apply(this, args);
        }, 1000, args);
    };

    const clearCounter = function () {
        window.clearTimeout(timer);
    };

    callback.apply({ clearCounter: clearCounter }, args);

    args.splice(1, 0, callback);
}

/* 认领考试 */
function claimExam(student_code, exam_guid) {
    mSzone.claimExam({
        examGuid: exam_guid,
        studentCode: student_code
    })
        .then(data => {
            if (data.status == 200) {
                mdui.snackbar({
                    message: "认领成功",
                    buttonText: "查看",
                    onButtonClick: () => mPageSwitcher.showPage("home", false, null)
                });
                if (click_item.prev().hasClass("mdui-subheader") && click_item.next().hasClass("mdui-subheader")) {
                    click_item.prev().remove();
                }
                click_item.remove();
                claim_dialog.close();
            } else {
                mdui.snackbar(data.message);
            }
        });
}

function updateCityOptions() {
    let k = document.querySelector(".province-select").value;
    document.querySelector(".city-select").innerHTML = "";
    if (k > -1) {
        let cityRender = new Render("other", "option", "append", ".city-select");
        let cityData = [];
        fetch("json/province.json").then(res => res.json()).then(province_list => {
            if (province_list.data[k].list !== undefined) {
                document.querySelector(".city").style.display = "none";
                let op = document.createElement("option");
                op.value = -1;
                op.innerText = "请选择";
                document.querySelector(".city-select").append(op);
                cityData.push({
                    optionId: "-1",
                    optionText: "请选择",
                    selected: ""
                });
                for (const element of province_list.data[k].list) cityData.push({
                    optionId: element.cityCode,
                    optionText: element.cityName,
                    selected: ""
                });
                cityRender.renderList(cityData);
            } else {
                document.querySelector(".city").style.display = "";
                cityRender.renderToPage({
                    optionId: province_list.data[k].cityCode,
                    optionText: province_list.data[k].list[i].cityName,
                    selected: "selected"
                });
            }
        });
    } else document.querySelector(".city").style.display = "none";

}

function selectArea() {
    let dRender = new Render("dialog", "city-selector");
    let areaDialog = mdui.dialog({
        title: "请选择地区",
        content: dRender.getTemplate(),
        buttons: [{
            text: "取消"
        }, {
            text: "确定",
            close: false,
            onClick: () => {
                if ($(".province-select").val() !== "-1" && $(".city-select").val() !== "-1") {
                    areaDialog.close();
                    if ($(".city-select").is(":hidden")) {
                        $(".city-area").text($(".city-select").find(":selected").text()).attr("value", $(".city-select").val());
                    } else {
                        $(".city-area").text($(".province-select").find(":selected").text() + " " + $(".city-select").find(":selected").text()).attr("value", $(".city-select").val());
                    }
                    $(".city-area").attr("change", "true");
                    enableSubmitButton();
                } else {
                    mdui.snackbar("请选择地区");
                }
            }
        }],
        history: false
    });

    $(".province-select").append(`<option value="-1" selected>请选择</option>`);
    fetch("json/province.json").then(res => res.json()).then(province_list => {
        for (let i = 0; i < province_list.province.length; i++) {
            $(".province-select").append(`<option value="${i}">${province_list.province[i]}</option>`);
        };
        mdui.mutation();
        $(".city").hide();
        areaDialog.handleUpdate();
        $(".province-select").change(() => {
            updateCityOptions();
            areaDialog.handleUpdate();
        });
        if ($(".city-area").attr("value")) {
            for (let i = 0; i < province_list.index.length; i++) if (province_list.index[i] == $(".city-area").attr("value").match(/\d{2}/)) {
                $(".province-select").val(i);
                updateCityOptions();
                areaDialog.handleUpdate();
                $(".city-select").val($(".city-area").attr("value"));
                return;
            };
        };
    });

}

function selectSchool() {
    mSzone.getSchoolList({
        city: $(".city-area").attr("value")
    })
        .then(data => {
            if (data.status !== 200) {
                mdui.snackbar(data.message);
                return;
            }
            let dRender = new Render("dialog", "school-selector");
            let schoolDialog = mdui.dialog({
                title: "请选择学校",
                content: dRender.getTemplate(),
                /* `<div class="mdui-typo school">学校</div><select class="mdui-select school school-select"></select>`, */
                buttons: [{
                    text: "取消"
                }, {
                    text: "确定",
                    close: false,
                    onClick: () => {
                        if ($(".school-select").val() !== "-1") {
                            schoolDialog.close();
                            $(".school-name").text($(".school-select").find(":selected").text()).attr({
                                value: $(".school-select").val(),
                                change: "true"
                            });
                            enableSubmitButton();
                        } else {
                            mdui.snackbar("请选择学校");
                        }
                    }
                }],
                history: false
            });
            $(".school-select").append(`<option value="-1" selected>请选择</option>`);
            for (const element of data.data) {
                $(".school-select").append(`<option value="${element.guid}">${element.name}</option>`)
            }
        })
}

function updateGrageOps() {
    $(".agrade-select").empty();
    if ($(".step-select").val() === "-1") {
        $(".agrade").hide();
    } else {
        $(".agrade-select").append(`<option value="-1">请选择</option>`);
        fetch("json/grade.json").then(res => res.json()).then(grade_list => {


            for (const element of grade_list) {
                if ($(".step-select").val() === element.code) {
                    $(".agrade-select").append(`<option value="${element.value}">${element.text}</option>`)
                }
            }
            $(".agrade").show()
        });
    }
}

function selectGrade() {
    let dRender = new Render("dialog", "grade-selector");
    let agradeDialog = mdui.dialog({
        title: "请选择年级",
        content: dRender.getTemplate(),
        /* `<div class="mdui-typo step">阶段</div><select  class="mdui-select step step-select"><option value="-1" selected>请选择</option><option value="x">小学</option><option value="c">初 </option><option value="g">高中</option></select><div class="mdui-typo agrade">年级</div><select  class="mdui-select agrade agrade-select"></select>`, */
        buttons: [{
            text: "取消"
        }, {
            text: "确定",
            close: false,
            onClick: () => {
                if ($(".step-select").val() !== "-1" && $(".agrade-select").val() !== "-1") {
                    agradeDialog.close();
                    $(".grade").text($(".agrade-select").find(":selected").text()).attr({
                        value: $(".agrade-select").val(),
                        change: "true"
                    });
                    enableSubmitButton();
                } else mdui.snackbar("请选择年级");

            }
        }],
        history: false
    });
    $(".agrade").hide();
    agradeDialog.handleUpdate();
    $(".step-select").change(() => {
        updateGrageOps();
        agradeDialog.handleUpdate();
    })
}

function enableSubmitButton() {
    if ($(".city-area").attr("value") !== "" && $(".city-area").attr("value") !== undefined && $(".school-name").attr(
        "value") !== "" && $(".school-name").attr("value") !== undefined && $(".grade").attr("value") !== "" && $(".grade").attr(
            "value") !== undefined && $(".student-name").text !== "点击设置" && $(".student-name").text !== "") {
        $(".saveUserInfo").attr("disabled", null)
    }
}

function submitUserInfo() {
    let postData = {};
    /* let user_cache = */
    mSzone.getUserInfo().then(user_cache => {

        let path = user_cache.schoolGuid === undefined ? "/userinfo/BindStudentInfo" : "/UserInfo/UpdateUserInfo";
        if ($(".city-area").attr("change") === "true") if (user_cache.schoolGuid === undefined) postData.cityCode = $(".city-area").attr("value");
        else postData.city = $(".city-area").attr("value");


        if ($(".student-name").attr("change") === "true") postData.studentName = $(".student-name").text();
        if ($(".school-name").attr("change") === "true") postData.schoolGuid = $(".school-name").attr("value");
        if ($(".grade").attr("change") === "true") if (user_cache.schoolGuid === undefined) postData.gradeCode = $(".grade").attr("value");
        else postData.grade = $(".grade").attr("value");

        mSzone.sendCustomRequest("my", path, "POST", postData)
            .then(data => {
                if (data.status === 200) {
                    mdui.snackbar("绑定成功");
                    $(".saveUserInfo").attr("disabled", true);
                    $("div[change]").removeAttr("change");
                    $("div[set]").removeAttr("set");
                } else mdui.snackbar(data.message);
            });
    });
}

/* 窗口变动监听 */
window.onresize = () => mPageLoader.setBG();

window.onpopstate = () => {
    /* let page_name = location.hash.match(/\#\/(.+?)(?:\\|\?|$)/) */
    let page_name = location.hash.substring(2);
    console.log("popstate:", page_name, location.hash, location.hash.substring(2));
    /* console.log(history.length) */

    let curr_page = document.querySelector(`[page~="${page_name}"]`);
    if (curr_page.closest(".page-container").isEqualNode(document.querySelector(".navigator-container"))) document.querySelectorAll(".subpage-container .app-show").forEach(e => {
        e.classList.add("app-hide");
        setTimeout(ec => ec.remove("app-show", "app-hide"), 300, e.classList);
    });

    /* if(page_name  "") */

    if (localStorage.CurrentUser === undefined) mPageSwitcher.showPage("login", undefined, null);
    else if (page_name !== "login" && page_name) mPageSwitcher.showPage(page_name, undefined, history.state);
    else mPageSwitcher.showPage("home", undefined, null);

};

async function pageModuleLoaded() {
    return new Promise(resolve => {
        setTimeout(() => {
            if (mPageLoader && mPageSwitcher) {
                console.log("inited")
                resolve(true);
            }
            else return pageModuleLoaded()

        }, 100);
    });
}

async function switchPage(page_name) {
    await mSzone.tokenSet();
    await pageModuleLoaded()
    if (localStorage.CurrentUser === undefined) {
        mPageSwitcher.showPage("login", undefined, null)
    } else {
        mPageSwitcher.showPage("home", true, null);
        mPageSwitcher.showPage(page_name, true, history.state);
    }
}

document.querySelectorAll(".navigator-container [page]").forEach(page => page.addEventListener("scroll", function (e) {
    let footer = document.querySelector(".navigator-container footer").classList;
    footer.remove("mdui-headroom-pinned-down", "mdui-headroom-unpinned-down");

    if (navigator_scroll_top > 0) if (navigator_scroll_top < this.scrollTop) footer.add("mdui-headroom-unpinned-down");
    else footer.add("mdui-headroom-pinned-down");

    navigator_scroll_top = this.scrollTop;
}));

/* mdui-headroom-unpinned-toolbar */

document.querySelector(".subpage-container>[page=exam]").addEventListener("scroll", function (e) {
    if (document.querySelector('[page="exam"].app-show')) {

        let header = document.querySelector("[page=exam] .mdui-appbar").classList;
        header.remove("mdui-headroom-pinned-toolbar", "mdui-headroom-unpinned-toolbar");

        if (subpage_scroll_top > 0) if (subpage_scroll_top < this.scrollTop) header.add("mdui-headroom-unpinned-toolbar");
        else header.add("mdui-headroom-pinned-toolbar");

        subpage_scroll_top = this.scrollTop;
    }
});
/* 跳转事项 */
$(document).on("click", ".show-page", (e) => {
    mPageSwitcher.showPage($(e.target).closest(".show-page").attr("data"), true, null);
});
/* 文档页面滚动到锚点 */
$(document).on("click", ".doc-anchor", (e) => {
    window.scrollBy(0, document.querySelector($(e.target).attr("data")).getBoundingClientRect().y - document.querySelector(
        ".simple-appbar").getBoundingClientRect().height + 24);
});

/* 登录按钮点击事件 */
$(document).on("click", "#login-btn", () => {
    /* 验证手机号格式 */
    if ($("#userCode").val().match(/^1\d{10}$/g) === null) {
        mdui.snackbar(-"请输入正确的手机号");
        return false;
    };

    if (!$("#agree-rules-login").is(":checked")) {
        localStorage.removeItem("agree");
        mdui.snackbar("请先同意用户协议");
        return false;
    };

    localStorage.agree = (new Date()).getTime();
    let login_btn = document.querySelector("#login-btn");
    login_btn.value = "登录中...";
    let fetch_data = undefined;
    let auth_method = undefined;
    if (document.querySelector("#login-type").classList.contains("login-sms")) {
        /* 验证密码是否为空 */
        if ($("#password").val().length === 0) {
            mdui.snackbar("密码不能为空");
            return false;
        }

        fetch_data = {
            userCode: $("#userCode").val(),
            password: Base64.encode($("#password").val())
        };
        auth_method = "password";
    } else {
        /* 验证验证码格式 */
        if ($("#smsCode").val().match(/^\d{6}$/g) === null) {
            mdui.snackbar("请输入正确的短信验证码");
            return false;
        };
        fetch_data = {
            userCode: $("#userCode").val(),
            verifyCode: $("#smsCode").val(),
            token: $("#smsCode").attr("token")
        };
        auth_method = "smscode";
    }
    if (auth_method && fetch_data) mSzone.loginToSzone(auth_method, fetch_data)
        /* console.log() */
        .then(data => {
            if (data.status == 200) {
                mdui.snackbar({
                    message: "登录成功",
                    timeout: 500,
                    onClose: function () { mPageSwitcher.showPage("home", false, null); login_btn.value = "登录" }
                });
                login_btn.value = "登录成功";
            }
            else {
                mdui.snackbar(data.message);
                login_btn.value = "登录";
            };
        });
});

$(document).on("click", "#sendsms", () => {
    let userCode = document.querySelector("#userCode");
    mSzone.getSmsCode({ userCode: Base64.encode(userCode.value) })
        .then(data => {
            if (data.status == 200) {
                let smsCode = document.querySelector("#smsCode");
                let sendSms = document.querySelector("#sendsms");
                mdui.snackbar("验证码发送成功");
                smsCode.setAttribute("token", data.data.token);
                sendSms.setAttribute("tel", userCode.value);

                sendSms.setAttribute("disabled", "");
                userCode.setAttribute("disabled", "");
                userCode.parentElement.classList.add("mdui-textfield-disabled");
                countDown(61, function (lefttime, sendSms, userCode) {
                    if (lefttime > 0) {
                        sendSms.textContent = `重新发送(${lefttime})`;
                        if (!sendSms.classList.contains("mdui-hidden")) if (userCode.value != sendSms.getAttribute("tel")) {
                            sendSms.textContent = '获取验证码';
                            sendSms.removeAttribute("disabled");
                            this.clearCounter();
                        } else {
                            userCode.parentElement.classList.add("mdui-textfield-disabled");
                            userCode.setAttribute("disabled", "");
                        }
                    } else {
                        sendSms.textContent = '获取验证码';
                        sendSms.removeAttribute("disabled");
                    }
                }, sendSms, userCode);
            } else {
                mdui.snackbar(data.message);
            }
        });
});

$(document).on("click", "#login-type", () => {
    $(".sms-widget").toggleClass("mdui-hidden");
    $(".password-widget").toggleClass("mdui-hidden");
    $("#login-type").toggleClass("login-sms").toggleClass("login-pwd");
    $("#userCode").parent().removeClass("mdui-textfield-disabled");
    if ($("#login-type").hasClass("login-sms")) {
        /* 切换为密码登录时执行的事件 */
        $("#login-type").text("验证码登录/注册");
        $("#userCode").attr("disabled", null);
    } else {
        /* 切换为验证码登录时执行的事件 */
        if ($("#userCode").val() == $("#smsCode").attr("tel")) {
            if ($("#sendsms").attr("disabled") == "disabled") {
                $("#userCode").attr("disabled", true).parent().addClass("mdui-textfield-disabled");
            }
        } else {
            $("#userCode").attr("disabled", null).parent().removeClass("mdui-textfield-disabled");
        }
        $("#login-type").text("密码登录");
    }
});

/* 成绩详情表格展开/收起 */
$(document).on("click", "[page~=exam] .expand-table", (e) => {
    e = $(e.target).closest("button");
    if (e.find("i").text() === "expand_more") mPageSwitcher.switchDisplay(e.closest(".student-space-table"), false);
    else {
        let table = e.closest(".student-space-table").children().addClass("mdui-hidden");
        table.last().removeClass("mdui-hidden");
        table.first().removeClass("mdui-hidden");
        /* //console.log(e); */
        if (e.closest(".student-space-table").hasClass("subject-grade")) {
            /* console.log("subject-table"); */
            let mylv = e.closest(".student-space-table").find(".mdui-color-theme-accent");
            mylv.removeClass("mdui-hidden");
            mylv.next().removeClass("mdui-hidden").next().removeClass("mdui-hidden");
            mylv.prev().removeClass("mdui-hidden").prev().removeClass("mdui-hidden");
            e.find("span").text("展开");
        } else mPageSwitcher.switchDisplay(e.closest(".student-space-table"), true);
        e.find("i").text("expand_more");
    };
    e.closest("div").removeClass("mdui-hidden");
});
/* 认领考试 */
$(document).on("click", "[page~=unclaim] .exam-item", (e) => {
    click_item = $(e.target).closest(".exam-item");
    let exam_guid = $(e.target).closest(".exam-item").attr("value");
    let student_code_list = JSON.parse(Base64.decode($(e.target).closest(".exam-item").attr("data")));
    $(".examInfo").empty();
    new Promise((resolve, _reject) => {
        let dRender = new Render();
        dRender.setTemplate("dialog", "unclaim-panel");
        let answerCardList = [];
        for (let i = 0; i < student_code_list.length; i++) {
            mSzone.getUnclaimAnswerCard({
                examGuid: exam_guid,
                studentCode: student_code_list[i]
            })
                .then(data => {
                    let img;
                    if (data.status == 200) {
                        img = data.data.url;
                    };

                    answerCardList.push({
                        studentCode: student_code_list[i],
                        examGuid: exam_guid,
                        defaultOpen: i == 0 ? "mdui-panel-item-open" : "",
                        answerCard: img
                    });
                    if (answerCardList.length == student_code_list.length) resolve(dRender.renderListText(answerCardList).replace(/lz\-src/g, "src"));

                });
        };
    })
        .then(itemContent => {
            let dRender = new Render();
            dRender.setTemplate("dialog", "unclaim-dialog");
            claim_dialog = mdui.dialog({
                title: "认领考试",
                content: dRender.renderToText({ unclaimPanel: itemContent }),
                /* `<span class="mdui-typo">请选择属于本人的考试认领</span><div class="mdui-panel examInfo" mdui-panel="{accordion: true}">${itemContent}</div>`, */
                onOpen: (inst) => {
                    $("img").one("load", el => {
                        new Viewer(el.target, {
                            toolbar: false,
                            navbar: false,
                            title: false
                        });
                        inst.handleUpdate();
                    });

                },
                buttons: [{
                    text: "取消"
                }],
                history: false
            });
            claim_dialog.open();
            mdui.mutation();
        })

});

/* 打开考试详情页面 */
$(document).on("click", "[page~=home] .exam-item", (e) => {
    let exam_data = JSON.parse(Base64.decode($(e.target).closest(".exam-item").attr("data")));
    let jump_id = (new Date()).getTime().toString();
    let jump_data = {
        id: jump_id,
        examData: exam_data,
    };
    mPageSwitcher.showPage("exam", true, {
        jumpId: jump_id,
        jumpData: jump_data
    });
});

/* 成绩详情页图片懒加载 */
$(document).on("change.mdui.tab", "[page~=exam] .mdui-tab", (event) => {
    $("#" + event.detail.id).find(".lz-load").each((_i, e) => {
        mPageLoader.loadLazySrc(e);
    });
});

$(document).on("click", ".open-link", (e) => {
    window.open($(e.target).closest(".open-link").attr("data"));
});

$(document).on("click", ".jump-link", (e) => {
    window.location.assign($(e.target).closest(".jump-link").attr("data"));
});

$(document).on("click", ".connect-watch", _e => {
    mdui.dialog({
        title: "连接手表",
        content: (new Render("dialog", "auth-devices")).getTemplate(),
        buttons: [{
            text: "授权",
            close: false,
            onClick: authWatch,
            bold: true
        }],
        history: false
    });

    let auth_code = document.querySelector(".authcode > input");
    auth_code.addEventListener("blur", e => {
        if (e.target == auth_code) document.querySelector(".authcode > .focus").classList.add("mdui-hidden")
    });

});

function backForward() {
    let hash = location.hash;
    new Promise(resolve => {
        window.history.back();
        setTimeout(() => resolve(), 50);
    })
        .then(() => { if (hash == location.hash) location.href = "#/home"; });
}

function focusAuthCode(auth_code) {
    document.querySelector(".authcode>.focus").classList.remove("mdui-hidden");
    if (auth_code.setSelectionRange) auth_code.setSelectionRange(auth_code.value.length, auth_code.value.length);
    if (window.getSelection) window.getSelection().removeAllRanges();
    else document.selection.empty();
    let code = auth_code.value;
    let len = code.length;
    len = len < 4 ? len : 3;
    document.querySelector(".authcode>.focus").style.left = `calc(${len * 100}% + ${len * 16}px)`;
    auth_code.focus();
}

function appVersion() {
    fetch("json/version.json")
        .then(res => res.json())
        .then(app_info => {
            mdui.dialog({
                title: "更新日志",
                content: app_info.details,
                buttons: [{
                    text: "确定"
                }],
                history: false
            });
        });
}

document.addEventListener("click", e => {
    if (e.target.closest(".back-forward-btn")) {
        backForward();
        return;
    }

    let auth_box = document.querySelectorAll(".authcode > span");
    let auth_code = document.querySelector(".authcode > input");
    let inc = false;

    auth_box.forEach(it => {
        inc = inc || e.target == it;
    });

    if (inc) {
        focusAuthCode(auth_code);
        return;
    };

    if (e.target.closest("a") && e.target.closest("a").classList.contains("download-answer-card") && !e.target.closest("a").download) {
        mdui.snackbar("该图像为跨域资源，请长按或鼠标右键点击图片以保存到设备。");
        return;
    };

    if (e.target.closest(".app-version")) {
        appVersion();
        return;
    };

    if (e.target.closest(".band-order")) {
        mPageSwitcher.bandOrder();
        return;
    };

    if (e.target.closest(".logout-stusp")) {
        logout();
        return;
    };
});


document.addEventListener("input", (e) => {
    let auth_code = document.querySelector(".authcode > input");
    if (e.target == auth_code) {
        let code = auth_code.value;
        code = code.replace(/[^0-9 ]/g, "");

        code = code.match(/\d{0,4}/)[0];
        auth_code.value = code;
        let len = code.length;
        len = len < 4 ? len : 3;
        document.querySelector(".authcode>.focus").style.left = `calc(${len * 100}% + ${len * 16}px)`
    }
});

document.addEventListener("change", e => {
    if (e.target instanceof HTMLInputElement && e.target.closest('[page="settings"]')) {
        let settings_config = localStorage.stusp_settings_config;
        settings_config = settings_config ? JSON.parse(settings_config) : { "dark-mode-follow-system": false, "dark-mode-status": false, "eruda-status": false, "debug-over-usb": false };
        settings_config[e.target.id] = e.target.checked;
        e.target.closest("li").setAttribute('data', e.target.checked);
        localStorage.stusp_settings_config = JSON.stringify(settings_config);
        switch (e.target.id) {
            case "dark-mode-follow-system":
                fitDayNightMode(e.target.checked ? undefined : settings_config['dark-mode-status']);
                if (window.stusp) {
                    stusp.setDayNightMode(e.target.checked ? -1 : settings_config['dark-mode-status'] + 0);
                    fitDayNightMode(stusp.isNightMode());
                }
                break;
            case "dark-mode-status":
                fitDayNightMode(e.target.checked);
                if (window.stusp) stusp.setDayNightMode(e.target.checked + 0);
                break;
            case "eruda-status":
                break;
            case "debug-over-usb":
                if (window.stusp) {
                    stusp.enableUSBDebug(e.target.checked);
                }
                break;
            default: break;
        }
    }
});


function authWatch() {
    let auth_code = document.querySelector(".authcode > input");
    auth_code = auth_code.value.replace(/ /g, "");
    /* 想提前体验的可在浏览器登入学习空间，然后再控制台输入如下代码即可 */
    let json_type = new Headers();
    json_type.append('Content-Type', 'application/json');
    fetch("/api/authdevice", {
        method: "POST",
        body: JSON.stringify({
            authcode: auth_code,
            token: mSzone.getToken()
        }),
        headers: json_type
    })
        .then(data => data.json())
        .then(data => {
            if (data.status == 200) {
                this.close();
                mdui.snackbar("登录成功，请查看手表");
            } else mdui.snackbar("授权码错误或已失效");

        });
}

function logout() {
    mdui.dialog({
        title: "退出登录",
        content: `确定退出登录？<br /><label class="mdui-checkbox"><input type="checkbox"/><i class="mdui-checkbox-icon" disable></i>清除本地缓存 (此功能暂时无效)</label>`,
        history: false,
        buttons: [
            {
                text: "取消"
            },
            {
                text: "确定",
                bold: true,
                onClick: () => { mPageLoader.logout() }
            }
        ],

    });
}

$(".back-top").addClass("mdui-hidden");
$(document).on("click", ".back-top", () => window.scrollTo(0, 0));

