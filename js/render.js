export class Render {
    #renderCache = undefined;
    /**
     * 
     * @param {String} source 模板来源页面
     * @param {String} name 模板名称
     * @param {String} direction 渲染参数
     * @param {String} target 渲染目标位置
     * @param {String} box 虚拟容器
     * @returns 
     */
    constructor(source, name, direction, target, box) {
        this.direction = "append";
        this.virtualContainer = "div";
        if (source && name) this.setTemplate(source, name);
        if (target) this.setTarget(target);
        if (direction) this.setDirection(direction);
        if (box) this.setVirtualContainer(box);
        return this;
    }

    setVirtualContainer(tag) {
        this.virtualContainer = tag;
        return this;
    }
    /**
     * 设置渲染目标位置
     * @param {String|Element} node 目标位置node或者Selector
     * @returns
     */
    setTarget(node) {
        if (typeof (node) == "object") if (node instanceof HTMLCollection || node instanceof HTMLElement) this.node = node
        if (typeof (node) == "string") this.node = document.querySelector(node);
        return this;
    }

    /**
     * 
     * @param {String} dirc 设置渲染方法可以是 append, before, after, self
     * @returns 
     */
    setDirection(dirc) {
        this.direction = dirc;
        return this;
    }

    /**
     * 
     * @param {Array} list 需要渲染的数据列表
     */
    renderList(list) {
        let vdom = this.renderListText(list);
        // console.log(vdom)
        this.renderToDOM(vdom);
    }

    renderListText(list) {
        let text = "";
        for (const e of list) {
            text += this.renderToText(e);
        }
        return text;
    }

    renderToText(data, template) {
        let text = template ? template : this.template
        for (const k in data) {
            let re = new RegExp(`{{${k}}}`, "g")
            text = text.replace(re, data[k]);
        }
        return text;
    }

    renderForProcess(data) {
        if (this.#renderCache == undefined) this.#renderCache = this.template;
        this.#renderCache = this.renderToText(data, this.#renderCache);
        return this;
    }

    cancleRenderForProcess() {
        this.#renderCache = undefined;
        return this;
    }

    renderToElement(data) {
        let vbox = document.createElement(this.virtualContainer);
        vbox.innerHTML = data;
        return vbox
    }

    renderToPage(data) {
        // console.log(this.#renderCache ? this.#renderCache : this.renderToText(data))
        let element = this.renderToElement(this.#renderCache ? this.#renderCache : this.renderToText(data));
        // console.log(element.childNodes)
        let element_copy = []
        for(let el of element.children){
            element_copy.push(el)
        }
        // element.children
        this.renderToDOM(element)
        return element_copy
    }

    renderToDOM(html) {
        let target = this.node;
        let vbox = typeof (html) == "string" ? this.renderToElement(html) : html
        
        let len = vbox.children.length;

        for (let i = 0; i < len; i++) {
            // console.log(i)
            let e = vbox.children[0];
            switch (this.direction) {
                case "before":
                    target.before(e);
                    break;
                case "after":
                    target.after(e);
                    break;
                case "append":
                    target.append(e);
                    break;
                case "self":
                    target.before(e);
                    break;
            }
        }

        if (this.direction == "self") target.remove();

        this.clearCache();
        return target;
    }

    setTemplate(path, name) {
        this.template = this.getTemplate(path, name).replace(/[\t\n]/g, "").replace(/ {2,}/g, " ");
        return this;
    }

    getTemplate(path, name) {
        if (!path && this.template) {
            return this.template;
        } else {
            let vbox = document.createElement(this.virtualContainer);
            let node = document.querySelector(`[page~=${path}] template[name~=${name}]`)
            if (node) {
                vbox.append(node.content.cloneNode(true));
                return vbox.innerHTML;
            } else {
                return undefined;
            }
        }
    }

    clearCache() {
        this.#renderCache = undefined;
        return this;
    }
}

export default Render;