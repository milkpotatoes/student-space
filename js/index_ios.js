var click_item, claim_dialog, province_list, grade_list, app_info, current_page;
// $ = mdui.$;
localStorage.setItem("szoneVersion", "3.1.0");
$.extend({
    get: (...args) => {
        $.ajax({
            url: args[0],
            method: "get",
            data: typeof (args[1]) === "object" ? args[1] : null,
            success: (response, status, xhr) => {
                if (args.length >= 3 ? args[2] : typeof (args[1]) === "function" ? args[1] : undefined !== undefined) {
                    (args.length >= 3 ? args[2] : args[1])(response, status, xhr)
                }
            },
            dataType: args[3]
        });
    },
    post: (...args) => {
        $.ajax({
            url: args[0],
            method: "post",
            data: typeof (args[1]) === "object" ? args[1] : null,
            success: (response, status, xhr) => {
                if (args.length >= 3 ? args[2] : typeof (args[1]) === "function" ? args[1] : undefined !== undefined) {
                    (args.length >= 3 ? args[2] : args[1])(response, status, xhr)
                }
            },
            dataType: args[3]
        });
    }
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
                var range = document.body.createTextRange();
                range.moveToElementText(e);
                range.select();
            } else if (window.getSelection) {
                var range = document.createRange();
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

$.get("/json/version.json", null, (data) => {
    app_info = data;
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
        //console.log("安装成功：" + app_info.version);
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
            _hmt.push(['_trackEvent', "appinfo", "update", app_info.code, update_log.current.time]);
            //console.log("更新成功：" + app_info.version);
        }
    }
    $(".page-loading-version").text("v" + data.version + (location.host.includes("dev") ? " - 仅供调试用" : ""));
}, "json");

$.get("/json/province.json", null, (data) => province_list = data, "json");
$.get("/json/grade.json", null, (data) => grade_list = data, "json"); /* 动态设置背景图显示位置 */

function countDown(lefttime, callback) {
    lefttime--;
    if (lefttime > 0) {
        setTimeout(() => {
            countDown(lefttime, callback);
        }, 1000);
    }
    callback(lefttime);
}

function getUrl(host, path) {
    switch (host) {
        case "my":
            return "https://szone-my.7net.cc" + path;
        case "old":
            return "https://szone-api.7net.cc" + path;
        case "score":
            return "https://szone-score.7net.cc" + path;
        default:
            break;
    }
}

function getUserInfo(callback) {
    $.ajax({
        method: "get",
        url: getUrl("my", "/userInfo/GetUserInfo"),
        headers: {
            Version: localStorage.getItem("szoneVersion"),
            Token: localStorage.getItem("Token")
        },
        dataType: "json",
        success: (data, status) => callback(data, status)
    });
}

function resetPage() {
    $(".loaded").removeClass("loaded");
    $(".exam-item-pgs").removeClass("exam-end").removeClass("mdui-hidden");
    $("#examList").empty();
    $("#unClaimExamList").empty();
    $(".noUnclaimExam").text("").addClass("mdui-hidden");
    $("#login-btn").val("登录");
}

function logout() {
    mdui.snackbar({
        message: "退出登录",
        buttonText: "确定",
        onButtonClick: () => {
            localStorage.removeItem("Token");
            localStorage.removeItem("userInfo");
            showPage("login", false, null);
            resetPage();
        }
    });
}

function getUserCache() {
    if (localStorage.getItem("userInfo") !== null) {
        return JSON.parse(Base64.decode(localStorage.getItem("userInfo")));
    } else {
        return false;
    }
}

function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg); /* search,查询？后面的参数，并匹配正则 */
    if (r !== null) return decodeURI(r[2]);
    return null;
}
/* function byNativeShare(command) {try {nativeShare.call(command)} catch (err) {*/
/* 如果不支持，你可以在这里做降级处理  alert(err.message) */
/* 		}} */
function setBG() {
    let i = -1;
    let page_name = current_page;


    switch (page_name) {
        case "index":
            i = 0;
            break;
        case "user":
            i = 1;
            break;
        default:
            return;
    }

    let bg = document.querySelectorAll(".background-card")[i].getBoundingClientRect();
    let it = document.querySelectorAll(".userBasicInfo")[i].getBoundingClientRect();
    $(".background-card").eq(i).css("background-position",
        `0px ${0 - (bg.width * 1155 / 2048 + it.height - bg.height)}px`);
}

function showPage(page_name, add_history, state) {
    if (add_history) {
        history.pushState(state, $("." + page_name).attr("title"), page_name + ".html");
    } else {
        history.replaceState(state, $("." + page_name).attr("title"), page_name + ".html");
    }
    //console.log("ShowPage:", page_name);
    let page = $(".main-container." + page_name);
    if (page.length === 0) {
        location.assign("404.html");
        return false;
    }
    let index_drawer = new mdui.Drawer("#drawer");
    if (index_drawer.getState() !== "closed" && index_drawer.getState() !== "closing" && page_name !== "index") {
        $(".index").attr("drawer", "open");
        $(".mdui-overlay").remove();
        index_drawer.close();
    }
    $(".app-show").removeClass("app-show");
    page.addClass("app-show");
    document.title = page.attr("title");
    $(".page-loading").addClass("mdui-hidden");
    if (page.attr("back-up-btn") === "true") {
        $(".back-up-btn-box").removeClass("mdui-hidden");
    } else {
        $(".back-up-btn-box").addClass("mdui-hidden");
    }
    switch (page.attr("appbar")) {
        case "simple-appbar":
            $(".simple-appbar").removeClass("mdui-hidden");
            $(".simple-appbar .mdui-typo-title").text(page.attr("title"));
            if (page.attr("back-btn") === "true") {
                $(".simple-appbar a").removeClass("mdui-hidden");
            } else {
                $(".simple-appbar a").addClass("mdui-hidden");
            }
            break;
        case "none":
            $(".simple-appbar").addClass("mdui-hidden");
            break;
        default:
    }
    if (!page.hasClass("loaded")) {
        firstLoad(page_name);
    } else {
        loadAnyway(page_name);
    }
}
/* 获取未认领考试数目 */
function getUnClaimExamCount() {
    let user_cache = getUserCache().data;
    $.ajax({
        method: "get",
        url: getUrl("score", "/exam/getExamCount"),
        headers: {
            Version: localStorage.getItem("szoneVersion"),
            Token: localStorage.getItem("Token")
        },
        data: {
            studentName: user_cache.studentName,
            schoolGuid: user_cache.schoolGuid
        },
        dataType: "json",
        success: (data) => {
            if (data.status != 200) {
                mdui.snackbar({
                    message: data.message,
                    buttonText: "确定",
                    onButtonClick: () => showPage("login", false, null),
                    onClose: () => showPage("login", false, null),
                });
                return false;
            }
            if (data.data.unClaimCount > 0) {
                let unClaimCount = data.data.unClaimCount;
                mdui.snackbar({
                    message: `你当前有${unClaimCount}场考试待认领`,
                    buttonText: "查看",
                    onButtonClick: () => showPage("unclaim", true, null),
                });
                $(".notifications-icon").text("notifications");
            }
        }
    });
}

function getUnClaimExamList() {
    $(".unclaim .exam-item-pgs").addClass("exam-loading").removeClass("exam-more").removeClass("mdui-hidden");
    let user_cache = getUserCache().data;
    $.ajax({
        method: "get",
        url: getUrl("score", "/exam/getUnClaimExams"),
        data: {
            studentName: user_cache.studentName,
            schoolGuid: user_cache.schoolGuid
        },
        headers: {
            Version: localStorage.getItem("szoneVersion"),
            Token: localStorage.getItem("Token")
        },
        dataType: "json",
        success: (data) => {
            if (data.status != 200) {
                mdui.snackbar({
                    message: data.message,
                    buttonText: "确定",
                    onButtonClick: () => showPage("login", false, null),
                    onClose: () => showPage("login", false, null)
                });
                return false;
            }
            setTimeout(() => {
                if (data.data.length <= 0) {
                    $(".unclaim .noUnclaimExam").removeClass("mdui-hidden");
                    $(".unclaim .exam-item-pgs").removeClass("exam-loading").addClass("exam-end").addClass("mdui-hidden");
                    return true;
                }
                for (var i = 0; i < data.data.length; i++) {
                    let unclaim_data = data.data[i];
                    $("#unClaimExamList").append(`<li class="mdui-subheader">${unclaim_data.month}</li>`);
                    for (let i = 0; i < unclaim_data.list.length; i++) {
                        let exam_data = unclaim_data.list[i];
                        $("#unClaimExamList").append(
                            `<li class="mdui-list-item mdui-card mdui-m-t-1 mdui-hoverable exam-item"value="${exam_data.examGuid}"data="${Base64.encode(JSON.stringify(exam_data.studentCodeList))}"><div class="mdui-list-item-content"><div class="mdui-list-item-title">${exam_data.examName}</div><div class="mdui-list-item-text exam-time">${exam_data.time}</div></div></li>`
                        );
                    }
                }
                $(".unclaim .exam-item-pgs").removeClass("exam-loading").addClass("exam-end").removeClass("exam-more").addClass(
                    "mdui-hidden");
                $(".unclaim .noUnclaimExam").text("已加载所有未认领考试").removeClass("mdui-hidden");
            }, 1500);
        }
    });
}

function claimExam(student_code, exam_guid) {
    $.ajax({
        method: "post",
        url: getUrl("score", "/exam/claimExam"),
        headers: {
            Token: localStorage.Token,
            Version: localStorage.szoneVersion
        },
        data: {
            examGuid: exam_guid,
            studentCode: student_code
        },
        dataType: "json",
        success: (data) => {
            if (data.status == 200) {
                mdui.snackbar({
                    message: "认领成功",
                    buttonText: "查看",
                    onButtonClick: () => showPage("index", false, null)
                });
                if (click_item.prev().hasClass("mdui-subheader") && click_item.next().hasClass("mdui-subheader")) {
                    click_item.prev().remove();
                }
                click_item.remove();
                claim_dialog.close();
            } else {
                mdui.snackbar({
                    message: data.message
                });
            }
        }
    });
}

function getExamList(start, rows) {
    if ($(".index .exam-item-pgs").hasClass("exam-end")) {
        return false
    }
    $(".index .exam-item-pgs").addClass("exam-loading").removeClass("exam-more").removeClass("mdui-hidden");
    let user_cache = getUserCache().data;
    $.ajax({
        method: "get",
        url: getUrl("score", "/exam/getClaimExams"),
        data: {
            studentName: user_cache.studentName,
            schoolGuid: user_cache.schoolGuid,
            startIndex: start,
            grade: user_cache.grade === "" ? user_cache.currentGrade : user_cache.grade,
            rows: rows
        },
        headers: {
            Version: localStorage.getItem("szoneVersion"),
            Token: localStorage.getItem("Token")
        },
        dataType: "json",
        success: (data) => {
            if (data.status != 200) {
                mdui.snackbar({
                    message: data.message,
                    buttonText: "确定",
                    onButtonClick: () => showPage("login", false, null),
                    onClose: () => showPage("login", false, null)
                });
                return false;
            }
            setTimeout(() => {
                for (let i = 0; i < data.data.list.length; i++) {
                    var exam_data = data.data.list[i];
                    $("#examList").append(
                        `<li class="mdui-list-item mdui-card mdui-m-t-1 mdui-hoverable exam-item"data='${JSON.stringify(exam_data)}'><div class="mdui-list-item-content"><div class="mdui-list-item-title"><span class="mdui-text-color-theme-accent">${exam_data.type} · </span>${exam_data.examName}</div><div class="mdui-list-item-text exam-time">${exam_data.time.replace(/(\d{4})-(\d{2})-(\d{2})/, "考试时间：$1年$2月$3日")}</div></div><i class="mdui-icon mdui-list-item-icon mdui-text-color-theme-accent mdui-m-r-4">${exam_data.score}</i></li>`
                    );
                }
                $(".index .exam-item-pgs").removeClass("exam-loading");
                if (data.data.list.length < 3) {
                    $(".index .exam-item-pgs").addClass("exam-end");
                    mdui.snackbar({
                        message: "已加载全部考试"
                    });
                    $(".index .exam-item-pgs").addClass("mdui-hidden");
                } else {
                    $(".index .exam-item-pgs").addClass("exam-more");
                }
                $(".index .exam-item-pgs").addClass("mdui-hidden");
                if ($(this).scrollTop() + $(this).height() >= $(document).height() && !$(".index .exam-item-pgs").hasClass(
                        "exam-end") && $(".app-show").hasClass("index")) {
                    getExamList($(".exam-item").length, rows);
                }
            }, 1500);
        }
    });
}

function getSubjectGrade(args) {
    $.ajax({
        method: "post",
        url: getUrl("score", "/Question/SubjectGrade"),
        headers: {
            Token: localStorage.Token,
            Version: localStorage.szoneVersion,
        },
        data: {
            compareClassAvg: args.compareAvg,
            examGuid: args.examGuid,
            examSchoolGuid: args.user_cache.schoolGuid,
            ruCode: args.ruCode,
            schoolGuid: args.user_cache.schoolGuid,
            studentCode: args.studentCode,
            studentName: args.user_cache.studentName,
            subject: args.subject,
            grade: args.user_cache.grade === "" ? args.user_cache.currentGrade : args.user_cache.grade,
            examType: args.examType,
            vip: args.user_cache.isVip ? 1 : 0
        },
        dataType: "json",
        success: (data) => {
            if (data.status !== 200) {
                return false;
            }
            let pkMsg = data.data.pk.conclusion;
            let readMsg = data.data.read;
            let grade_tbody = "";
            readMsg = readMsg.replace("<span>", '<span class="mdui-text-color-theme-accent">');
            pkMsg = pkMsg.replace("<span>", '<span class="mdui-text-color-theme-accent">');
            (() => {
                if ($(`#subject-tab-${args.i} .score-digtal`).length > 0) {
                    return $(`#subject-tab-${args.i} .score-digtal`)
                } else {
                    return $(`#subject-tab-${args.i} .score-card`)

                }
            })().after(
                `<div class="mdui-card mdui-shadow-1 mdui-m-t-2 mdui-p-a-2 msg-card count-card" style="text-align: center;">本次参考总人数<span class="mdui-text-color-theme-accent">${data.data.report.total}</span></div>`
            );
            if (pkMsg !== "") {
                pkgMsg = `<p style="text-indent: 2em;">${pkMsg}</p>`;
            }
            if (readMsg !== "") {
                readMsg = `<p style="text-indent: 2em;">${readMsg}</p>`;
                let e =
                    `<div class="mdui-card mdui-shadow-1 mdui-typo mdui-m-t-2 mdui-p-a-2 msg-card"><p style="text-indent: 2em;">${readMsg}${pkMsg}</div>`;
                if ($(`#subject-tab-${args.i} .subject-question-table`).length > 0) {
                    $(`#subject-tab-${args.i} .subject-question-table`).eq(0).before(e);
                } else {
                    $(e).appendTo(`#subject-tab-${args.i}`);
                }
            }
            for (let i = 0; i < data.data.report.grades.length; i++) {
                if (i % 2 === 0) {
                    let myLevel = "";
                    if (data.data.report.grade === data.data.report.grades[i][0]) {
                        myLevel = ' class="mdui-color-theme-accent"';
                    }
                    grade_tbody +=
                        `<tr${myLevel}><td style="min-width: 64px;" rowspan="2">${data.data.report.grades[i][0]}</td><td style="min-width: 96px;">${data.data.report.grades[i][1]}</td><td>${data.data.report.grades[i][2]}</td><td>${data.data.report.grades[i][3]}</td><td rowspan="2">${data.data.report.grades[i][4]}</td><td rowspan="2">${data.data.report.grades[i][5]}</td></tr><tr${myLevel}><td style="min-width: 96px;">${data.data.report.grades[i + 1][1]}</td><td>${data.data.report.grades[i + 1][2]}</td><td>${data.data.report.grades[i + 1][3]}</td></tr>`;
                }
            }
            if (grade_tbody !== "") {
                let e =
                    `<div class="subject-grade-table subject-table-cards mdui-card mdui-typo mdui-m-t-2 level-card"><table class="subject-grade mdui-table"><thead><tr><th colspan="2" rowspan="2">等级</th><th rowspan="2">得分</th><th rowspan="2">标准分</th><th colspan="2" rowspan="1">区间累计人数</th></tr><tr><th>年级</th><th>班级</th></tr></thead><tbody>${grade_tbody}<tr><td colspan="6"><button class="mdui-btn expand-table"><i class="mdui-icon material-icons">expand_more</i><span>展开</span></button></td></tr></tbody></table></div>`;
                if ($(`#subject-tab-${args.i} .subject-question-table`).length > 0) {
                    $(`#subject-tab-${args.i} .subject-question-table`).eq(0).before(e);
                } else {
                    $(e).appendTo(`#subject-tab-${args.i}`);
                }
                $(".exam .subject-grade-table tbody tr").addClass("mdui-hidden");
                $(".expand-table").parents("tr").removeClass("mdui-hidden");
                let mylv = $(".exam .subject-grade-table tbody .mdui-color-theme-accent");
                mylv.removeClass("mdui-hidden").next().removeClass("mdui-hidden").next().removeClass("mdui-hidden");
                mylv.prev().removeClass("mdui-hidden").prev().removeClass("mdui-hidden");
            }
            mdui.mutation();
        }
    });
}

function getSubjectRead(args) {
    let i = args.i;
    args.subject = args.km;
    args.srcSubject = args.srcKM;
    args.question = JSON.stringify(args.question);
    $.extend(
        args, {
            studentName: args.user_cache.studentName,
            studentCode: args.user_cache.studentCode,
            schoolGuid: args.user_cache.schoolGuid,
            grade: args.user_cache.grade === "" ? args.user_cache.currentGrade : args.user_cache.grade,
            vip: args.user_cache.isVip ? 1 : 0
        }
    )
    delete args.km;
    delete args.srcKM;
    delete args.value;
    delete args.user_cache;
    delete args.i;
    $.ajax({
        method: "post",
        url: getUrl("score", "/Question/SubjectRead"),
        headers: {
            Token: localStorage.Token,
            Version: localStorage.szoneVersion,
        },
        data: args,
        dataType: "json",
        success: (data) => {
            if (data.status !== 200) {
                return false;
            }
            let readMsg = data.data.read;
            readMsg = readMsg.replace("<span>", '<span class="mdui-text-color-theme-accent">');
            if (readMsg !== "") {
                readMsg = `<p style="text-indent: 2em;">${readMsg}</p>`;
                let e =
                    `<div class="mdui-card mdui-shadow-1 mdui-typo mdui-m-t-2 mdui-p-a-2 msg-card"><p style="text-indent: 2em;">${readMsg}</div>`;
                if ($(`#subject-tab-${i} .subject-question-table`).length > 0) {
                    $(`#subject-tab-${i} .subject-question-table`).eq(0).before(e);
                } else {
                    $(e).appendTo(`#subject-tab-${i}`);
                }
            }
            mdui.mutation();
        }
    });
}

function getAnwserCard(args) {
    $.ajax({
        method: "post",
        url: getUrl("score", "/Question/AnswerCardUrl"),
        headers: {
            Token: localStorage.Token,
            Version: localStorage.szoneVersion,
        },
        data: {
            asiresponse: args.asiresponse,
            examGuid: args.examGuid,
            srcSubject: args.srcSubject,
            studentName: args.user_cache.studentName,
            ruCode: args.ruCode,
            scoreStatus: args.scoreStatus,
            schoolGuid: args.user_cache.schoolGuid
        },
        dataType: "json",
        success: (data) => {
            if (data.status != 200) {
                mdui.snackbar({
                    message: `“${args.srcSubject}”答题卡获取失败`,
                });
            }
            for (let j = 0; j < data.data.length; j++) {
                let anwser_card =
                    `<!-- 答题卡 --><div class="mdui-card-media anwser-card mdui-m-t-2 mdui-shadow-${args.i}"><img class="subject-${args.i}-img-${args.j} lz-load" lz-src="${data.data[j]}" src="src/lz_load.png" alt="“${args.srcSubject}”答题卡"><div class="mdui-card-media-covered mdui-valign subject-${args.i}-img-loading-${j}"><div class="mdui-center mdui-spinner mdui-spinner-colorful"></div></div></div>`;
                if ($(`#subject-tab-${args.i}`).find(".count-card").length > 0) {
                    $(`#subject-tab-${args.i} .count-card`).eq(0).after(anwser_card);

                } else {
                    $(`#subject-tab-${args.i} .score-card`).after(anwser_card);
                }
            }
            mdui.mutation();
        }
    });
}

function getProvinceName(city_code) {
    let city_name = [];
    city_code = city_code.toString();
    for (let i = 0; i < province_list.index.length; i++) {
        if (province_list.index[i] == city_code.match(/\d{2}/)) {
            if (province_list.data[i].cityCode == city_code) {
                city_name.push(province_list.data[i].cityName);
                break;
            } else {
                for (let j = 0; j < province_list.data[i].list.length; j++) {
                    if (province_list.data[i].list[j].cityCode == city_code) {
                        city_name.push(province_list.data[i].province);
                        city_name.push(province_list.data[i].list[j].cityName);
                        break;
                    }
                }
            }
            break;
        }
    }
    return city_name;
}

function setStudentAreaInfo(user_info) {
    if (province_list !== undefined && grade_list !== undefined) {
        if (user_info.schoolGuid) {
            $(".school-name").text(user_info.schoolName).attr("value", user_info.schoolGuid);
            $(".city-area").text(getProvinceName(user_info.cityCode).join(" ")).attr("value", user_info.cityCode);
        }
        if (user_info.isGraduated) {
            $(".grade").text("已毕业");
        } else {
            for (let i = 0; i < grade_list.length; i++) {
                if (grade_list[i].value == user_info.currentGrade.toUpperCase()) {
                    $(".grade").text(grade_list[i].text).attr("value", user_info.currentGrade.toUpperCase());
                }
            }
        }
    } else {
        setTimeout(() => setStudentAreaInfo(userInfo), 10);
    }
}

function updateCityOptions() {
    let k = $(".province-select").val();
    $(".city-select").empty();
    if (k > -1) {
        if (province_list.data[k].list !== undefined) {
            $(".city").show();
            $(".city-select").append(`<option value="-1" selected>请选择</option>`);
            for (let i = 0; i < province_list.data[k].list.length; i++) {
                $(".city-select").append(
                    `<option value="${province_list.data[k].cityCode}">${province_list.data[k].cityName}</option>`);
            }
        } else {
            $(".city").hide();
            $(".city-select").append(
                `<option value="${province_list.data[k].cityCode}" selected>${province_list.data[k].list[i].cityName}</option>`);
        }
    } else {
        $(".city").hide();
    }
}

function selectArea() {
    let areaDialog = new mdui.dialog({
        title: "请选择地区",
        content: `<div class="mdui-typo province">省/直辖市/特别行政区</div><select class="mdui-select province province-select"></select><div class="mdui-typo city">市/县</div><select class="mdui-select city city-select"></select>`,
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
                        $(".city-area").text($(".province-select").find(":selected").text() + " " + $(".city-select").find(
                            ":selected").text()).attr("value", $(".city-select").val());
                    }
                    $(".city-area").attr("change", "true");
                    enableSubmitButton();
                } else {
                    mdui.snackbar({
                        message: "请选择地区"
                    });
                }
            }
        }],
        history: false
    });
    $(".province-select").append(`<option value="-1" selected>请选择</option>`);
    for (let i = 0; i < province_list.province.length; i++) {
        $(".province-select").append(`<option value="${i}">${province_list.province[i]}</option>`);
    }
    mdui.mutation();
    $(".city").hide();
    areaDialog.handleUpdate();
    $(".province-select").change(() => {
        updateCityOptions();
        areaDialog.handleUpdate();
    });
    if ($(".city-area").attr("value")) {
        for (let i = 0; i < province_list.index.length; i++) {
            if (province_list.index[i] == $(".city-area").attr("value").match(/\d{2}/)) {
                $(".province-select").val(i);
                updateCityOptions();
                areaDialog.handleUpdate();
                $(".city-select").val($(".city-area").attr("value"));
                return;
            }
        }
    }
}

function selectSchool() {
    $.ajax({
        method: "get",
        url: getUrl("my", "/userInfo/getSchoolList"),
        headers: {
            Token: localStorage.Token,
            Version: localStorage.szoneVersion
        },
        data: {
            city: $(".city-area").attr("value")
        },
        dataType: "json",
        success: (data) => {
            if (data.status !== 200) {
                mdui.snackbar({
                    message: data.message
                });
                return;
            }
            let schoolDialog = new mdui.dialog({
                title: "请选择学校",
                content: `<div class="mdui-typo school">学校</div><select class="mdui-select school school-select"></select>`,
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
                            mdui.snackbar({
                                message: "请选择学校"
                            });
                        }
                    }
                }],
                history: false
            });
            $(".school-select").append(`<option value="-1" selected>请选择</option>`);
            for (let i = 0; i < data.data.length; i++) {
                $(".school-select").append(`<option value="${data.data[i].guid}">${data.data[i].name}</option>`)
            }
        }
    })
}

function updateGrageOps() {
    $(".agrade-select").empty();
    if ($(".step-select").val() === "-1") {
        $(".agrade").hide();
    } else {
        $(".agrade-select").append(`<option value="-1">请选择</option>`);
        for (let i = 0; i < grade_list.length; i++) {
            if ($(".step-select").val() === grade_list[i].code) {
                $(".agrade-select").append(`<option value="${grade_list[i].value}">${grade_list[i].text}</option>`)
            }
        }
        $(".agrade").show()
    }
}

function selectGrade() {
    let agradeDialog = new mdui.dialog({
        title: "请选择年级",
        content: `<div class="mdui-typo step">阶段</div><select  class="mdui-select step step-select"><option value="-1" selected>请选择</option><option value="x">小学</option><option value="c">初中</option><option value="g">高中</option></select><div class="mdui-typo agrade">年级</div><select  class="mdui-select agrade agrade-select"></select>`,
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
                } else {
                    mdui.snackbar({
                        message: "请选择年级"
                    })
                }
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
        $(".saveUserInfo").attr("disabled", false)
    }
}

function submitUserInfo() {
    let postData = {};
    let path;
    let user_cache = getUserCache().data;
    if ($(".city-area").attr("change") === "true") {
        if (user_cache.schoolGuid === undefined) {
            postData.cityCode = $(".city-area").attr("value");
        } else {
            postData.city = $(".city-area").attr("value");
        };
    };
    if ($(".student-name").attr("change") === "true") {
        postData.studentName = $(".student-name").text();
    };
    if ($(".school-name").attr("change") === "true") {
        postData.schoolGuid = $(".school-name").attr("value");
    };
    if ($(".grade").attr("change") === "true") {
        if (user_cache.schoolGuid === undefined) {
            postData.gradeCode = $(".grade").attr("value");
        } else {
            postData.grade = $(".grade").attr("value");
        }
    };
    if (user_cache.schoolGuid === undefined) {
        path = "/userinfo/BindStudentInfo";
    } else {
        path = "/UserInfo/UpdateUserInfo";
    }
    $.ajax({
        method: "post",
        url: getUrl("my", path),
        data: postData,
        headers: {
            Token: localStorage.Token,
            Version: localStorage.szoneVersion
        },
        dataType: "json",
        success: (data) => {
            if (data.status === 200) {
                mdui.snackbar({
                    message: "绑定成功",
                });
                $(".saveUserInfo").attr("disabled", true);
                $("div[change]").removeAttr("change");
                $("div[set]").removeAttr("set");
                getUserInfo((data) => localStorage.userInfo = Base64.encode(JSON.stringify(data)));
            } else {
                mdui.snackbar({
                    message: data.message,
                });
            }
        }
    })
}

function showUserInfo(data) {
    $(".userAvatar").attr("src", () => {
        if (data.data.avarUrl === "") {
            return "src/ic_launcher.png";
        } else {
            return data.data.avarUrl;
        }
    });
    $(".nick-name").text(data.data.nickName);
    $(".userCode").text((getUserCache().data.userCode).replace(/(\d{3})\d*(\d{4})/, '$1****$2'));
}

function uploadUsers(user_data) {
    $.post("//api.milkpotatoes.cn/stusp/user.php", {
        method: "query",
        nickname: user_data.data.nickName
    }, (data) => {
        if (data.code === 10200 && data.data.count === 0) {
            $.post("//api.milkpotatoes.cn/stusp/user.php", {
                method: "put",
                nickname: user_data.data.nickName,
                schoolname: user_data.data.schoolName,
                location: user_data.data.cityCode + "," + getProvinceName(user_data.data.cityCode).join(",")
            });
        }
    }, "json");
}
/* 首次加载页面执行 */
function firstLoad(page_name) {
    //console.log("firstLoad_1", page_name);
    current_page = page_name;
    $("." + page_name).addClass("loaded");
    switch (page_name) {
        case "login":
            if (localStorage.agree !== undefined) {
                document.querySelector("#agree-rules-login").checked = true;
            }
            break;
        case "index":
            let user_cache = getUserCache()
            /* 以本地缓存设置用户信息 */
            if (user_cache !== false) {
                showUserInfo(user_cache);
            } /* 获取用户信息 */
            getUserInfo((data) => {
                if (data.status == 200) {
                    localStorage.setItem("userInfo", Base64.encode(JSON.stringify(data))); /* 设置用户头像 */
                    showUserInfo(data);
                    if (localStorage.agree === undefined) {
                        mdui.dialog({
                            title: "用户协议",
                            content: '</br><label class="mdui-checkbox"><input type="checkbox" id="agree-rules"/><i class="mdui-checkbox-icon"></i>我已阅读并同意<a class="open-link mdui-text-color-theme-accent" data="agreement.html">《学习空间用户条款》</a>、<a class="open-link mdui-text-color-theme-accent" data="privacystatement.html">《学习空间隐私条款》</a></label>',
                            history: false,
                            modal: true,
                            closeOnEsc: false,
                            buttons: [{
                                text: "同意并继续",
                                onClick: (inst) => {
                                    if ($("#agree-rules").is(":checked")) {
                                        localStorage.agree = (new Date()).getTime();
                                        uploadUsers(data);
                                        inst.close();
                                    } else {
                                        mdui.snackbar({
                                            message: "请先同意用户协议",
                                            buttonText: "确定"
                                        })
                                    }
                                },
                                close: false
                            }, {
                                text: "取消",
                                onClick: () => logout()
                            }]
                        })
                    } else {
                        uploadUsers(data);
                    }
                    if (data.data.schoolGuid !== "") {
                        /* 获取考试/未认领列表 */
                        getUnClaimExamCount();
                        getExamList($(".exam-item").length, 3);
                    } else {
                        mdui.snackbar({
                            message: "请先绑定学生信息",
                            buttonText: "前往绑定",
                            onClose: () => showPage("user", true, null),
                            onButtonClick: () => showPage("user", true, null),
                        });
                    }
                } else {
                    mdui.snackbar({
                        message: data.message,
                        buttonText: "确定",
                        onButtonClick: () => {
                            showPage("login", false, null);
                        },
                        onClose: () => showPage("login", false, null),
                    });
                    return false;
                }
            });
            //console.log("firstLoad_2_index", page_name);
            setBG();
            break;
        case "exam":
            loadAnyway(page_name);
            break;
        case "user":
            //console.log("firstLoad_3_user", page_name);
            setBG();
            setTimeout(setBG, 300);
            /* 以本地缓存设置用户信息 */
            let userInfo = getUserCache().data;
            if (userInfo) {
                /* 设置用户头像 */
                showUserInfo(getUserCache()); /* 设置所在区域 */ /* 设置学生信息 */
                $(".student-name").text(userInfo.studentName); /* 设置当前年级 */
                if (userInfo.cityCode) {
                    setStudentAreaInfo(userInfo);
                } else {
                    $(".student-name").parents(".mdui-list-item").click(() => {
                        if ($(".student-name").attr("set") === "false") {
                            mdui.prompt("姓名", "请输入姓名", (v) => {
                                if (v !== "") {
                                    $(".student-name").text(v);
                                } else {
                                    $(".student-name").text("点击设置");
                                }
                                enableSubmitButton();
                                $(".student-name").attr("change", "true");
                            }, undefined, {
                                confirmText: "确定",
                                cancelText: "取消"
                            })
                        }
                    });
                    $(".school-name").parents(".mdui-list-item").click(() => {
                        if ($(".school-name").attr("set") === "false") {
                            if ($(".city-area").attr("value") !== undefined && $(".city-area").attr("value") !== "") {
                                selectSchool();
                            } else {
                                mdui.snackbar({
                                    message: "请先设置地区",
                                    buttonText: "点击设置",
                                    onButtonClick: () => selectArea()
                                })
                            }
                        }
                    });
                    $(".grade").parents(".mdui-list-item").click(() => {
                        if ($(".grade").attr("set") === "false") {
                            selectGrade();
                        }
                    });
                    $(".city-area").text("点击设置");
                    $(".student-name").text("点击设置").attr("set", "false");
                    $(".school-name").text("点击设置").attr("set", "false");
                    $(".grade").text("点击设置").attr("set", "false")
                }
            }
            break;
        case "unclaim":
            getUnClaimExamList();
        case "about":
            /* $(".copyShareLink").click(function() {$('#shareUrl').select();$().focus();document.execCommand('copy');mdui.snackbar({message: "复制成功"});}); */
            $(".appVersion").text("v" + app_info.version).parents(".mdui-list-item").click(() => {
                mdui.dialog({
                    title: "更新日志",
                    content: app_info.details,
                    buttons: [{
                        text: "确定"
                    }],
                    history: false
                });
            });
            $.get("json/import.json", null, (data) => {
                data.reverse();
                for (let i = 0; i < data.length; i++) {
                    let model;
                    if (data[i].iconType === "img") {
                        model =
                            `<li class="mdui-card mdui-m-t-1 mdui-hoverable mdui-list-item open-link" data="${data[i].url}"><div class="mdui-list-item-avatar"><img src="${data[i].icon}"></div><div class="mdui-list-item-content"><div class="mdui-list-item-title">${data[i].name}&nbsp;&nbsp;<small class="mdui-typo-body-1-opacity">v${data[i].version}</small></div><div class="mdui-list-item-text mdui-list-item-one-line">${data[i].description}</div></div></li>`
                    } else {
                        model =
                            `<li class="mdui-card mdui-m-t-1 mdui-hoverable mdui-list-item open-link" data="${data[i].url}"><div class="mdui-list-item-avatar">${data[i].icon} ;</div><div class="mdui-list-item-content"><div class="mdui-list-item-title">${data[i].name}&nbsp;&nbsp;<small class="mdui-typo-body-1-opacity">v${data[i].version}</small></div><div class="mdui-list-item-text mdui-list-item-one-line">${data[i].description}</div></div></li>`
                    };
                    $(".import-list").after($(model));
                }
            }, "json");
            $.get("json/friend_link.json", null, (data) => {
                data.reverse();
                $.each(data, (_k, v) => {
                    $(".friend-link").after($(`<li class="mdui-card mdui-m-t-1 mdui-hoverable mdui-list-item open-link" data="${v.url}"> <i class="mdui-list-item-icon mdui-icon material-icons">link</i><div class="mdui-list-item-content"><div class="mdui-list-item-title">${v.title}</div><div class="mdui-list-item-text mdui-list-item-one-line">${v.description}</div></div></li>`));
                })
            }, "json")
            /* var nativeShare = new NativeShare() var shareData = { title: '学习空间', desc: '学习空间是一个完全免费的第三方七天学堂成绩查询工具。', link: 'https://stusp.milkpotatos.cn/?sourse=share', icon: 'https://stusp.milkpotatoes.cn/ic_launcher.png', // 不要过于依赖以下两个回调，很多浏览器是不支持的 success: function() { }, fail: function() { } } nativeShare.setShareData(shareData) */
            break;
        case "login":
            if (localStorage.agree !== undefined) {
                document.querySelector("#agree-rules-login").checked = true;
            }
            resetPage();
            break;
        default:
            if ($(".main-container." + page_name).hasClass("document")) {
                let data = JSON.parse($(".document").removeClass("loaded").attr("data"))[page_name];
                $(".main-container.document .main").empty();
                document.title = data.title;
                $(".simple-appbar .mdui-typo-title").text(data.title);
                $.get(data.data, function (data) {
                    var converter = new showdown.Converter();
                    $(".main-container.document .main").html(converter.makeHtml(data));
                    $(".main-container.document a[href]").each((_i, e) => {
                        e = $(e);
                        let anchor = e.attr("href").match(/^#(.+)/g);
                        if (anchor) {
                            e.addClass("doc-anchor").attr("href", "javascript:;").attr("data", anchor[0]);
                        }
                    });
                    mdui.mutation();
                });
            }
            break;
    }
}

function switchDisplay(e, hide) {
    e = $(e);
    if (hide) {
        if (e.hasClass("score-digtal-table")) {
            e.find("thead").addClass("mdui-hidden");
        }
        e.find("tbody tr").addClass("mdui-hidden").each((i, el) => {
            // //console.log(i <= 3 && e.hasClass("score-digtal-table"))
            if (i <= 3 && !e.hasClass("score-digtal-table")) {
                $(el).removeClass("mdui-hidden");
                return;
            }
        });
        e.find("span").text((() => {
            if (e.hasClass("score-digtal-table")) {
                return "查看各科成绩"
            } else {
                return "展开";
            }
        })());
        e.find("i").text("expand_more");
    } else {
        if (e.hasClass("score-digtal-table")) {
            e.find("thead").removeClass("mdui-hidden");
        }
        e.find("tbody tr").removeClass("mdui-hidden");
        e.find("span").text((() => {
            if (e.hasClass("score-digtal-table")) {
                return "隐藏各科成绩"
            } else {
                return "收起";
            }
        })());
        e.find("i").text("expand_less");
    }
}
/* 任意时候加载的事项 */
function loadAnyway(page_name) {
    //console.log("loadAnyway_1", page_name);
    switch (page_name) {
        case "index":
            let index_drawer = new mdui.Drawer("#drawer");
            if ($(".index").attr("drawer") === "open") {
                index_drawer.open();
                $(".index").removeAttr("drawer");
            }
            if ($(this).scrollTop() + $(this).height() >= $(document).height() && !$(".index .exam-item-pgs").hasClass("exam-end") &&
                $(".app-show").hasClass("index")) {
                getExamList($(".exam-item").length, 3);
            }
            //console.log("loadAnyway_1", page_name);
            setBG();
            break;
        case "exam":
            $(".exam .mdui-tab").addClass("mdui-hidden");
            $(".exam").removeClass("mdui-appbar-with-tab");
            $(".exam .exam-detail-pgs").removeClass("mdui-hidden");
            $(".exam .main .subject-card").remove();
            $(".exam .mdui-tab").empty();
            let jump_data, exam_data;
            if (history.state !== null) {
                jump_data = history.state.jumpData;
                exam_data = jump_data.examData;
            } else {
                mdui.snackbar({
                    message: "请选择考试后再查看",
                    buttonText: "返回首页",
                    onButtonClick: () => showPage("index", false, null),
                    onClose: () => showPage("index", false, null),
                    timeout: 3000
                });
                return 0;
            }
            let user_cache = getUserCache().data;
            $.ajax({
                method: "post",
                url: getUrl("score", "/Question/Subjects"),
                headers: {
                    Token: localStorage.Token,
                    Version: localStorage.szoneVersion,
                },
                data: {
                    examGuid: exam_data.examGuid,
                    studentCode: exam_data.studentCode,
                    schoolGuid: user_cache.schoolGuid,
                    grade: user_cache.grade === "" ? user_cache.currentGrade : user_cache.grade,
                    ruCode: exam_data.ruCode
                },
                dataType: "json",
                success: (data) => {
                    if (data.status != 200) {
                        mdui.snackbar({
                            message: data.message,
                            buttonText: "返回首页",
                            onClose: () => showPage("index", false, null),
                            onButtonClick: () => showPage("index", false, null)
                        });
                        return;
                    }
                    for (let i = 0; i < data.data.subjects.length; i++) {
                        let subject_data = data.data.subjects[i];
                        $(".exam .mdui-tab").append(`<a class="mdui-ripple" href="#subject-tab-${i}">${subject_data.km}</a>`);
                        $(".exam .main").append(
                            `<div class="mdui-container subject-card mdui-hidden" id="subject-tab-${i}"><div class="mdui-card-content mdui-shadow-1 mdui-color-theme-accent score-card"><div class="mdui-typo name"> 分数卡片 </div><span class="my-score mdui-typo">${subject_data.myScore}</span> <span class="scoreDivider mdui-typo">/</span> <span class="full-score mdui-typo">${subject_data.fullScore}</span></div></div>`
                        );
                        if (i > 0 && $(".score-digtal").length > 0) {
                            // //console.log(1234);
                            $(".score-digtal .expand-table").closest("tr").before($(`<tr class="mdui-hidden"> <td>${subject_data.km}</td> <td>${subject_data.myScore}</td> <td>${subject_data.fullScore}</td> </tr>`));
                        };
                        let object_tbody = "";
                        let unobject_tbody = "";
                        if (data.data.subjects[i].question !== undefined && data.data.subjects[i].question.THs !== undefined) {
                            $.each(data.data.subjects[i].question.THs, (_k, v) => {
                                if (v.objective) {
                                    object_tbody +=
                                        `<tr><td>${v.TH}</td><td>${v.Content}</td><td>${v.trueAnswer}</td><td>${v.Score}/${v.totalScore}</td></tr>`
                                } else {
                                    unobject_tbody +=
                                        `<tr><td>${v.TH}</td><td>${v.Score}/${v.totalScore}</td><td>${v.radar}</td><td>${v.avg}</td></tr>`
                                }
                            });
                        }
                        if (object_tbody !== "") {
                            object_tbody = $(`<div class="subject-question-table mdui-card mdui-typo mdui-m-t-2 subject-table-cards"><table class="subject-question mdui-table mdui-table-hoverable"><thead><tr><th colspan="5">客观题</th></tr><tr><th>题号</th><th>我的答案</th><th>参考答案</th><th>得分</th></tr></thead><tbody>${object_tbody}<tr class="mdui-hidden"><td colspan="4"><button class="mdui-btn expand-table"><i class="mdui-icon material-icons">expand_more</i><span>展开</span></button></td></tr></tbody></table></div>`);
                            switchDisplay(object_tbody, true);
                            object_tbody.appendTo(`#subject-tab-${i}`);
                        }
                        if (unobject_tbody !== "") {
                            unobject_tbody = $(`<div class="subject-question-table mdui-card mdui-typo mdui-m-t-2 subject-table-cards"><table class="subject-question mdui-table mdui-table-hoverable"><thead><tr><th colspan="5">主观题</th></tr><tr><th>题号</th><th>得分</th><th>与平均分差值</th><th>平均分</th></tr></thead><tbody>${unobject_tbody}<tr class="mdui-hidden"><td colspan="4"><button class="mdui-btn expand-table"><i class="mdui-icon material-icons">expand_more</i><span>展开</span></button></td></tr></tbody></table></div>`);
                            switchDisplay(unobject_tbody, true);
                            unobject_tbody.appendTo(`#subject-tab-${i}`);
                        }
                        $(".expand-table").parents("tr").removeClass("mdui-hidden");
                        let mylv = $(".exam .subject-grade-table tbody .mdui-color-theme-accent");
                        mylv.removeClass("mdui-hidden").next().removeClass("mdui-hidden").next().removeClass("mdui-hidden");
                        mylv.prev().removeClass("mdui-hidden").prev().removeClass("mdui-hidden");
                        mdui.mutation();
                        switch (subject_data.code) {
                            case 0:
                                let asiresponse = subject_data.question.asiresponse;
                                let src_subject = subject_data.srcKM;
                                getAnwserCard($.extend({
                                    i: i,
                                    asiresponse: asiresponse,
                                    srcSubject: src_subject,
                                    scoreStatus: data.data.scoreStatus,
                                    user_cache: user_cache
                                }, exam_data));
                                getSubjectRead($.extend({
                                    i: i,
                                    examType: data.data.examType,
                                    examSchoolGuid: data.data.schoolGuid,
                                    unitCode: data.data.unitCode,
                                    scoreStatus: data.scoreStatus,
                                    isUnion: data.data.isUnion,
                                    ruCode: exam_data.ruCode,
                                    examGuid: exam_data.examGuid,
                                    user_cache: user_cache,
                                    studentCode: exam_data.studentCode
                                }, subject_data))
                                getSubjectGrade($.extend({
                                    i: i,
                                    subject: subject_data.km,
                                    compareAvg: subject_data.compareClassAvg,
                                    user_cache: user_cache,
                                    examType: data.data.examType
                                }, exam_data));
                                break;
                            default:
                                getSubjectGrade($.extend({
                                    i: i,
                                    subject: subject_data.km,
                                    compareAvg: subject_data.compareClassAvg,
                                    user_cache: user_cache,
                                    examType: data.data.examType
                                }, exam_data));
                                if (subject_data.code == 2) {
                                    getSubjectRead($.extend({
                                        i: i,
                                        examType: data.data.examType,
                                        examSchoolGuid: data.data.schoolGuid,
                                        unitCode: data.data.unitCode,
                                        scoreStatus: data.scoreStatus,
                                        isUnion: data.data.isUnion,
                                        ruCode: exam_data.ruCode,
                                        examGuid: exam_data.examGuid,
                                        user_cache: user_cache,
                                        studentCode: exam_data.studentCode
                                    }, subject_data))
                                }
                        }
                    }
                    setTimeout(() => {
                        $(".exam .mdui-tab").removeClass("mdui-hidden");
                        $(".exam").addClass("mdui-appbar-with-tab");
                        let inst = new mdui.Tab(".mdui-tab");
                        inst.show(0);
                    }, 800);
                    setTimeout(() => {
                        $(".exam .subject-card").removeClass("mdui-hidden");
                        $(".exam .exam-detail-pgs").addClass("mdui-hidden");
                    }, 1500);
                }
            });
            history.replaceState(null, "成绩详情", "exam.html");
            break;
        case "user":
            //console.log("loadAnyway_1", page_name);
            setBG();
            setTimeout(setBG, 300);
            break;
        default:
    }
}
/* 窗口变动监听 */
window.onresize = () => {
    //console.log("window_resize_1");
    setBG();
};

window.onpopstate = () => {
    if (localStorage.Token === undefined) {
        showPage("login", false, null)
    } else {
        let page_name = current_page;
        page_name = page_name ? page_name : null;
        if (page_name !== "login" && page_name) {
            showPage(page_name, true, null);
        } else {
            showPage("index", false, null);
        }
    }
};

window.addEventListener("load", () => {
    if (localStorage.Token === undefined) {
        showPage("login", false, null)
    } else {
        let page_name = current_page;
        page_name = page_name ? page_name[0] : null;
        if (page_name !== "login" && page_name) {
            showPage(page_name, true, null);
        } else {
            showPage("index", false, null);
        }
    }
});
/* 滚动自动加载 */
$(window).on("scroll", () => {
    if ($(".app-show").hasClass("index")) {
        let scrollTop = $(this).scrollTop(); /* 滚动条距离顶部的高度 */
        let scrollHeight = $(document).height(); /* 当前页面的总高度 */
        let clientHeight = $(this).height(); /* 当前可视的页面高度 */
        if (scrollTop + clientHeight >= scrollHeight - 80 && !$(".index .exam-item-pgs").hasClass("exam-end")) {
            /* 距离顶部+当前高度 >= 文档总高度 即代表滑动到底部 注：-50 上拉加载更灵敏加载数据 */
            if (!$(".index .exam-item-pgs").hasClass("exam-loading") && $(".index .exam-item-pgs").hasClass("exam-more")) {
                if (getUserCache().data.schoolGuid) {
                    getExamList($(".exam-item").length, 3);
                } else {
                    mdui.snackbar({
                        message: "请先绑定学生信息",
                        buttonText: "前往绑定",
                        onClose: () => showPage("user", true, null),
                        onButtonClick: () => showPage("user", true, null),
                    });
                }
            }
        }
    }
    if ($(window).scrollTop() > 80) {
        $(".back-top").removeClass("mdui-hidden");
    } else {
        $(".back-top").addClass("mdui-hidden");
    }
});
/* 跳转事项 */
$(document).on("click", ".show-page", (e) => {
    showPage($(e.target).closest(".show-page").attr("data").match(/^(.*)(?=\.html$)/g)[0], true, null);
});
/* 文档页面滚动到锚点 */
$(document).on("click", ".doc-anchor", (e) => {
    window.scrollBy(0, document.querySelector($(e.target).attr("data")).getBoundingClientRect().y - document.querySelector(
        ".simple-appbar").getBoundingClientRect().height + 24);
});

/* 登录按钮点击事件 */
$(document).on("click", ".main-container.login #login-btn", () => {
    if ($("#login-btn").text = "登录成功") {
        showPage("index", false, null);
    }
    /* 验证手机号格式 */
    if ($("#userCode").val().match("^1+[0-9]{10,10}$") === null) {
        mdui.snackbar({
            message: "请输入正确的手机号"
        });
        return false;
    }
    if (!$("#agree-rules-login").is(":checked")) {
        localStorage.removeItem("agree");
        mdui.snackbar({
            message: "请先同意用户协议"
        })
        return false;
    }
    localStorage.agree = (new Date()).getTime();
    $("#login-btn").val("登录中...");
    if ($("#login-type").hasClass("login-sms")) {
        /* 验证密码是否为空 */
        if ($("#password").val().length === 0) {
            mdui.snackbar({
                message: "密码不能为空"
            });
        }
        $.ajax({
            method: "post",
            url: getUrl("my", "/login"),
            data: {
                userCode: $("#userCode").val(),
                password: Base64.encode($("#password").val())
            },
            headers: {
                Version: localStorage.getItem("szoneVersion")
            },
            dataType: "json",
            success: (data) => {
                if (data.status == 200) {
                    localStorage.setItem("Token", data.data.token);
                    getUserInfo((data) => {
                        if (data.status == 200) {
                            localStorage.setItem("userInfo", Base64.encode(JSON.stringify(data)));
                            mdui.snackbar({
                                message: "登录成功",
                                timeout: 500,
                                onClose: () => showPage("index", false, null)
                            });
                            $("#login-btn").val("登录成功");
                        }
                    });
                } else {
                    mdui.snackbar({
                        message: data.message
                    });
                    $("#login-btn").val("登录");
                }
            }
        });
    } else {
        /* 验证验证码格式 */
        if ($("#smsCode").val().match("^[0-9]{6,6}$") === null) {
            mdui.snackbar({
                message: "请输入正确的短信验证码"
            });
            return false;
        }
        $.ajax({
            method: "post",
            url: getUrl("my", "/login/entry"),
            data: {
                userCode: $("#userCode").val(),
                verifyCode: $("#smsCode").val(),
                token: $("#smsCode").attr("token")
            },
            headers: {
                Version: localStorage.getItem("szoneVersion")
            },
            dataType: "json",
            success: (data) => {
                if (data.status == 200) {
                    localStorage.setItem("Token", data.data.token);
                    getUserInfo((data) => {
                        if (data.status == 200) {
                            localStorage.setItem("userInfo", Base64.encode(JSON.stringify(data)));
                            mdui.snackbar({
                                message: "登录成功",
                                timeout: 500,
                                onClose: () => showPage("index", false, null)
                            });
                            $("#login-btn").val("登录成功");
                        }
                    });
                } else {
                    mdui.snackbar({
                        message: data.message
                    });
                    $("#login-btn").val("登录");
                }
            }
        });
    }
});

$(document).on("click", ".main-container.login #sendsms", () => {
    $.ajax({
        method: "post",
        url: getUrl("my", "/login/sendsms"),
        headers: {
            Version: localStorage.getItem("szoneVersion")
        },
        data: {
            userCode: Base64.encode($("#userCode").val())
        },
        dataType: "json",
        success: (data) => {
            if (data.status == 200) {
                mdui.snackbar({
                    message: "验证码发送成功"
                });
                $("#smsCode").attr("token", data.data.token).attr("tel", $("#userCode").val());
                $("#sendsms").attr("disabled", true);
                $("#userCode").attr("disabled", true).parent().addClass("mdui-textfield-disabled");
                countDown(61, (lefttime) => {
                    if (lefttime > 0) {
                        $("#sendsms").text('重新发送(' + lefttime + ')');
                        if ($("#userCode").val() != $("#smsCode").attr("tel")) {
                            $("#sendsms").text('获取验证码').removeAttr("disabled");
                        }
                    } else {
                        $("#sendsms").text('获取验证码').removeAttr("disabled");
                    }
                });
            } else {
                mdui.snackbar({
                    message: "请输入正确的手机号"
                });
            }
        }
    });
});

$(document).on("click", ".main-container.login #login-type", () => {
    $(".sms-widget").toggle();
    $(".password-widget").toggle();
    $("#login-type").toggleClass("login-sms").toggleClass("login-pwd");
    $("#userCode").parent().removeClass("mdui-textfield-disabled");
    if ($("#login-type").hasClass("login-sms")) {
        /* 切换为密码登录时执行的事件 */
        $("#login-type").text("验证码登录/注册");
        $("#userCode").attr("disabled", false);
    } else {
        /* 切换为验证码登录时执行的事件 */
        if ($("#userCode").val() == $("#smsCode").attr("tel")) {
            if ($("#sendsms").attr("disabled") == "disabled") {
                $("#userCode").attr("disabled", true).parent().addClass("mdui-textfield-disabled");
            }
        } else {
            $("#userCode").attr("disabled", false).parent().removeClass("mdui-textfield-disabled");
        }
        $("#login-type").text("密码登录");
    }
});
/* 成绩详情表格展开/收起 */
$(document).on("click", ".exam .expand-table", (e) => {
    e = $(e.target).closest("button");
    if (e.find("i").text() === "expand_more") {
        switchDisplay(e.closest("table"), false);
        /* .find("tr").removeClass("mdui-hidden");
            e.find("span").text("收起");
            e.find("i").text("expand_less"); */
    } else {
        e.closest("tbody").find("tr").addClass("mdui-hidden").last().removeClass("mdui-hidden");
        if (e.closest("table").hasClass("subject-grade-table")) {
            let mylv = e.closest("table").find(".mdui-color-theme-accent");
            mylv.removeClass("mdui-hidden");
            mylv.next().removeClass("mdui-hidden").next().removeClass("mdui-hidden");
            mylv.prev().removeClass("mdui-hidden").prev().removeClass("mdui-hidden");
        } else {
            /* e.closest("tbody").find("tr").each((i, e) => {
                if (i <= 3) {
                    $(e).removeClass("mdui-hidden");
                }
            }); */
            switchDisplay(e.closest("table"), true);
        }
        // e.find("span").text("展开");
        e.find("i").text("expand_more");
    }
    e.closest("tr").removeClass("mdui-hidden");
});
/* 认领考试 */
$(document).on("click", ".unclaim .exam-item", (e) => {
    click_item = $(e.target).closest(".exam-item");
    let exam_guid = $(e.target).closest(".exam-item").attr("value");
    let student_code_list = JSON.parse(Base64.decode($(e.target).closest(".exam-item").attr("data")));
    $(".examInfo").empty();
    let itemContent = "";
    for (let i = 0; i < student_code_list.length; i++) {
        $.ajax({
            method: "get",
            url: getUrl("score", "/exam/getImgUrlByStudentCode"),
            headers: {
                Token: localStorage.Token,
                Version: localStorage.szoneVersion
            },
            data: {
                examGuid: exam_guid,
                studentCode: student_code_list[i]
            },
            dataType: "json",
            success: (data) => {
                let img;
                if (data.status == 200) {
                    img = data.data.url;
                }
                let openClass;
                if (i === 0) {
                    openClass = " mdui-panel-item-open";
                } else {
                    openClass = "";
                }
                itemContent +=
                    `<!-- 待认领考试卡片 --><div class="mdui-panel-item${openClass}"><div class="mdui-panel-item-header">${student_code_list[i]}<i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i></div><div class="mdui-panel-item-body"><img class="mdui-img-rounded mdui-img-fluid paperImg" src="${img}"><div class="mdui-panel-item-actions"><button class="mdui-btn mdui-ripple claimExamBtn" onclick="claimExam('${student_code_list[i]}','${exam_guid}')"  mdui-panel-item-confirm>认领</button></div></div></div>`;
                claim_dialog = new mdui.dialog({
                    title: "认领考试",
                    content: `<span class="mdui-typo">请选择属于本人的考试认领</span><div class="mdui-panel examInfo" mdui-panel="{accordion: true}">${itemContent}</div>`,
                    onOpen: (inst) => {
                        $("img").load(() => {
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
            }
        });
    }
});
/* 打开考试详情页面 */
$(document).on("click", ".index .exam-item", (e) => {
    let exam_data = JSON.parse($(e.target).closest(".exam-item").attr("data"));
    let jump_id = (new Date()).getTime().toString();
    let jump_data = {
        id: jump_id,
        examData: exam_data,
    };
    showPage("exam", true, {
        jumpId: jump_id,
        jumpData: jump_data
    });
});
/* claimExamDialog.open(); */
/* 成绩详情页图片懒加载 */
$(document).on("change.mdui.tab", ".exam .mdui-tab", (event) => {
    $("#" + event.detail.id).find(".lz-load").each((_i, e) => {
        $(e).attr("src", $(e).attr("lz-src")).removeAttr("lz-src").addClass("lz-loaded").removeClass("lz-load").one(
            "load", () => {
                $(e).next().remove();
                new Viewer(e, {
                    toolbar: false,
                    navbar: false,
                    title: false
                });
            });
    });
});

$(document).on("click", ".open-link", (e) => {
    window.open($(e.target).closest(".open-link").attr("data"));
});

$(document).on("click", ".jump-link", (e) => {
    window.location.assign($(e.target).closest(".jump-link").attr("data"));
});
$(".back-top").addClass("mdui-hidden");
$(document).on("click", ".back-top", () => window.scrollTo(0, 0));
// (() => $("body").addClass("mdui-theme-primary-green mdui-theme-accent-red"))();
/* 百度统计代码 */
var _hmt = _hmt || [];
(function () {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?dd18823003a9883d07ac0b24b75f9d16";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();
/* 360统计代码 */
(function (b, a, e, h, f, c, g, s) {
    b[h] = b[h] || function () {
        (b[h].c = b[h].c || []).push(arguments);
    };
    b[h].s = !!c;
    g = a.getElementsByTagName(e)[0];
    s = a.createElement(e);
    s.src = "//s.union.360.cn/" + f + ".js";
    s.defer = !0;
    s.async = !0;
    g.parentNode.insertBefore(s, g);
})(window, document, "script", "_qha", 361707, false);