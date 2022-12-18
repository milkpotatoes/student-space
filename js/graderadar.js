export class GradeRadar {
    #grades = [];
    #grade_total;
    #aly_ctx;
    #sub_aly;
    // 初始化array用以储存各点坐标
    #dots = [];
    #auto_draw = false;
    #exportName;
    #exam_name;
    #font_size;
    /**
     * 绘制考试等级，初始化时需设置目标画布位置
     * @param {selector} canvas 
     * @return {GradeRadar} 返回当前对象
     */
    constructor(canvas) {
        if (canvas) this.setCanvas(canvas)
        return this;
    }

    setCanvas(canvas) {
        this.#sub_aly = document.querySelector(canvas);
        let box_size = this.#sub_aly.parentElement.getClientRects()[0];
        this.#aly_ctx = this.#sub_aly.getContext("2d");
        this.#sub_aly.width = box_size.width - 32;
        this.#sub_aly.height = this.#sub_aly.width * (this.#exam_name ? .94 : .9);
        this.initParams(this.#aly_ctx, this.#sub_aly);
        return this;
    }

    setExamName(name) {
        this.#exam_name = name;
        return this;
    }

    initParams(ctx, ele) {
        // 获取画布高宽参数
        this.height = ele.height * (this.#exam_name ? .96 : 1);
        this.width = ele.width;

        // 清空画布内容
        ctx.clearRect(0, 0, this.width, this.height);

        // 初始化样式
        ctx.strokeStyle = "#bbb";
        ctx.fillStyle = "#448aff";
        ctx.lineWidth = Math.round(this.height / 200, 0);
        ctx.setLineDash([2 * this.height / 100, 1 * this.height / 100]);
        this.#font_size = Math.max(Math.round(this.height / 25, 0), 12);
        ctx.font = this.#font_size + "px sans-serif";
        ctx.textAlign = "center";
        return this;
    }

    /**
     * 按照给定参数在canvas对象上绘制点，此函数将会闭合路径，请确保路径已闭合以防止干扰工作
     * @param {CanvasRenderingContext2D} ctx canvas 2d context 对象，
     * @param {number} x 目标点x坐标
     * @param {number} y 目标点y坐标
     * @param {number} r 目标点半径
     * @param {string} [color] 绘制色彩，可使用十六进制色彩字符串、rgb或rgba三种方式表示，支持透明度；为空则使用canvas的fillStyle属性进行绘制；
     */
    _drawDot(ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        let tmp_c = ctx.fillStyle;
        if (color) ctx.fillStyle = color;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = tmp_c;
    }

    drawMesh() {
        // 计算初始点角度
        let zero = 0 - Math.PI / this.#grades.length - Math.PI / 2
        // 逐层绘制网格
        for (let order = 4; order >= 0; order--) {
            let d = (this.height / 2 - this.height / 15) * order / 4
            console.log(d)
            // 开启路径
            this.#aly_ctx.beginPath()
            // 逐段绘制网格
            for (let i in this.#grades) {
                let sang = Math.PI * 2 * i / this.#grades.length - Math.PI / this.#grades.length - Math.PI / 2
                this.#aly_ctx.lineTo(Math.cos(sang) * d + this.width / 2, Math.sin(sang) * d + this.height / 2)
                // 在绘制最外层网格的同时绘制径向射线
                if (order == 4) {
                    this.#aly_ctx.lineTo(this.width / 2, this.height / 2)
                    this.#aly_ctx.moveTo(Math.cos(sang) * d + this.width / 2, Math.sin(sang) * d + this.height / 2)
                    this.#aly_ctx.fillText(this.#grades[i].name,
                        Math.cos(sang) * d * 1.1 + this.width / 2,
                        Math.sin(sang) * d * 1.1 + this.height / 2 + 5)
                }
                if (i == this.#grades.length - 1) this.#aly_ctx.lineTo(Math.cos(zero) * d + this.width / 2, Math.sin(zero) * d + this.height / 2)
            }
            this.#aly_ctx.stroke()
        }
        return this;
    }

    calcGradeDots() {
        this.#dots = [];
        for (let i in this.#grades) {
            let sang = Math.PI * 2 * i / this.#grades.length - Math.PI / this.#grades.length - Math.PI / 2;
            let d = (this.height / 2 - this.height / 15) * this.#grades[i].value / 20;
            this.#dots.push({ x: Math.cos(sang) * d + this.width / 2, y: Math.sin(sang) * d + this.height / 2 });
        }
        return this;
    }

    drawGradeDots() {
        // 绘制等级所在点
        let i = 0;

        for (let dot of this.#dots) {
            this._drawDot(this.#aly_ctx, dot.x, dot.y, this.height / 90);
            let tmp_c = this.#aly_ctx.fillStyle;
            this.#aly_ctx.fillStyle = "#666";
            this.#aly_ctx.fillText(this.#grades[i++].grade, dot.x, dot.y - this.height / 45)
            this.#aly_ctx.fillStyle = tmp_c;
        }
        return this;
    }

    fillGradeArea() {
        // 填充等级覆盖区域
        this.#aly_ctx.globalAlpha = .25
        this.#aly_ctx.beginPath()
        this.#aly_ctx.moveTo(this.#dots[0].x, this.#dots[0].y)
        for (let i in this.#dots) {
            this.#aly_ctx.lineTo(this.#dots[i].x, this.#dots[i].y)
        }
        this.#aly_ctx.fill()
        this.#aly_ctx.globalAlpha = 1
        return this;
    }

    drawRadarImg(width, height, background) {
        if (width && height) {
            this.#sub_aly.width = width;
            this.#sub_aly.height = height;
        }
        this.initParams(this.#aly_ctx, this.#sub_aly);
        if (background) {
            let temp_c = this.#aly_ctx.fillStyle;
            this.#aly_ctx.fillStyle = background;
            this.#aly_ctx.fillRect(0, 0, this.#sub_aly.width, this.#sub_aly.height);
            this.#aly_ctx.fillStyle = temp_c;
        }
        let font_size = Math.round(this.#font_size * .95, 0)
        this.#aly_ctx.font = font_size + "px sans-serif";
        let tmp_c = this.#aly_ctx.fillStyle;
        this.#aly_ctx.fillStyle = "#555";
        if (this.#exam_name) this.#aly_ctx.fillText(this.#exam_name, this.width / 2, this.height * 1.03);
        this.#aly_ctx.fillStyle = tmp_c;
        this.#aly_ctx.font = this.#font_size + "px sans-serif";
        this.calcGradeDots().drawMesh().fillGradeArea().drawGradeDots();
    }

    setGradeTotal(total) {
        this.#grade_total = total;
        return this;
    }

    setGrades(grades) {
        this.#grades = grades;
        this.#grade_total = this.#grades.length;
        return this;
    }

    pushGrade(grade) {
        this.#grades.push(grade)
        if (this.#auto_draw && this.isComplete()) this.drawRadarImg();
        return this;
    }

    isComplete() {
        console.log(this.#grade_total == this.#grades.length, this.#grade_total, this.#grades.length)
        return this.#grade_total == this.#grades.length;
    }

    autoDraw(auto) {
        this.#auto_draw = auto;
        if(this.isComplete()) this.drawRadarImg()
        return this;
    }

    exportRadarImg(name) {
        let ori_canvas = this.#sub_aly;
        let canvas = document.createElement("canvas");
        this.#sub_aly = canvas
        this.#aly_ctx = canvas.getContext("2d");
        this.drawRadarImg(1920, 1080, "#fff");
        let a_tag = document.createElement("a");
        a_tag.download = name ? name : this.#exportName;
        a_tag.href = canvas.toDataURL("image/png");
        a_tag.click();
        this.#sub_aly = ori_canvas;
        this.#aly_ctx = this.#sub_aly.getContext("2d");

        return this;
    }
    setExportName(name) {
        this.#exportName = name;
        return this;
    }
}

export default GradeRadar