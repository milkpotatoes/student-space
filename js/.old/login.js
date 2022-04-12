$(() => {
	if (localStorage.getItem("Token")) {
		getUserInfo((data, status) => {
			let userInfo = JSON.parse(data);
			if (userInfo.status == 200) {
				window.location.replace("./index.html");
				return true;
			}
		});
	}

	$("#login-btn").click(() => {
		// 验证手机号格式
		if ($("#userCode").val().match("^1+[0-9]{10,10}$") === null) {
			mdui.snackbar({
				message: "请输入正确的手机号"
			});
			return false;
		}
		if ($("#login-type").hasClass("login-sms")) {
			// 验证密码是否为空
			if ($("#password").val().length === 0) {
				mdui.snackbar({
					message: "密码不能为空"
				});
			}

			$.ajax({
				type: "post",
				url: getUrl("my", "/login"),
				data: {
					userCode: $("#userCode").val(),
					password: Base64.encode($("#password").val())
				},
				headers: {
					Version: localStorage.getItem("szoneVersion")
				},
				success: (data, status) => {
					data = JSON.parse(data);
					if (data.status == 200) {

						localStorage.setItem("Token", data.data.token);
						getUserInfo((data, status) => {
							data = JSON.parse(data);
							if (data.status == 200) {
								localStorage.setItem("userInfo", Base64.encode(JSON.stringify(data)));
								mdui.snackbar({
									message: "登录成功",
									timeout: 500,
									onClose: () => window.location.replace("index.html")
								});
							}
						});
					} else {
						mdui.snackbar({
							message: data.message
						});
					}
				}
			});

		} else {
			// 验证验证码格式
			if ($("#smsCode").val().match("^[0-9]{6,6}$") === null) {
				mdui.snackbar({
					message: "请输入正确的短信验证码"
				});
				return false;
			}
			$.ajax({
				type: "post",
				url: getUrl("my", "/login/entry"),
				data: {
					userCode: $("#userCode").val(),
					verifyCode: $("#smsCode").val(),
					token: $("#smsCode").attr("token")
				},
				headers: {
					Version: localStorage.getItem("szoneVersion")
				},
				success: (data, status) => {
					data = JSON.parse(data);
					if (data.status == 200) {

						localStorage.setItem("Token", data.data.token);
						getUserInfo((data, status) => {
							data = JSON.parse(data);
							if (data.status == 200) {
								localStorage.setItem("userInfo", Base64.encode(JSON.stringify(data)));
								mdui.snackbar({
									message: "登录成功",
									timeout: 500,
									onClose: () => window.location.replace("index.html")
								});
							}
						});
					} else {
						mdui.snackbar({
							message: data.message
						});
					}
				}
			});
		}
	});

	$("#sendsms").click(() => {
		$.ajax({
			type: "post",
			url: getUrl("my", "/login/sendsms"),
			headers: {
				Version: localStorage.getItem("szoneVersion")
			},
			data: {
				userCode: Base64.encode($("#userCode").val())
			},
			success: (data, status) => {
				data = JSON.parse(data);
				if (data.status == 200) {
					mdui.snackbar({
						message: "验证码发送成功"
					});
					$("#smsCode").attr("token", data.data.token);
					$("#smsCode").attr("tel", $("#userCode").val());
					$("#sendsms").attr("disabled", true);
					$("#userCode").attr("disabled", true);
					$("#userCode").parent().addClass("mdui-textfield-disabled");
					countDown(61, (lefttime) => {
						if (lefttime > 0) {
							$("#sendsms").text('重新发送(' + lefttime + ')');
							if ($("#userCode").val() != $("#smsCode").attr("tel")) {
								$("#sendsms").text('获取验证码');
								$("#sendsms").removeAttr("disabled");
							}
						} else {
							$("#sendsms").text('获取验证码');
							$("#sendsms").removeAttr("disabled");
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

	$("#login-type").click(() => {
		$(".sms-widget").toggle();
		$(".password-widget").toggle();
		$("#login-type").toggleClass("login-sms");
		$("#login-type").toggleClass("login-pwd");

		$("#userCode").parent().removeClass("mdui-textfield-disabled");
		if ($("#login-type").hasClass("login-sms")) {
			// 切换为密码登录时执行的事件
			$("#login-type").text("验证码登录/注册");
			$("#userCode").attr("disabled", false);
		} else {
			// 切换为验证码登录时执行的事件
			if ($("#userCode").val() == $("#smsCode").attr("tel")) {

				if ($("#sendsms").attr("disabled") == "disabled") {
					$("#userCode").attr("disabled", true);
					$("#userCode").parent().addClass("mdui-textfield-disabled");
				}
			} else {
				$("#userCode").attr("disabled", false);
				$("#userCode").parent().removeClass("mdui-textfield-disabled");
			}
			$("#login-type").text("密码登录");
		}
	});
});
