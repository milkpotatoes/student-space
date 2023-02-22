import Render from "./render.js";
import mPageSwitcher from "./pageswitcher.js";
import GradeRadar from "./graderadar.js";
import Viewer from "../modules/viewerjs/viewer.esm.js";
import Szone from "./szone.js";
import { Base64 } from "../modules/js-base64/base64.mjs";

export class PageLoader {
    #mSzone;
    #mPageSwitcher;
    #province_list;
    #grade_list;
    #exportRadarImg;
    #load_cache_list = false;

    /**
     * 
     * @param {Szone} mSzone 
     * @returns {PageLoader}
     */
    constructor(mSzone) {
        this.#mSzone = mSzone;
        this.#mPageSwitcher = new mPageSwitcher(this, mSzone);
        fetch("json/province.json")
            .then(res => res.json())
            .then(json => {
                this.#province_list = json;
            });
        fetch("json/grade.json")
            .then(res => res.json())
            .then(json => {
                this.#grade_list = json;
            });
        return this;
    }
    /**
     * 
     * @param {HTMLElement} tag 需要加载的标签
     */
    loadLazySrc(tag) {
        this.#mSzone.getAnswerCardUrl($(tag).attr("lz-src"))
            .then(url => {
                /* $(tag). */
                console.log(tag);
                $(tag).attr("src", url).removeAttr("lz-src").addClass("lz-loaded").removeClass("lz-load").one(
                    "load", () => {
                        $(tag).next().attr("href", url).removeClass("mdui-hidden").next().remove();
                        if (new URL(url.replace(/^blob:/, "")).host !== location.host) $(tag).next().removeAttr("download href");
                        new Viewer(tag, {
                            toolbar: false,
                            navbar: false,
                            title: false
                        });

                    });
            });
    }

    formatGrade(grade) {
        const letter = { A: 4, B: 3, C: 2, D: 1, E: 0, };
        grade = grade.split("");
        grade = letter[grade[0]] * 5 + 1 - grade[1] * 1;
        return grade;
    }

    formatGradeRowData(row_data) {
        let formatedData = {};
        for (let j = 0; j < 2; j++) {
            let start = j * 2;
            let end = row_data[0].length - 2;
            for (let k = start; k < end; k++) {
                formatedData[`tr${j}td${k}`] = row_data[1][k];
            };
        };
        return formatedData;
    }

    formatGradeData(grade_data, mygrade) {
        let countGrade = 0;
        let countClass = 0;
        let gradeRenderData = [];

        for (let l = 0; l < grade_data.length / 2; l++) {
            let i = l * 2;
            let myLevel = mygrade == grade_data[i][0] ? "mdui-color-theme-accent" : "";
            let cell = { myLevel: myLevel };
            let hasGrade = countGrade != grade_data[i][4];
            let hasClass = countClass != grade_data[i][5];
            cell["gradeStart"] = hasGrade ? countGrade + 1 : "";
            cell["classStart"] = hasClass ? countClass + 1 : "";
            countGrade = grade_data[i][4];
            countClass = grade_data[i][5];
            cell["gradeEnd"] = hasGrade ? countGrade : "";
            cell["classEnd"] = hasClass ? countClass : "";
            cell["rndSSH"] = (grade_data[i][3] * 1).toFixed(2);
            cell["rndSSL"] = (grade_data[i + 1][3] * 1).toFixed(2);
            let row_data = [];
            row_data.push(grade_data[i]);
            row_data.push(grade_data[i + 1]);
            Object.assign(cell, this.formatGradeRowData(row_data));
            gradeRenderData.push(cell);
        };

        return gradeRenderData;
    }

    logout() {
        this.#mSzone.logout();
        this.#mPageSwitcher.showPage("login", false);
        localStorage.removeItem("CurrentUser");
        localStorage.removeItem("Token");
    }

    contractGradeTable() {
        let tables = document.querySelectorAll("[page~=exam] .subject-grade-table");
        for (let table of tables) {
            let myLevel = -1;
            let count = 0;
            for (let row of table.children) {
                row.classList.add("mdui-hidden");
                myLevel = row.classList.contains("mdui-color-theme-accent") ? count : myLevel;
                count++;
            }
            if (myLevel >= 0) for (let i = Math.max(myLevel - 2, 0); i <= myLevel + 2; i++) {
                table.children[i].classList.remove("mdui-hidden");
            }
            table.firstElementChild.classList.remove("mdui-hidden");
            table.lastElementChild.classList.remove("mdui-hidden");
        }
    }
    getProvinceName(city_code) {

        let city_name = [];
        city_code = city_code.toString();
        if (this.#province_list) {
            let tmp;
            for (const item of this.#province_list) {
                if (city_code.match(/\d{2}/)[0] * 1 == item.supper) {
                    tmp = item;
                    break;
                }
            }
            /* let tmp = this.#province_list.index.indexOf(city_code.match(/\d{2}/)[0] * 1); */
            /* tmp = this.#province_list.data[tmp]; */
            city_name.push(tmp.province);
            if (tmp.list) {
                tmp = tmp.list.find(element => element.cityCode == city_code);
                city_name.push(tmp.cityName);
            }
            return city_name;
        }
    }

    getAnswerCard(args) {
        this.#mSzone.getAnswerCard({
            asiresponse: args.asiresponse,
            examGuid: args.examGuid,
            srcSubject: args.srcSubject,
            studentName: args.user_info.studentName,
            ruCode: args.ruCode,
            scoreStatus: args.scoreStatus,
            schoolGuid: args.user_info.schoolGuid
        })
            .then(data => {
                console.log(data);
                if ("status" in data) {
                    mdui.snackbar(`“${args.srcSubject}”答题卡获取失败`,);
                    return false;
                }
                let acRender = new Render("exam", "answer-card", "self", `#subject-tab-${args.i} [type=node][name=answerCard]`);
                let answerCardData = [];
                for (let j = 0; j < data.length; j++) {
                    answerCardData.push({
                        subjectOrder: args.i,
                        imgOrder: j,
                        imgSrc: data[j],
                        subjectName: args.srcSubject,
                        fileName: args.examName + "-" + args.srcSubject + "_" + args.ruCode + ".jpg"
                    });
                };
                acRender.renderList(answerCardData);
                if (args.i == 0) {
                    const answerCard = document.querySelectorAll(`#subject-tab-${args.i} .answer-card img`);
                    for (const element of answerCard) {
                        this.loadLazySrc(element);
                    };
                };

                mdui.mutation();

            });
    }

    band_user_events() {
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

    setStudentAreaInfo(user_info) {
        if (this.#province_list !== undefined && this.#grade_list !== undefined) {
            if (user_info.schoolGuid) {
                $(".school-name").text(user_info.schoolName).attr("value", user_info.schoolGuid);
                let ui_cn = this.getProvinceName(user_info.cityCode);
                /* console.log(ui_cn) */
                $(".city-area").text(ui_cn.join(" ")).attr("value", user_info.cityCode);
            };
            if (user_info.isGraduated) $(".grade").text("已毕业");
            else for (const element of this.#grade_list) {
                if (element.value == user_info.currentGrade.toUpperCase()) {
                    $(".grade").text(element.text).attr("value", user_info.currentGrade.toUpperCase());
                }
            };
        } else setTimeout(user_info => this.setStudentAreaInfo(user_info), 100, user_info);
    }

    setUserInfo() {
        /* 以本地缓存设置用户信息 */
        this.#mSzone.getUserInfo()
            .then(userInfo => {
                if (!userInfo["status"]) {
                    /* 设置用户头像 */
                    this.showUserInfo(userInfo); /* 设置所在区域 */ /* 设置学生信息 */
                    document.querySelector(".student-name").textContent = userInfo.studentName; /* 设置当前年级 */
                    if (userInfo.cityCode) this.setStudentAreaInfo(userInfo);

                };
            });
    }

    /**
     * 
     * @param {Object} args 
     * @param {GradeRadar} mGradeRadar 
     */
    getSubjectGrade(args, mGradeRadar, subject_type) {
        console.log("%cSubject Grade of %s will execute", "background:#448aff;", args.subject);

        /* new Promise((resolve, _reject) => { */

        /* }) */

        this.#mSzone.getSubjectGrade({
            compareClassAvg: args.compareAvg,
            examGuid: args.examGuid,
            examSchoolGuid: args.schoolGuid,
            ruCode: args.ruCode,
            schoolGuid: args.user_info.schoolGuid,
            studentCode: args.studentCode,
            studentName: args.user_info.studentName,
            subject: args.subject,
            grade: args.grade === "" ? args.user_info.grade : args.grade,
            examType: args.examType,
            /* vip: args.user_info.isVip ? 1 : 0 */
        })
            .then(data => {
                if ("status" in data) return false;
                let dtRender = new Render("exam", "exam-total", "self", `#subject-tab-${args.i} [type=node][name=examTotal]`);

                dtRender.renderToPage({ examTotal: data.report.total });

                /* if (pkMsg == "" && readMsg == "")  */
                document.querySelectorAll(".msg-card").forEach(e => e.classList.add("mdui-hidden"));
                /* this.#subject_grade_arr.push */

                let other_subject = data.report.otherKM;
                if (other_subject.length > 0) {
                    let grades = [];

                    let score_summary_table = document.querySelectorAll(".score-summary-table>div:first-child~div>div:first-child");
                    other_subject.forEach(e => {
                        grades.push({
                            name: e.km,
                            grade: e.grade,
                            value: this.formatGrade(e.grade)
                        });
                    });
                    score_summary_table.forEach(e => {
                        e.parentNode.setAttribute("great", other_subject.find(s => {
                            return s.km == e.textContent
                        }).rating == "优");
                    });
                    console.log(mGradeRadar, grades);
                    mGradeRadar.setGrades(grades);
                };
                /* console.log(args.subject, data.report.grade, this.formatGrade(data.report.grade)); */
                let gradeRenderData = this.formatGradeData(data.report.grades, data.report.grade);
                let rowRender = new Render("exam", "grade-tr", "self", `#subject-tab-${args.i} .subject-grade-table [type=node][name=gradeTbody]`);

                let exbRender = new Render("exam", "expand-button");
                let gtRender = new Render("exam", "grade-table", "self", `#subject-tab-${args.i} [type=node][name=gradeTable]`);
                /* console.log(rowRender.renderListText(gradeRenderData)) */
                gtRender.renderToPage({ expandButton: exbRender.renderToText() });

                rowRender.setTarget(`#subject-tab-${args.i} [type=node][name=gradeTbody]`)
                    /* .setVirtualContainer("tbody") */
                    .renderList(gradeRenderData);
                if (gradeRenderData.length == 0) $("#subject-tab-" + args.i + " .subject-grade-table").addClass("mdui-hidden");
                mdui.mutation();

                /* console.log("%c------execute success------", "background: #6cf;") */

                this.contractGradeTable();

            });
    }

    /* 获取考试列表 */
    async _getExamList(user_cache, start, rows) {
        let exam_item_render = new Render("home", "exam-item");
        if (!this.#load_cache_list) this.#mSzone.getExamCache()
            .then(data => {
                exam_item_render
                    .setDirection("append")
                    .setTarget("#examList");
                /* console.log(data) */
                data.forEach((exam_data, i) => {
                    let item_target = exam_item_render.renderToPage(
                        {
                            examData: Base64.encode(JSON.stringify(exam_data)),
                            examGuid: exam_data.examGuid,
                            examType: exam_data.type,
                            examName: exam_data.examName,
                            examTime: exam_data.time.replace(/\-/g, "/"),
                            examScore: exam_data.score,
                        })[0];
                    item_target.style.order = i - 1000;

                    this.#mSzone.isChecked(exam_data.examGuid)
                        .then(checked => { if (!checked) item_target.classList.add("exam-new") });
                });
                /* console.log(renderData) */
                this.#load_cache_list = true;
                $("[page~=home] .exam-item-pgs").removeClass("exam-loading");
                $("[page~=home] .exam-item-pgs").addClass("mdui-hidden");
                setTimeout((start, rows) => this.getExamList(start, rows), 1000, start, rows);
            });
        else this.#mSzone.getExamData({
            studentName: user_cache.studentName,
            schoolGuid: user_cache.schoolGuid,
            startIndex: start,
            grade: user_cache.grade === "" ? user_cache.currentGrade : user_cache.grade,
            rows: rows
        })
            .then(data => {
                if ("message" in data) {
                    mdui.snackbar({
                        message: data.message,
                        buttonText: "确定",
                        onButtonClick: function () { this.#mPageSwitcher.showPage("login", false, null) },
                        onClose: function () { this.#mPageSwitcher.showPage("login", false, null) }
                    });
                    return false;
                };

                data.forEach((element, i) => {
                    let exam_data = element;
                    let renderData = {
                        examData: Base64.encode(JSON.stringify(exam_data)),
                        examGuid: exam_data.examGuid,
                        examType: exam_data.type,
                        examName: exam_data.examName,
                        examTime: exam_data.time.replace(/\-/g, "/"),
                        examScore: exam_data.score
                    };
                    let direction = "self";
                    let old_item = document.querySelector(`[exam-guid="${exam_data.examGuid}"]`);

                    if (!old_item) {
                        old_item = "#examList";
                        direction = "append";
                    };

                    setTimeout((direction, old_item, renderData, start, i) => {
                        let item_target = exam_item_render
                            .setDirection(direction)
                            .setTarget(old_item)
                            .renderToPage(renderData)[0];
                        item_target.style.order = start + i - 1000;
                        this.#mSzone.isChecked(exam_data.examGuid)
                            .then(checked => { if (!checked) item_target.classList.add("exam-new") });
                        if (direction == "append") item_target.classList.add("exam-insert");

                        setTimeout(item_target => item_target.classList.remove("exam-insert"), 1000, item_target);
                    }, i * 150, direction, old_item, renderData, start, i);
                });

                if (data.length < rows) $("[page~=home] .exam-item-pgs").addClass("exam-end");
                else $("[page~=home] .exam-item-pgs").addClass("exam-more");

                if (!$("[page~=home] .exam-item-pgs").hasClass("exam-end")) setTimeout(() => this.getExamList(start + rows, rows), rows * 100);

            });
    }

    getExamList(start, rows) {
        if ($("[page~=home] .exam-item-pgs").hasClass("exam-end")) {
            return false;
        };

        this.#mSzone.getUserInfo()
            .then(user_cache => this._getExamList(user_cache, start, rows));
    }



    /* 获取未认领考试列表 */
    _getUnclaimExamList(user_cache) {
        this.#mSzone.getUnclaimExamData({
            studentName: user_cache.studentName,
            schoolGuid: user_cache.schoolGuid
        })
            .then(data => {
                if (data.status != 200) {
                    mdui.snackbar({
                        message: data.message,
                        buttonText: "确定",
                        onButtonClick: function () { mPageSwitcher.showPage("login", false, null); },
                        onClose: function () { mPageSwitcher.showPage("login", false, null); }
                    });
                    return false;
                }

                setTimeout(() => {
                    let upcl = document.querySelector("[page~=unclaim] .exam-item-pgs").classList;
                    let nce = document.querySelector("[page~=unclaim] .no-unclaim-exam");
                    let ncecl = nce.classList;

                    if (data.data.length <= 0) {
                        ncecl.remove("mdui-hidden");
                        upcl.remove("exam-loading");
                        upcl.addClass("exam-end", "mdui-hidden");
                        return true;
                    };
                    let unclaimRender = new Render();
                    unclaimRender
                        .setTemplate("unclaim", "sub-header")
                        .setTarget("#unClaimExamList")
                        .setDirection("append");
                    let listRender = new Render();
                    listRender
                        .setTemplate("unclaim", "exam-item")
                        .setTarget("#unClaimExamList")
                        .setDirection("append");
                    for (const unclaim_data of data.data) {
                        unclaimRender.renderToPage({ examMonth: unclaim_data.month });

                        let list = [];
                        for (const exam_data of unclaim_data.list) list.push({
                            examGuid: exam_data.examGuid,
                            studentCodeList: Base64.encode(JSON.stringify(exam_data.studentCodeList)),
                            examName: exam_data.examName,
                            examTime: exam_data.time
                        });

                        listRender.renderList(list);

                    };

                    upcl.remove("exam-loading", "exam-more");
                    upcl.add("exam-end", "mdui-hidden");
                    nce.textContent = "已加载所有未认领考试";
                    ncecl.remove("mdui-hidden");
                }, 1500);
            });
    }

    getUnclaimExamList() {
        $("[page~=unclaim] .exam-item-pgs").addClass("exam-loading").removeClass("exam-more").removeClass("mdui-hidden");
        this.#mSzone.getUserInfo()
            .then(user_cache => this._getUnclaimExamList(user_cache))
    }

    /* 请求用户同意隐私协议 */
    require_agreement(data) {
        let dRender = new Render("dialog", "user-agree");
        mdui.dialog({
            title: "用户协议",
            content: dRender.getTemplate(),
            history: false,
            modal: true,
            closeOnEsc: false,
            buttons: [
                {
                    text: "取消",
                    onClick: () => logout()
                },
                {
                    text: "同意并继续",
                    bold: true,
                    onClick: (dialog) => {
                        if (dialog.$element.find(".agree-rules").is(":checked")) {
                            localStorage.agree = (new Date()).getTime();
                            dialog.close();
                        } else {
                            mdui.snackbar({
                                message: "请先同意用户协议",
                                buttonText: "确定"
                            })
                        }
                    },
                    close: false
                },
            ]
        })
    }

    /* 获取未认领考试数目 */
    getUnClaimExamCount() {
        this.#mSzone.getUserInfo()
            .then(user_cache => {
                this.#mSzone.getUnclaimExamCount({
                    studentName: user_cache.studentName,
                    schoolGuid: user_cache.schoolGuid
                })
                    .then(data => {
                        if (data.status != 200) {
                            mdui.snackbar({
                                message: data.message,
                                buttonText: "确定",
                                onButtonClick: () => this.#mPageSwitcher.showPage("login", false, null),
                                onClose: () => this.#mPageSwitcher.showPage("login", false, null),
                            });
                            return false;
                        }
                        if (data.data.unClaimCount > 0) {
                            let unClaimCount = data.data.unClaimCount;
                            mdui.snackbar({
                                message: `你当前有${unClaimCount}场考试待认领`,
                                buttonText: "查看",
                                onButtonClick: () => this.#mPageSwitcher.showPage("unclaim", true, null),
                            });
                            $(".notifications-icon").text("notifications");
                        }
                    });
            });
    }


    showUserInfo(data) {
        $(".userAvatar").attr("src", (data.auditAvarUrl === "") ? "src/ic_launcher.png" : data.avatarUrl);
        $(".nick-name").text(data.nickName);
        $(".userCode").text(data.userCode.replace(/(\d{3})\d+(\d{4})/, '$1****$2'));
    }

    setBG() {
        let bg = document.querySelector(".background-card").getBoundingClientRect();
        let it = document.querySelector(".userBasicInfo.mdui-center").getBoundingClientRect();
        $(".background-card").css("background-position",
            `0px ${0 - (bg.width * 1155 / 2048 + it.height - bg.height)}px`);
    }

    async firstLoadHome() {

        document.querySelector(".navigator-container footer>.mdui-bottom-nav-active").classList.remove("mdui-bottom-nav-active");

        document.querySelector(".navigator-container footer>a:nth-child(1)").classList.add("mdui-bottom-nav-active");
        await this.#mSzone.tokenSet()
        this.#mSzone.getUserInfo()
            .then((data) => {
                if ("message" in data) {
                    mdui.snackbar({
                        message: data.message,
                        buttonText: "确定",
                        onButtonClick: () => {
                            this.#mPageSwitcher.showPage("login", false, null);
                        },
                        onClose: () => this.#mPageSwitcher.showPage("login", false, null),
                    });
                    return false;
                }
                /* 设置用户头像 */
                this.showUserInfo(data);
                if (localStorage.agree === undefined) this.require_agreement(data);
                /* 获取考试/未认领列表 */
                if (data.schoolGuid !== "") this.getUnClaimExamCount();
                else mdui.snackbar({
                    message: "请先绑定学生信息",
                    buttonText: "前往绑定",
                    onClose: () => this.#mPageSwitcher.showPage("user", true, null),
                    onButtonClick: () => this.#mPageSwitcher.showPage("user", true, null),
                });


            });
        this.setBG();
    }

    loadDocumentPage(page_name) {
        if ($(`[page~=${page_name}`).hasClass("document")) {
            let data = JSON.parse($(".document").removeClass("loaded").attr("data"))[page_name];
            $(".main-container.document .main").empty();
            document.title = data.title;
            $(".simple-appbar .mdui-typo-title").text(data.title);
            fetch(data.data)
                .then(res => res.text())
                .then(text => {
                    const converter = new showdown.Converter();
                    $(".main-container.document .main").html(converter.makeHtml(text));
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
    }

    loadSubjectDetail(subject_data, user_info, data, exam_data, order, mGradeRadar) {
        let cardParams = {};
        let gradeParams = {};

        if (subject_data.code == 0) cardParams = Object.assign({
            i: order,
            asiresponse: subject_data.question.asiresponse,
            srcSubject: subject_data.srcKM,
            scoreStatus: data.scoreStatus,
            user_info: user_info
        }, exam_data);

        if (subject_data.code != -1)
            gradeParams = Object.assign({
                i: order,
                subject: subject_data.km,
                compareAvg: subject_data.compareClassAvg,
                user_info: user_info,
                examType: data.examType
            }, exam_data);

        /* console.log() */
        switch (subject_data.code) {
            case this.#mSzone.SUBJECT_TYPE.INDEPENDENT_SUBJECT:
                /* console.log("SUBJECT_TYPE.INDEPENDENT_SUBJECT"); */
                this.getAnswerCard(cardParams);
                if (order == 0) this.getSubjectGrade(gradeParams, mGradeRadar, subject_data.code);
                break;
            case this.#mSzone.SUBJECT_TYPE.OVERVIEW_SUBJECT:
                this.getSubjectGrade(gradeParams, mGradeRadar, subject_data.code);
                break;
            default:
                break;
        };

        if (subject_data.code != this.#mSzone.SUBJECT_TYPE.OVERVIEW_SUBJECT) {
            let o = $("[page~=exam]>.main>#subject-tab-" + order + " .objective-table");
            let u = $("[page~=exam]>.main>#subject-tab-" + order + " .subjective-table");
            this.#mPageSwitcher.switchDisplay(o, true);
            this.#mPageSwitcher.switchDisplay(u, true);
            if (o.children().length < 5) o.children().last().addClass("mdui-hidden");
            if (u.children().length < 5) u.children().last().addClass("mdui-hidden");
            if (o.children().length == 1) o.parent().remove();
            if (u.children().length == 1) u.parent().remove();
            this.expandQuestionTable();
        };
    }

    expandQuestionTable() {
        let tables = document.querySelectorAll("[page~=exam] .subject-question");
        for (let table of tables) {
            let count = 0;
            for (let row of table.children) {
                if (count > 4) {
                    row.classList.add("mdui-hidden");
                    row.classList.add("test");
                } else {
                    row.classList.remove("mdui-hidden");
                    row.classList.add("remove-test");

                }
                count++;
            }
            table.lastElementChild.classList.remove("mdui-hidden");
        }
    }

    /**
     * 
     * @param {object} subject_data 
     * @param {object} user_info 
     * @param {object} data 
     * @param {object} exam_data 
     * @param {number} order 
     * @param {boolean} isUnion 
     * @param {GradeRadar} mGradeRadar 
     * @returns 
     */

    loadSubjectPage(subject_data, user_info, data, exam_data, order, isUnion, mGradeRadar) {
        let tabRender = new Render("exam", "exam-tab", "append", "[page~=exam] .mdui-tab");
        let pageRender = new Render(undefined, undefined, "append", "[page~=exam] .main");
        let scRender = new Render("exam", "score-card");
        let exbRender = new Render("exam", "expand-button");
        let tRender, smRender;

        /* console.log(subject_data) */
        if (subject_data.code == this.#mSzone.SUBJECT_TYPE.UNENROLLED_SUBJECT) return;

        console.log("%c this exam has been executed ", 'background: #35f;line-height:24px');
        tabRender.renderToPage({ subjectName: subject_data.km, subjectOrder: order });
        pageRender.setTemplate("exam", subject_data.code == this.#mSzone.SUBJECT_TYPE.OVERVIEW_SUBJECT ? "exam-summary-page" : "exam-subject-page")
            .renderToPage({
                scoreCard: scRender.renderToText({ myScore: subject_data.myScore, unionRank: subject_data.us, schoolRank: subject_data.ss, classRank: subject_data.cs }),
                isUnion: isUnion,
                fullScore: subject_data.fullScore,
                subjectOrder: order,
                expandButton: exbRender.renderToText()
            });
        if (subject_data.code != this.#mSzone.SUBJECT_TYPE.OVERVIEW_SUBJECT) {
            tRender = new Render("exam", "_4columnTr", "self");
            smRender = new Render("exam", "summary-score-item", "append");
        };
        /* console.log($(".score-summary")); */
        /* print(pageRender) */
        /* console.log("try to append summary item") */
        if (order > 0 && document.querySelector(".score-summary-table")) smRender.setTarget(".score-summary-table")
            /* .setVirtualContainer("tbody") */
            .renderToPage({
                subjectName: subject_data.km,
                subjectScore: subject_data.myScore,
                fullScore: subject_data.fullScore,
                unionRank: subject_data.us,
                schoolRank: subject_data.ss,
                classRank: subject_data.cs
            });


        let otData = [];
        let stData = [];
        if (subject_data.question !== undefined && subject_data.question.THs !== undefined) for (let subj of subject_data.question.THs) {
            /* console.log(subj) */
            if (subj.objective) otData.push({
                td1: subj.TH,
                td2: subj.Content,
                td3: subj.trueAnswer,
                td4: subj.Score + "/" + subj.totalScore
            });
            else stData.push({
                td1: subj.TH,
                td2: subj.Score + "/" + subj.totalScore,
                td3: subj.radar.toFixed(2),
                td4: subj.avg
            });
        }

        /* tRender.setVirtualContainer("tbody") */
        if (otData.length > 0) tRender
            .setTarget(`#subject-tab-${order} [type=node][name=objectiveTbody]`)
            .renderList(otData);

        if (stData.length > 0) tRender
            .setTarget(`#subject-tab-${order} [type=node][name=subjectiveTbody]`)
            .renderList(stData);

        this.loadSubjectDetail(subject_data, user_info, data, exam_data, order, mGradeRadar);

    }

    /**
     * 
     * @param {object} subjects 
     * @param {object} data 
     * @param {object} exam_data 
     * @param {GradeRadar} mGradeRadar 
     */
    loadSubExamPage(subjects, data, exam_data, mGradeRadar) {
        this.#mSzone.getUserInfo()
            .then(user_info => {
                let order = 0;
                for (let subject_data of subjects) {
                    this.loadSubjectPage(subject_data, user_info, data, exam_data, order++, data.isUnion, mGradeRadar)
                }
                console.log(subjects)
            })
    }

    resetExamPage() {
        document.querySelectorAll("[page=exam] img").forEach(e => URL.revokeObjectURL(e.src));
        document.querySelectorAll("[page~=exam] .mdui-tab").forEach(e => e.classList.add("mdui-hidden"));
        document.querySelectorAll("[page~=exam]").forEach(e => e.classList.remove("mdui-appbar-with-tab"));
        document.querySelectorAll("[page~=exam] .exam-detail-pgs").forEach(e => e.classList.remove("mdui-hidden"));
        document.querySelectorAll("[page~=exam] .main .subject-card").forEach(e => e.remove("mdui-hidden"));
        document.querySelector("[page~=exam] .mdui-tab").innerHTML = "";
    }

    loadExamPage() {
        this.resetExamPage();
        let jump_data, exam_data;
        if (history.state !== null) {
            jump_data = history.state.jumpData;
            exam_data = jump_data.examData;
            document.querySelector(`[page="home"] .exam-item[exam-guid="${exam_data.examGuid}"]`).classList.remove("exam-new");
        } else {
            /* mdui.snackbar({ */
            /*     message: "请选择考试后再查看", */
            /*     buttonText: "返回首页", */
            /*     onButtonClick: () => this.#mPageSwitcher.showPage("home", false, null), */
            /*     onClose: () => this.#mPageSwitcher.showPage("home", false, null), */
            /*     timeout: 3000 */
            /* }); */
            setTimeout(() => {
                location.href = "/#/home";
            }, 1000);
            return 0;
        };
        let user_cache = this.#mSzone.getUserCache();
        /* .then(data => data); */
        /* 请求考试详情 */
        this.#mSzone.getSubjectInfo({
            examType: exam_data.examType,
            examGuid: exam_data.examGuid,
            studentCode: exam_data.studentCode,
            schoolGuid: user_cache.schoolGuid,
            grade: user_cache.grade === "" ? user_cache.currentGrade : user_cache.grade,
            ruCode: exam_data.ruCode
        })
            /* success: */
            .then(data => {
                let mGradeRadar = new GradeRadar()
                    .setExamName(exam_data.examName)
                    .setGradeTotal(data.subjects.length - 1);
                data.subjects.forEach(e => {
                    if (e.myScore == 0 && e.question) e.myScore = e.question.THs.reduce((a, b) => {
                        let getScore = e => e.Content !== undefined ? e.Score : 0;
                        a = typeof (a) == "object" ? getScore(a) : a;
                        return a + getScore(b);
                    });
                    if (data.subjects[0].myScore == 0) data.subjects[0].myScore += e.myScore;
                });

                this.loadSubExamPage(data.subjects, data, exam_data, mGradeRadar);
                setTimeout(() => {
                    $("[page~=exam] .mdui-tab").removeClass("mdui-hidden");
                    $("[page~=exam]").addClass("mdui-appbar-with-tab");
                    let inst = new mdui.Tab(".mdui-tab");
                    inst.show(0);
                    document.querySelector(".subject-card:nth-child(2)").style.display = "";
                }, 500);

                setTimeout((examName, ruCode) => {
                    $("[page~=exam] .subject-card").removeClass("mdui-hidden");
                    $("[page~=exam] .exam-detail-pgs").addClass("mdui-hidden");
                    if (document.querySelector(".subject-analysis>canvas")) {
                        mGradeRadar.setCanvas(".subject-analysis>canvas").autoDraw(true);

                        /* .setExportName(examGuid + "_" + ruCode + ".jpg") */

                        this.#exportRadarImg = () => {
                            mGradeRadar.exportRadarImg(examName + "_" + ruCode + ".png");
                            document.querySelector(".subject-analysis>.download-radar").removeEventListener("click", this.#exportRadarImg);
                        };

                        document.querySelector(".subject-analysis>.download-radar").addEventListener("click", this.#exportRadarImg);
                    };
                }, 800, exam_data.examName, exam_data.ruCode);
                /* console.log(exam_data) */
                /* } */
            });
        /* history.replaceState(null, "成绩详情", "#/exam"); */

    }
    loadSettings() {
        let settings_config = localStorage.stusp_settings_config;
        settings_config = settings_config ? JSON.parse(settings_config) : { "dark-mode-follow-system": false, "dark-mode-status": false, "eruda-status": false, "debug-over-usb": false };
        if (!window.stusp) document.querySelector("#debug-over-usb").closest("li").classList.add("mdui-hidden");
        else settings_config["debug-over-usb"] = stusp.getDebugStatus();

        for (let id in settings_config) {
            let i = document.querySelector(`#${id}`);
            i.checked = settings_config[id];
            i.closest("li").setAttribute("data", settings_config[id]);
        };

    }
}

export default PageLoader;
