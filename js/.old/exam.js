function getSubjectGrade(i, subject, examGuid, studentCode) {
	$.ajax({
		type: "post",
		url: getUrl("score", "/Question/SubjectGrade"),
		headers: {
			Token: localStorage.Token,
			Version: localStorage.szoneVersion,
		},
		data: {
			compareClassAvg: -1,
			examGuid: examGuid,
			examSchoolGuid: getUserCache().data.schoolGuid,
			ruCode: getUserCache().data.ruCode,
			schoolGuid: getUserCache().data.schoolGuid,
			studentCode: studentCode,
			studentName: getUserCache().data.studentName,
			subject: subject
		},
		success: (data, status) => {
			data = JSON.parse(data);
			// console.log(data);
			let pkMsg = data.data.pk.conclusion;
			let readMsg = data.data.read;
			let totalNum = data.data.report.total;
			let gradeTbody = "";
			readMsg = readMsg.replace("<span>", '<span class="mdui-text-color-theme-accent">');
			pkMsg = pkMsg.replace("<span>", '<span class="mdui-text-color-theme-accent">');
			$(`#subject-tab-${i}`).append(
				`<div class="mdui-card mdui-shadow-1 mdui-m-t-2 mdui-p-a-2 mdui-typo-body-1-opacity" style="text-align: center;">本次参考总人数<span class="mdui-text-color-theme-accent">${totalNum}</span></div>`
			);
			if (pkMsg !== "") {
				pkgMsg = `<p style="text-indent: 2em;">${pkMsg}</p>`;
			}
			if (readMsg !== "" && data.data.pk.isShow === true) {
				readMsg = `<p style="text-indent: 2em;">${readMsg}</p>`;
				$(`#subject-tab-${i}`).append(
					`<div class="mdui-card mdui-shadow-1 mdui-typo mdui-m-t-2 mdui-p-a-2"><p style="text-indent: 2em;">${readMsg}${pkMsg}</div>`
				);
			}


			for (let i = 0; i < data.data.report.grades.length; i++) {
				if (i % 2 === 0) {
					let myLevel = "";
					// let myLevel_TEXT="";
					if (data.data.report.grade === data.data.report.grades[i][0]) {
						// console.log(data.data.report.grade === data.data.report.grades[i][0], i)
						myLevel = ' class="mdui-color-theme-accent"';
						// myLevel_TEXT = /class=/
					}

					let a_0 = data.data.report.grades[i][0];
					let a_1 = data.data.report.grades[i][1];
					let a_2 = data.data.report.grades[i][2];
					let a_3 = data.data.report.grades[i][3];
					let a_4 = data.data.report.grades[i][4];
					let a_5 = data.data.report.grades[i][5];
					let b_1 = data.data.report.grades[i + 1][1];
					let b_2 = data.data.report.grades[i + 1][2];
					let b_3 = data.data.report.grades[i + 1][3];
					gradeTbody = gradeTbody +
						`<tr${myLevel}><td style="min-width: 64px;" rowspan="2">${a_0}</td><td style="min-width: 96px;">${a_1}</td><td>${a_2}</td><td>${a_3}</td><td rowspan="2">${a_4}</td><td rowspan="2">${a_5}</td></tr><tr${myLevel}><td style="min-width: 96px;">${b_1}</td><td>${b_2}</td><td>${b_3}</td></tr>`;
				}
			}

			$(`#subject-tab-${i}`).append($(
				`<div class="subject-grade-table mdui-card mdui-typo mdui-m-t-2"><table class="subject-${i}-grade mdui-table"><thead><tr><th colspan="2" rowspan="2">等级</th><th rowspan="2">得分</th><th rowspan="2">标准分</th><th colspan="2" rowspan="1">区间累计人数</th></tr><tr><th>年级</th><th>班级</th></tr></thead><tbody>${gradeTbody}</tbody></table></div>`
			));
			// console.log(table)

			setTimeout(() => {
				$(".subject-grade-table").width(document.getElementsByClassName("scoreCard")[0].offsetWidth + "px");
			}, 1500);
			mdui.mutation();
		}
	});
}

function getAnwserCard(i, asiresponse, srcSubject, examGuid) {
	$.ajax({
		type: "post",
		url: getUrl("score", "/Question/AnswerCardUrl"),
		headers: {
			Token: localStorage.Token,
			Version: localStorage.szoneVersion,
		},
		data: {
			asiresponse: asiresponse,
			examGuid: examGuid,
			srcSubject: srcSubject,
			studentName: getUserCache().data.studentName,
			ruCode: getUserCache().data.ruCode,
			schoolGuid: getUserCache().data.schoolGuid
		},
		success: (data, status) => {
			data = JSON.parse(data);

			if (data.status != 200) {
				mdui.snackbar({
					message: `“${srcSubject}”答题卡获取失败`,
				});
			}
			for (let j = 0; j < data.data.length; j++) {
				let imgSrc = data.data[j];
				$(`#subject-tab-${i}`).append($(
					`<!-- 答题卡 --><div class="mdui-card-media anwserCard mdui-m-t-2 mdui-shadow-${i}"><img class="subject-${i}-img-${j}" src="${imgSrc}" alt="“${srcSubject}”答题卡"><div class="mdui-card-media-covered mdui-valign subject-${i}-img-loading-${j}"><div class="mdui-center mdui-spinner mdui-spinner-colorful"></div></div></div>`
				));

				mdui.mutation();
				$(`.subject-${i}-img-${j}`).load(() => {
					// console.log(`.subject-${i}-img-${j}`);
					$(`.subject-${i}-img-loading-${j}`).remove();
					// console.log(`$("#subject-${i}-img-loading-${j}").remove();`, i, j)
					$(`.subject-${i}-img-${j}`).viewer({
						toolbar: false,
						navbar: false,
						title: false
					});
				});
			}
		}
	});
}

$(() => {
	let jumpId = sessionStorage.jumpId;
	// console.log(jumpId)
	let jumpData;
	if (jumpId !== undefined) {
		jumpData = JSON.parse(Base64.decode(sessionStorage.jumpData));
	} else {
		jumpData = [];
	}
	let examGuid, studentCode;
	// console.log(jumpData);
	if (jumpId == jumpData.id && jumpId !== '') {
		examGuid = jumpData.examGuid;
		// getQueryString("examGuid");
		studentCode = jumpData.studentCode;
		// getQueryString("studentCode");
	} else {
		// mdui.snackbar({
		// 	message: '请选择考试后再查看！',
		// 	button : {
		// 		text: '返回首页' ,
		// 		onClick : () =>{
		// 			window.location.assign()
		// 		}
		// 	},
		// 	delay : 5000
		// })
		mdui.snackbar({
			message: "请选择考试后再查看",
			buttonText: "返回首页",
			onButtonClick: () => window.location.replace("index.html"),
			onClose: () => window.location.replace("index.html"),
			timeout: 3000
		});
		return 0;
	}
	// console.log(examGuid, studentCode)
	$.ajax({
		type: "post",
		url: getUrl("score", "/Question/Subjects"),
		headers: {
			Token: localStorage.Token,
			Version: localStorage.szoneVersion,
		},
		data: {
			examGuid: examGuid,
			studentCode: studentCode,
			ruCode: getUserCache().data.ruCode
		},
		success: (data, status) => {
			// console.log(data)
			data = JSON.parse(data);
			if (data.status != 200) {
				mdui.snackbar({
					message: data.message,
					buttonText: "返回首页",
					onClose: () => window.location.assign("index.html"),
					onButtonClick: () => window.location.assign("index.html")
				});
				return;
			}

			for (let i = 0; i < data.data.subjects.length; i++) {
				let subjectData = data.data.subjects[i];
				// console.log(45678);
				let subject = subjectData.km;
				// console.log(subject);
				let fullScore = subjectData.fullScore;
				let myScore = subjectData.myScore;
				switch (subjectData.code) {
					case -2:
						$(".mdui-tab").append($(`<a class="mdui-ripple" href="#subject-tab-${i}">${subject}</a>`));
						$(".main").append($(
							`<div class="mdui-container subjectCard mdui-hidden" id="subject-tab-${i}"><div class="mdui-card-content mdui-shadow-1 mdui-color-theme-accent scoreCard"><div class="mdui-typo name"> 分数卡片 </div><span class="myScore mdui-typo">${myScore}</span> <span class="scoreDivider mdui-typo">/</span> <span class="fullScore mdui-typo">${fullScore}</span></div></div>`
						));
						getSubjectGrade(i, subject, examGuid, studentCode);
						break;
					case 1:
						$(".mdui-tab").append($(`<a class="mdui-ripple" href="#subject-tab-${i}">${subject}</a>`));
						$(".main").append($(
							`<div class="mdui-container subjectCard mdui-hidden" id="subject-tab-${i}"><div class="mdui-card-content mdui-shadow-1 mdui-color-theme-accent scoreCard"><div class="mdui-typo name"> 分数卡片 </div><span class="myScore mdui-typo">${myScore}</span> <span class="scoreDivider mdui-typo">/</span> <span class="fullScore mdui-typo">${fullScore}</span></div></div>`
						));
						getSubjectGrade(i, subject, examGuid, studentCode);
						break;
					case 0:
						let asiresponse = subjectData.question.asiresponse;
						let srcSubject = subjectData.srcKM;
						$(".mdui-tab").append($(`<a class="mdui-ripple" href="#subject-tab-${i}">${subject}</a>`));
						$(".main").append($(
							`<div class="mdui-container subjectCard mdui-hidden" id="subject-tab-${i}"><div class="mdui-card-content mdui-shadow-1 mdui-color-theme-accent scoreCard"><div class="mdui-typo name"> 分数卡片 </div><span class="myScore mdui-typo">${myScore}</span> <span class="scoreDivider mdui-typo">/</span> <span class="fullScore mdui-typo">${fullScore}</span></div></div>`
						));
						getAnwserCard(i, asiresponse, srcSubject, examGuid);
						setTimeout(() => getSubjectGrade(i, subject, examGuid, studentCode), 200);
						break;
					default:
						break;
				}
			}

			setTimeout(() => {
				$(".mdui-tab").removeClass("mdui-hidden");
				$("body").addClass("mdui-appbar-with-tab");
				let inst = new mdui.Tab(".mdui-tab");
				inst.show(0);
			}, 800);
			setTimeout(() => {
				$(".mdui-hidden").removeClass("mdui-hidden");
				$(".exam-detail-pgs").addClass("mdui-hidden");
			}, 1500);
		}
	});
})
