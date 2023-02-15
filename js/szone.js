import Dexie from "../modules/dexie/dexie.min.mjs"

export class Szone {
    #headers = {
        Version: "4.1.8",
    }

    #urlencodeform = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    #jsonform = {
        "Content-Type": "application/json"
    }

    #userinfo = {}
    #userguid
    #token
    #db
    #repeatloc = 0
    #latestexamguid

    SUBJECT_TYPE = {
        OVERVIEW_SUBJECT: -2,
        INDEPENDENT_SUBJECT: 0,
        UNENROLLED_SUBJECT: -1
    }

    constructor(uuid) {
        this.#db = new Dexie("student-space");
        this.initDatabase(this.#db);
        this.#userguid = uuid;
        if (uuid) this.#db.userinfo
            .get(uuid)
            .then(data => {
                if (data && data.userCode) this.#db.accounts.get({ userCode: data.userCode })
                    .then(res => this.setToken(res.token));
                else this.#userguid = undefined
            });

        console.log(this.#db)
    }

    initDatabase(db) {
        db.version(0.3).stores({
            accounts: "token, userCode",
            userinfo: "userGuid, *userCode",
            examlist: "[userGuid+examGuid]",
            unclaimlist: "[userGuid+examGuid]",
            examinfo: "[userGuid+examGuid]",
            answercard: "[userGuid+examGuid+asiresponse], *url",
            subjectgrade: "[userGuid+examGuid+subject]",
        });

        // db.accounts.primaryKeys().then()
    }

    setToken(token) {
        this.#userinfo = {}
        this.#token = token;
        this.#headers.Token = token;
        this._updateUserInfo()
    }

    getToken() {
        return this.#token;
    }

    _transToForm(data) {
        let f = []
        for (const k in data) {
            f.push(k + "=" + data[k])
        }
        return f.join("&")
    }

    getUrl(host, path) {
        switch (host) {
            case "my":
                return "https://szone-my.7net.cc" + path;
            case "old":
                return "https://szone-api.7net.cc" + path;
            case "score":
                return "https://szone-score.7net.cc" + path;
            default:
                return undefined;
        }
    }

    /**
     * 此方法用作向七天服务器请求数据
     * @param {"my"|"old"|"score"} host 参数my, old, score 分别对应szone-(my|api|score).7net.cc域名
     * @param {string} path API路径，需以/开始
     * @param {"POST"|"GET"} method 请求方法, 主要支持POST和GET两种方法, 默认值为 GET
     * @param {{any}} data 请求参数
     * @param {boolean} notoken 是否携带token
     * @returns {fetch}
     */
    async _privateFetch(host, path, method, data, notoken) {
        method = method ? method : "GET";
        let headers = {};
        Object.assign(headers, this.#headers);
        if (notoken) delete headers.Token

        if (method == "GET") {
            return fetch(this.getUrl(host, path) + (data ? "?" + this._transToForm(data) : ""), {
                method: method,
                headers: headers
            })
                .then(res => {
                    if (!res.ok) {
                        throw Error(res.statusText);
                    }
                    return res.json()
                })
                .catch(_err => {
                    alert("网络连接出错或七天网络服务器异常，请检查网络连接或刷新重试")
                })
        } else {
            return fetch(this.getUrl(host, path), {
                method: method,
                headers: Object.assign(this.#urlencodeform, headers),
                // body: JSON.stringify(data)
                body: this._transToForm(data)
            })
                .then(res => res.json())
                .catch(_err => {
                    alert("网络连接出错或七天网络服务器异常，请检查网络连接或刷新重试")
                })
        }

    }

    /**
     * 本方法用作向学习空间服务器发送指定请求，域名为当前页面域名
     * @param {string} path API路径
     * @param {"POST"|"GET"} method 请求方法，POST或GET
     * @param {object} data 请求参数
     * @returns {fetch} 返回fetch promise对象，数据已经过json格式化
     */
    async _stuspFetch(path, method, data) {
        method = method ? method : "GET";
        if (data) Object.assign(data, { "user_guid": this.#userguid })
        else data = { "user_guid": this.#userguid }
        console.log(data, this.#userguid)
        if (method == "GET") {
            return fetch(path + (data ? "?" + this._transToForm(data) : ""), {
                method: method
            })
                .then(res => {
                    if (!res.ok) {
                        throw Error(res.statusText);
                    }
                    return res.json()
                })
                .catch(_err => {
                    alert("网络连接出错或学习空间服务器异常，请检查网络连接或稍后重试")
                })
        } else {
            return fetch(path, {
                method: method,
                headers: this.#jsonform,
                // body: JSON.stringify(data)
                body: JSON.stringify(data)
            })
                .then(res => res.json())
                .catch(_err => {
                    alert("网络连接出错或学习空间服务器异常，请检查网络连接或稍后重试")
                })
        }
    }

    /**
     * base64图片转 blob
     * @param {base64} dataurl base64编码的资源
     * @returns {Blob} 返回Blob对象
     */
    _dataURLtoBlob(dataurl) {
        let arr = dataurl.split(',');
        let mime = arr[0].match(/:(.*?);/)[1];

        let bstr = atob(arr[1].replace(/\s/g, ''));
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {
            type: mime
        });
    }

    async _blobToBase64(blob) {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(blob);
        return new Promise((resolve, _reject) => fileReader.onload = e => {
            resolve(e.target.result);
        });
    }

    /**
     * 将阿里云OSS对象云存储文件进行同域名代理
     * @param {string} url 阿里云OSS对象云存储连接
     * @returns {string} 当前域名代理的原始文件链接
     */
    _replaceOSSUrl(url) {
        return "/apiv2/answercard/?" + url;
    }

    /**
     * 获取答题卡链接，并对资源进行存储缓存
     * @param {string} url 答题卡链接
     * @returns {Promise} 返回promise对象
     */
    async getAnswerCardUrl(url) {
        return new Promise((resolve, _reject) => {
            this.#db.answercard.get({ url: url })
                .then(res => {
                    res.data = res.data ? res.data : [];
                    let index = res.url.indexOf(url)
                    let bs64 = res.data[index]

                    if (bs64 && bs64 !== "cached") resolve(URL.createObjectURL(this._dataURLtoBlob(bs64)));
                    else fetch(this._replaceOSSUrl(url))
                        .then(imgres => {
                            // console.log(imgres)
                            if (imgres.status !== 200) throw (imgres.statusText)
                            return imgres.blob()
                        })
                        .then(blob => {
                            if (location == "stusp.milkpotatoes.cn") this._blobToBase64(blob)
                                .then(base64 => {
                                    res.data[index] = base64
                                    this.#db.answercard.put(res)
                                })
                            else {
                                res.data[index] = "cached"
                                this.#db.answercard.put(res)
                            }
                            resolve(URL.createObjectURL(blob))
                        })
                        .catch(_err => {
                            resolve(url);
                        });
                })
        })
    }

    /**
     * 更新Szone对象中的用户信息
     * @returns {promise}
     */
    async _updateUserInfo() {
        return this._privateFetch("my", "/userInfo/GetUserInfo")
            .then(data => {
                if (data.status == 200) {
                    this.#userinfo = data.data;
                    this.#userguid = data.data.userGuid;
                    this.#db.userinfo.put(data.data);
                    this.#db.accounts.put({ token: this.#token, userCode: data.data.userCode });
                    localStorage.CurrentUser = data.data.userGuid
                    return data.data;
                } else {
                    return data;
                }
            });
    }

    /**
     * updateUserInfo的公开代理方法
     * @returns {promise}
     */
    async updateUserInfo() {
        return this._updateUserInfo()
    }

    /**
     * 获取用户信息
     * @returns {promise}
     */
    async getUserInfo() {
        return new Promise((resolve, reject) => {
            if (this.#userguid && this.#token) resolve(this.#db.userinfo.get(this.#userguid))

            if (Object.keys(this.#userinfo).length > 0) resolve(this.#userinfo);
            else resolve(this.updateUserInfo());
        });
    }

    /**
     * 获取用户信息，此方法将被逐步弃用
     * @returns {{any}}
     */
    getUserCache() {
        if (this.#userinfo) {
            return this.#userinfo
        }
    }


    /**
     * privateFetch的公开代理方法, 为访问为预定义方法的接口提供入口
     * @param {"my"|"old"|"score"} host 参数my, old, score 分别对应szone-(my|api|score).7net.cc域名
     * @param {string} path API路径，需以/开始
     * @param {"POST"|"GET"} method 请求方法, 主要支持POST和GET两种方法, 默认值为 GET
     * @param {{any}} data 请求参数
     * @param {boolean} notoken 是否携带token
     * @returns {fetch}
     */
    async sendCustomRequest(host, path, method, data) {
        return this._privateFetch(host, path, method, data)
    }

    /**
     * 获取科目信息
     * @param {{any}} data 考试详情
     * @returns {fetch}
     */
    async getSubjectInfo(data) {
        return new Promise((resolve, _reject) => {
            this.#db.examinfo.get({ userGuid: this.#userguid, examGuid: data.examGuid })
                .then(res => {
                    if (res) resolve(res)
                    else resolve(this._privateFetch("score", "/Question/Subjects", "POST", data)
                        .then(json => {
                            this.#db.examinfo.put(Object.assign({ userGuid: this.#userguid, examGuid: data.examGuid, examType: data.examType }, json.data));
                            return json.data;
                        }));
                })
        })
    }

    /**
     * 登录到学习空间
     * @param {"smscode"|"password"} auth_type 
     * @param {{userCode: string, password: string}|{userCode: string, smsCode: string, token: string}} data 登录所需数据，包括userCode(手机号), [password(密码)|smsCode(验证码), token(请求短信时获取的token)]
     * @returns {fetch}
     */
    async loginToSzone(auth_type, data) {
        let path = auth_type == "smscode" ? "/login/entry" : "/login";
        return this._privateFetch("my", path, "POST", data, true)
            .then(json => {
                if (json.status == 200) {
                    this.setToken(json.data.token);
                    this.#db.accounts.where("userCode").equals(data.userCode).delete();
                    this.#db.accounts.put({ userCode: data.userCode, token: json.data.token });
                }
                return json;
            });
    }

    /**
     * 请求短信验证码
     * @param {{userCode: base64}} data 用户userCode信息，需进行base64编码
     * @returns {fetch}
     */
    async getSmsCode(data) {
        return this._privateFetch("my", "/login/sendsms", "POST", data)
    }

    /**
     * 获取未认领考试列表
     * @param {{any}} data 
     * @returns {fetch}
     */
    async getUnclaimAnswerCard(data) {
        return this._privateFetch("score", "/exam/getImgUrlByStudentCode", "GET", data)
    }

    /**
     * 获取未认领考试数目
     * @param {{any}} data 
     * @returns {fetch}
     */
    async getUnclaimExamCount(data) {
        return this._privateFetch("score", "/exam/getExamCount", "GET", data)
    }

    /**
     * 获取认领考试列表
     * @param {{any}} data 
     * @returns {fetch}
     */
    async getUnclaimExamData(data) {
        return this._privateFetch("score", "/exam/getUnClaimExams", "GET", data)
    }

    /**
     * 认领考试
     * @param {{any}} data 
     * @returns {fetch}
     */
    async claimExam(data) {
        return this._privateFetch("score", "/exam/claimExam", "POST", data)
    }

    /**
     * 获取考试详情
     * @param {{any}} data 
     * @returns {fetch}
     */
    async fetchExamData(data) {
        return this._privateFetch("score", "/exam/getClaimExams", "GET", data)
            .then(json => {
                for (let element of json.data.list) {
                    this.#db.examlist.put(Object.assign({ userGuid: this.#userguid }, element));
                    this.#latestexamguid = element.examGuid;
                }
                return json.status == 200 ? json.data.list : json;
            })
    }

    /**
     * 对考试列表按照时间顺训降序进行排序
     * @param {[{time: string, any}]} data 
     * @returns {[{any}]}
     */
    sortExamList(res) {
        res.sort((a, b) => (new Date(b.time)) - (new Date(a.time)));
        return res;
    }

    /**
     * 检查同时位于网络请求数据和缓存数据中的考试项目
     * @param {[{any}]} network
     * @param {[{any}]} cache
     * @returns {number}
     */
    checkContainExam(network, cache) {
        let incache = 0;
        if (cache) for (let element of network) {
            incache += element.examGuid == cache['examGuid'] ? 1 : 0;
        }
        return incache
    }


    /**
     * 从缓存中读取考试列表
     * @returns {promise}
     */
    async getExamCache() {
        return new Promise((resolve, _reject) => {
            this.#db.examlist.where("userGuid").equals(this.#userguid).toArray()
                .then(res => {
                    res.filter((e, i, arr) => {
                        return arr.findIndex((a) => a.examGuid == e.examGuid) == i
                    })
                    res = this.sortExamList(res);

                    resolve(res)
                })
        });
    }

    /**
     * 从网络请求考试列表
     * @param {{any}} data 
     * @returns {promise}
     */
    async getExamData(data) {
        return this.fetchExamData(data)
    }


    /**
     * 从缓存中读取考试等级详情，若不存在则从网络请求
     * @param {{any}} data 
     * @returns {promise}
     */
    async getSubjectGrade(data) {
        return new Promise((resolve, _reject) => {
            let keypath = {
                examGuid: data.examGuid,
                userGuid: this.#userguid,
                subject: data.subject
            }
            this.#db.subjectgrade.get(keypath)
                .then(res => {
                    if (res) resolve(res); else reject()
                })
                .catch(_err => {
                    resolve(this._privateFetch("score", "/Question/SubjectGrade", "POST", data)
                        .then(json => {
                            if (json.status == 200) {
                                this.#db.subjectgrade.put(Object.assign(json.data, keypath))
                                return json.data
                            }
                            return json
                        }))
                })
        });
    }


    /**
     * 废弃API, 获取考试评价信息
     * @param {{any}} data 
     * @returns {promise}
     */
    async getSubjectRead(data) {
        return this._privateFetch("score", "/Question/SubjectRead", "POST", data)
    }


    /**
     * 获取答题卡链接, 若存在缓存则从缓存中读取图片, 若缓存仅存在链接则根据链接过期与否返回缓存数据或从网络拉取
     * @param {{any}} data 
     * @returns {promise}
     */
    async getAnswerCard(data) {
        let keypath = {
            asiresponse: data.asiresponse,
            examGuid: data.examGuid,
            userGuid: this.#userguid
        }
        return new Promise((resolve, reject) => {
            this.#db.answercard.get(keypath)
                .then(res => {
                    let expired = false;
                    if (res) {
                        for (let url of res.url) {
                            expired = expired || new Date(new URL(url).search.match(/Expires=(.+?)(\&|$)/)[1] * 1000) <= new Date()
                        }
                        if (res.data || !expired) resolve(res?.url);
                        else reject();
                    }
                    else reject()
                })
        })
            .catch(() => {
                // console.log(err)
                return this._privateFetch("score", "/Question/AnswerCardUrl", "POST", data)
                    .then(json => {
                        if (json.status == 200) {
                            json = json.data
                            this.#db.answercard.put(Object.assign({ url: json }, keypath))
                            return json;
                        } else return json;
                    });
            })
    }


    /**
     * 获取学校列表
     * @param {{any}} data 
     * @returns {promise}
     */
    async getSchoolList(data) {
        return this._privateFetch("my", "/userInfo/getSchoolList", "GET", data)
    }


    /**
     * 学习空间API, 用以获取订阅信息
     * @returns {promise}
     */
    async getSubscribeInfo() {
        return new Promise(resolve => {
            if (location.href == "stusp.milkpotatoes.cn") resolve(this._stuspFetch("/api/get_sub_info", "POST"))
            else resolve({
                "data": {
                    "effective_time": (new Date()).getTime() / 1000,
                    "expire_time": (new Date()).getTime() / 1000 + 10000
                },
                "message": "success",
                "status": 200
            })
        })
    }

    /**
     * 学习空间API, 用以开启试用，时长为15天，每个账户仅可试用一次
     * @returns {promise}
     */
    async startTrial() {
        return this._stuspFetch("/api/start_trial", "POST")
    }

    /**
     * 学习空间API, 获取用户试用信息
     * @returns {promise}
     */
    async getTrialInfo() {
        return this._stuspFetch("/api/get_trial", "POST")
    }

    async isChecked(exam_guid) {
        let res = await this.#db.examinfo.where({
            examGuid: exam_guid,
            userGuid: this.#userguid
        }).toArray();
        return res.length > 0
    }

    /**
     * 学习空间API, 绑定爱发电订单
     * @param {string} order_id 爱发电订单号
     * @param {boolean} auto_band 自动绑定, 若为 true 则将在用户在爱发电完成下单时服务器自动续期
     * @returns {promise}
     */
    bandOrder(order_id, auto_band) {
        if (order_id) return this._stuspFetch("/api/band_order", "POST", { order_id: order_id, auto_band: auto_band })
    }

    logout() {
        this.#userguid = undefined;
        this.#token = undefined;
        this.#userinfo = {};
        this.#headers.Token = undefined;
    }
}

export default Szone;
