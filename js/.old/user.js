var provinceList;
var gradeList;

function setBG() {
	let ew = document.getElementsByClassName("background-card")[0].offsetWidth;
	let eh = document.getElementsByClassName("background-card")[0].offsetHeight;
	let item = document.getElementsByClassName("userBasicInfo")[0].offsetHeight;
	let py = 0 - (ew * 1155 / 2048 + item - eh);
	$(".background-card").css("background-position", `0px ${py}px`);
	// console.log(`元素宽度：${ew}，元素高度:${eh}，信息栏高度：${item}，位移${py}`)
}

$.get("json/province.json", (data, status) => provinceList = data);

$.get("json/grade.json", (data, status) => gradeList = data);

function setStudentAreaInfo(userInfo) {
	if (provinceList !== undefined && gradeList !== undefined) {
		if (userInfo.schoolGuid) {
			$(".schoolName").text(userInfo.schoolName);
			$(".schoolName").attr("value", userInfo.schoolGuid);
		}
		for (let i = 0; i < provinceList.index.length; i++) {
			if (provinceList.index[i] == userInfo.cityCode.match(/\d{2}/)) {
				if (provinceList.data[i].cityCode == userInfo.cityCode) {
					$(".cityArea").text(provinceList.data[i].province);
				} else {
					for (let j = 0; j < provinceList.data[i].list.length; j++) {
						if (provinceList.data[i].list[j].cityCode == userInfo.cityCode) {
							$(".cityArea").text(provinceList.data[i].province + " " + provinceList.data[i].list[j].cityName);
							$(".cityArea").attr("value", userInfo.cityCode);
							return;
						}
					}
				}
				return;
			}
			if (userInfo.isGraduated) {
				$(".grade").text("已毕业");
			} else {
				for (let i = 0; i < gradeList.length; i++) {
					if (gradeList[i].value == userInfo.currentGrade.toUpperCase()) {
						$(".grade").text(gradeList[i].text);
						$(".grade").attr("value", userInfo.currentGrade.toUpperCase());
					}
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
		if (provinceList.data[k].list !== undefined) {
			$(".city").show();
			$(".city-select").append($(`<option value="-1" selected>请选择</option>`));
			for (let i = 0; i < provinceList.data[k].list.length; i++) {
				let cityName = provinceList.data[k].list[i].cityName;
				let cityCode = provinceList.data[k].list[i].cityCode;
				$(".city-select").append($(`<option value="${cityCode}">${cityName}</option>`));
			}
		} else {
			$(".city").hide();
			let cityName = provinceList.data[k].province;
			let cityCode = provinceList.data[k].cityCode;
			$(".city-select").append($(`<option value="${cityCode}" selected>${cityName}</option>`));

		}
	} else {
		$(".city").hide();
	}
}

function selectArea() {
	let areaDialog = new mdui.dialog({
		title: "请选择地区",
		content: `<div class="mdui-typo province">省/直辖市/特别行政区</div>
					<select class="mdui-select province province-select"></select>
<div class="mdui-typo city">市/县</div>
					<select class="mdui-select city city-select"></select>`,
		buttons: [{
				text: "取消"
			},
			{
				text: "确定",
				close: false,
				onClick: () => {
					if ($(".province-select").val() !== "-1" && $(".city-select").val() !== "-1") {
						areaDialog.close();
						if ($(".city-select").is(":hidden")) {
							$(".cityArea").text($(".city-select").find(
								":selected").text());
							$(".cityArea").attr("value", $(".city-select").val());
						} else {
							$(".cityArea").text($(".province-select").find(":selected").text() + " " + $(".city-select").find(
								":selected").text());
							$(".cityArea").attr("value", $(".city-select").val());
						}
						$(".cityArea").attr("change", "true");
						enableSubmitButton();
					} else {
						mdui.snackbar({
							message: "请选择地区"
						});
					}
				}
			}
		]
	});

	$(".province-select").append($(`<option value="-1" selected>请选择</option>`));
	for (let i = 0; i < provinceList.province.length; i++) {
		let provinceName = provinceList.province[i];
		$(".province-select").append($(`<option value="${i}">${provinceName}</option>`));
	}

	mdui.mutation();
	$(".city").hide();
	areaDialog.handleUpdate();

	$(".province-select").change(() => {
		updateCityOptions();
		areaDialog.handleUpdate();
	});
	if ($(".cityArea").attr("value")) {
		for (let i = 0; i < provinceList.index.length; i++) {
			if (provinceList.index[i] == $(".cityArea").attr("value").match(/\d{2}/)) {
				$(".province-select").val(i);
				updateCityOptions();
				areaDialog.handleUpdate();
				$(".city-select").val($(".cityArea").attr("value"));
				return;
			}
		}
	}
}

function selectSchool() {
	$.ajax({
		type: "get",
		url: getUrl("my", "/userInfo/getSchoolList"),
		headers: {
			Token: localStorage.Token,
			Version: localStorage.szoneVersion
		},
		data: {
			city: $(".cityArea").attr("value")
		},
		success: (data, status) => {
			data = JSON.parse(data);
			if (data.status !== 200) {
				mdui.snackbar({
					message: data.message
				});
				return;
			}
			let schoolDialog = new mdui.dialog({
				title: "请选择学校",
				content: `<div class="mdui-typo school">学校</div>
					<select class="mdui-select school school-select"></select>`,
				buttons: [{
						text: "取消"
					},
					{
						text: "确定",
						close: false,
						onClick: () => {
							if ($(".school-select").val() !== "-1") {
								schoolDialog.close();
								$(".schoolName").text($(".school-select").find(":selected").text());
								$(".schoolName").attr("value", $(".school-select").val());
								$(".schoolName").attr("change", "true");
								enableSubmitButton();
							} else {
								mdui.snackbar({
									message: "请选择学校"
								});
							}
						}
					}
				]
			});
			$(".school-select").append($(`<option value="-1" selected>请选择</option>`));
			for (let i = 0; i < data.data.length; i++) {
				let schoolName = data.data[i].name;
				let schoolGuid = data.data[i].guid;
				$(".school-select").append($(`<option value="${schoolGuid}">${schoolName}</option>`))
			}
		}
	})

}

function updateGrageOps() {
	$(".agrade-select").empty();
	if ($(".step-select").val() === "-1") {
		$(".agrade").hide();
	} else {
		$(".agrade-select").append($(`<option value="-1">请选择</option>`))
		for (let i = 0; i < gradeList.length; i++) {
			let gradeName = gradeList[i].text;
			let gradeCode = gradeList[i].value;
			if ($(".step-select").val() === gradeList[i].code) {
				$(".agrade-select").append($(`<option value="${gradeCode}">${gradeName}</option>`))
			}
		}
		$(".agrade").show()
	}

}

function selectGrade() {
	let agradeDialog = new mdui.dialog({
		title: "请选择年级",
		content: `<div class="mdui-typo step">阶段</div>
			<select  class="mdui-select step step-select">
			<option value="-1" selected>请选择</option>
			<option value="x">小学</option>
			<option value="c">初中</option>
			<option value="g">高中</option>
			</select>
			<div class="mdui-typo agrade">年级</div>
			<select  class="mdui-select agrade agrade-select"></select>`,
		buttons: [{
				text: "取消"
			},
			{
				text: "确定",
				close: false,
				onClick: () => {
					if ($(".step-select").val() !== "-1" && $(".agrade-select").val() !== "-1") {
						agradeDialog.close();
						$(".grade").text($(".agrade-select").find(":selected").text());
						$(".grade").attr("value", $(".agrade-select").val());
						$(".grade").attr("change", "true");
						enableSubmitButton();
					} else {
						mdui.snackbar({
							message: "请选择年级"
						})
					}
				}
			}
		]
	});
	$(".agrade").hide();
	agradeDialog.handleUpdate();
	$(".step-select").change(() => {
		updateGrageOps();
		agradeDialog.handleUpdate();
	})
}

function enableSubmitButton() {
	if ($(".cityArea").attr("value") !== "" && $(".cityArea").attr("value") !== undefined && $(".schoolName").attr("value") !==
		"" && $(".schoolName").attr("value") !== undefined && $(".grade").attr("value") !== "" && $(".grade").attr("value") !==
		undefined && $(".studentName").text !== "点击设置" && $(".studentName").text !== "") {
		$(".saveUserInfo").attr("disabled", false)
	}
}

function submitUserInfo() {
	let postData = {};
	let path;
	if ($(".cityArea").attr("change") === "true") {
		if (getUserCache().data.schoolGuid === undefined) {
			postData.cityCode = $(".cityArea").attr("value");
		} else {
			postData.city = $(".cityArea").attr("value");
		};
	};
	if ($(".studentName").attr("change") === "true") {
		postData.studentName = $(".studentName").text();
	};
	if ($(".schoolName").attr("change") === "true") {
		postData.schoolGuid = $(".schoolName").attr("value");
	};
	if ($(".grade").attr("change") === "true") {
		if (getUserCache().data.schoolGuid === undefined) {
			postData.gradeCode = $(".grade").attr("value");
		} else {
			postData.grade = $(".grade").attr("value");
		}
	};

	if (getUserCache().data.schoolGuid === undefined) {
		path = "/userinfo/BindStudentInfo";
	} else {
		path = "/UserInfo/UpdateUserInfo";
	}

	$.ajax({
		type: "post",
		url: getUrl("my", path),
		data: postData,
		headers: {
			Token: localStorage.Token,
			Version: localStorage.szoneVersion
		},
		success: (data, status) => {
			data = JSON.parse(data);
			let msg
			if (data.status === 200) {
				mdui.snackbar({
					message: "绑定成功",
				});
				$(".saveUserInfo").attr("disabled", true);
				$("div[change]").removeAttr("change");
				$("div[set]").removeAttr("set");
				getUserInfo((data, status) => localStorage.userInfo = Base64.encode(data));
			} else {
				mdui.snackbar({
					message: data.message,
				});
			}
		}
	})
}

$(() => {
	window.onresize = () => setBG();
	if (!localStorage.getItem("Token")) {
		window.location.assign("login.html");
		// return false;
	} else {
		// 以本地缓存设置用户信息
		let userInfo = getUserCache().data;
		// console.log(userInfo)
		if (userInfo) {
			// 设置用户头像
			if (userInfo.avarUrl === "") {
				$(".userAvatar").attr("src", "src/ic_launcher.png");
			} else {
				$(".userAvatar").attr("src", userInfo.avarUrl);
			}
			$(".nickName").text(userInfo.nickName);
			$(".userCode").text((userInfo.userCode).replace(/(\d{3})\d*(\d{4})/, '$1****$2'));
			//设置所在区域

			// 设置学生信息
			$(".studentName").text(userInfo.studentName);
			// 设置当前年级
			if (userInfo.cityCode) {
				setStudentAreaInfo(userInfo);
			} else {

				$(".studentName").parents(".mdui-list-item").click(() => {
					if ($(".studentName").attr("set") === "false") {
						mdui.prompt("姓名", "请输入姓名", (v) => {
							if (v !== "") {
								$(".studentName").text(v);
							} else {
								$(".studentName").text("点击设置");
							}
							enableSubmitButton();
							$(".studentName").attr("change", "true");
						}, undefined, {
							confirmText: "确定",
							cancelText: "取消"
						})
					}
				});

				$(".schoolName").parents(".mdui-list-item").click(() => {
					if ($(".schoolName").attr("set") === "false") {
						if ($(".cityArea").attr("value") !== undefined && $(".cityArea").attr("value") !== "") {
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

				$(".cityArea").text("点击设置");
				$(".studentName").text("点击设置");
				$(".studentName").attr("set", "false")
				$(".schoolName").text("点击设置");
				$(".schoolName").attr("set", "false")
				$(".grade").text("点击设置");
				$(".grade").attr("set", "false")
			}
		}
	}
	$(".cityArea").parents(".mdui-list-item").click(() => selectArea())
	setBG();

	$(".saveUserInfo").click(() => {
		if (getUserCache().data.schoolGuid === undefined) {
			let name = $(".studentName").text();
			let school = $(".schoolName").text();
			let grade = $(".grade").text();
			let city = $(".cityArea").text();
			mdui.dialog({
				title: "确认信息",
				content: `<div class="mdui-typo"><span class="mdui-text-color-theme-accent">注意：</span> 学生信息只能绑定一次，请确认信息是否有误。</div>
				<div class="mdui-typo">地区：${city}</div>
				<div class="mdui-typo">学校：${school}</div>
				<div class="mdui-typo">姓名：${name}</div>
				<div class="mdui-typo">年级：${grade}</div>`,
				buttons: [{
						text: "取消"
					},
					{
						text: "确定",
						onClick: () => submitUserInfo()
					}
				]
			})
		}
	})
})
