localStorage.setItem("szoneVersion", "3.0.6");

function clear_exam_info() {
	sessionStorage.removeItem('jumpId');
	sessionStorage.removeItem('jumpData');
};
$(document).on("click", ".open-link", (e) => {
	window.open($(e.target).closest(".open-link").attr("data"));
});
$(document).on("click", ".jump-link", (e) => {
	window.location.assign($(e.target).closest(".jump-link").attr("data"));
});
$(".back-top").addClass("mdui-hidden");

$(document).on("click", ".back-top", (e) => $(window).scrollTop(0));
$(() => {
	if (window.location.href.match(/(\/user\.html)/) && window.location.href.match(/(\/index\.html)/) && window.location
		.href.match(/(\/exam\.html)/) && !localStorage.getItem("Token")) {
		mdui.snackbar({
			message: "请登录后重试",
			buttonText: "确定",
			onButtonClick: () => {
				window.location.replace("/login.html");
				localStorage.removeItem("userInfo");
				localStorage.removeItem("Token");
			},
			onClose: () => {
				window.location.replace("/login.html");
				localStorage.removeItem("userInfo");
				localStorage.removeItem("Token");
			}
		});
	};
	if (window.location.href.match(/(\/exam\.html)/) && sessionStorage.jumpId - 0 < (new Date()).getTime().toString() -
		3) {
		clear_exam_info()
	} else {
		clear_exam_info()
	}
});
var _hmt = _hmt || [];
(function() {
	var hm = document.createElement("script");
	hm.src = "https://hm.baidu.com/hm.js?dd18823003a9883d07ac0b24b75f9d16";
	var s = document.getElementsByTagName("script")[0];
	s.parentNode.insertBefore(hm, s);
})();
(function(b, a, e, h, f, c, g, s) {
	b[h] = b[h] || function() {
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
