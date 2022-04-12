function countDown(lefttime, callback) { /* console.log(`${lefttime} 秒`);if (lefttime <= 0) {document.querySelector(".count").innerHTML = "活动已结束";return;} */
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
		type: "get",
		url: getUrl("my", "/userInfo/GetUserInfo"),
		headers: {
			Version: localStorage.getItem("szoneVersion"),
			Token: localStorage.getItem("Token")
		},
		success: (data, status) => callback(data, status)
	});
}

function logout() {
	mdui.snackbar({
		message: "退出登录",
		buttonText: "确定",
		onButtonClick: (inst) => {
			localStorage.removeItem("Token");
			localStorage.removeItem("userInfo");
			window.location.replace("/login.html");
			window.location.reload();
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

function getCityName(cityCode) {}

function getQueryString(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg); /* search,查询？后面的参数，并匹配正则 */
	if (r !== null) return decodeURI(r[2]);
	return null;
}
if (window.location.href.match(/(\/index\.html)/) && window.location.href.match(/(\/exam\.html)/) && window.location.href
	.match(/(\/user\.html)/) && !localStorage.getItem("Token")) {
	mdui.snackbar({
		message: "请登录后再试",
		buttonText: "确定",
		onButtonClick: () => window.location.replace("/login.html"),
		onClose: () => window.location.replace("/login.html")
	})
}
