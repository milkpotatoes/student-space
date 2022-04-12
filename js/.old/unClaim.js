var clickItem;
var claimDialog;

function getUnClaimExamList() {
	$(".exam-item-pgs").addClass("exam-loading");
	$(".exam-item-pgs").removeClass("exam-more");
	$(".exam-item-pgs").removeClass("mdui-hidden");
	$.ajax({
		type: "get",
		url: getUrl("score", "/exam/getUnClaimExams"),
		data: {
			studentName: getUserCache().data.studentName,
			schoolGuid: getUserCache().data.schoolGuid
		},
		headers: {
			Version: localStorage.getItem("szoneVersion"),
			Token: localStorage.getItem("Token")
		},
		success: (data, status) => {

			data = JSON.parse(data);
			if (data.status != 200) {
				mdui.snackbar({
					message: data.message,
					buttonText: "确定",
					onButtonClick: () => window.location.assign("login.html"),
					onClose: () => window.location.assign("login.html")
				});
				return false;
			}

			setTimeout(() => {
				if (data.data.length <= 0) {
					$(".noUnclaimExam").removeClass("mdui-hidden");
					$(".exam-item-pgs").removeClass("exam-loading");
					$(".exam-item-pgs").addClass("exam-end");
					$(".exam-item-pgs").addClass("mdui-hidden");
					return true;
				}

				for (var i = 0; i < data.data.length; i++) {
					let unClaimData = data.data[i];
					let month = unClaimData.month;
					$("#unClaimExamList").append($(`<li class="mdui-subheader">${month}</li>`));
					for (let i = 0; i < unClaimData.list.length; i++) {
						var examData = unClaimData.list[i];
						let examTime = examData.time;
						let examName = examData.examName;
						let examGuid = examData.examGuid;
						let studentCode = Base64.encode(JSON.stringify(examData.studentCodeList));
						let examItem =
							`<li class="mdui-list-item mdui-card mdui-m-t-1 mdui-hoverable examItem" value="${examGuid}" data="${studentCode}">
					<div class="mdui-list-item-content">
					<div class="mdui-list-item-title">${examName}</div>
					<div class="mdui-list-item-text examTime">${examTime}</div>
					</div>
					</li>`;
						// console.log(examItem)
						$("#unClaimExamList").append($(examItem));
					}
				}
				examItemClick();
				$(".exam-item-pgs").removeClass("exam-loading");
				$(".exam-item-pgs").addClass("exam-end");
				$(".exam-item-pgs").addClass("exam-more");
				$(".exam-item-pgs").addClass("mdui-hidden");
				$(".noUnclaimExam").text("已加载所有未认领考试");
				$(".noUnclaimExam").removeClass("mdui-hidden");
			}, 1500);
		}
	});
}

function claimExam(studentCode, examGuid) {
	$.ajax({
		type: "post",
		url: getUrl("score", "/exam/claimExam"),
		headers: {
			Token: localStorage.Token,
			Version: localStorage.szoneVersion
		},
		data: {
			examGuid: examGuid,
			studentCode: studentCode
		},
		success: (data, status) => {
			data = JSON.parse(data);
			if (data.status == 200) {
				mdui.snackbar({
					message: "认领成功",
					buttonText: "查看",
					onButtonClick: () => window.location.assign("index.html")
				});
				if (clickItem.prev().hasClass("mdui-subheader") && clickItem.next().hasClass("mdui-subheader")) {
					clickItem.prev().remove();
				}
				clickItem.remove();
				claimDialog.close();
			} else {
				mdui.snackbar({
					message: data.message
				});
			}
		}
	});
}

$(() => getUnClaimExamList());

function examItemClick() {

	$(".examItem").click((e) => {
		clickItem = $(e.target).closest(".examItem");
		let claimExamDialog = new mdui.Dialog("#claimExam");
		let examGuid = $(e.target).closest(".examItem").attr("value");
		let studentCodeList = JSON.parse(Base64.decode($(e.target).closest(".examItem").attr("data")));
		$(".examInfo").empty();
		let itemContent = "";

		for (let i = 0; i < studentCodeList.length; i++) {
			console.log(i);
			let studentCode = studentCodeList[i];
			$.ajax({
				type: "get",
				url: getUrl("score", "/exam/getImgUrlByStudentCode"),
				headers: {
					Token: localStorage.Token,
					Version: localStorage.szoneVersion
				},
				data: {
					examGuid: examGuid,
					studentCode: studentCode
				},
				success: (data, status) => {
					data = JSON.parse(data);
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
						`<!-- 待认领考试卡片 -->
			<div class="mdui-panel-item${openClass}">
				<div class="mdui-panel-item-header">${studentCode}<i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i></div>
				<div class="mdui-panel-item-body">
					<img class="mdui-img-rounded mdui-img-fluid paperImg" src="${img}">
					<div class="mdui-panel-item-actions">
						<button class="mdui-btn mdui-ripple claimExamBtn" onclick="claimExam('${studentCode}','${examGuid}')"  mdui-panel-item-confirm>认领</button>
					</div>
				</div>
			</div>`;

					claimDialog = mdui.dialog({
						title: "认领考试",
						content: `<span class="mdui-typo">
				请选择属于本人的考试认领
			</span>
			<div class="mdui-panel examInfo" mdui-panel="{accordion: true}">
				${itemContent}
			</div>`,
						onOpen: (inst) => {
							$("img").load(() => {
								inst.handleUpdate();
							});
						},
						buttons: [{
							text: "取消"
						}]
					});
					claimDialog.open();
					mdui.mutation();
				}
			});
		}
		// claimExamDialog.open();
	});
}
