// 选中文字后，按 Ctrl 弹出翻译
// api @see https://blog.csdn.net/panshiqu/article/details/104193607

import {elemOf, Msg, request, showMsg} from "do-utils";

export const Translate = {
  TAG: "[Trans]",

  // API
  api: "https://translate.google.com/translate_a/single?client=gtx&sl=#{sl}&tl=#{tl}" +
    "&dt=t&q=#{q}",

  // 只当指定快捷键被按下才触发翻译
  HOTKEY: "Control",

  // 按下了设置的热键，以判断是否弹翻译
  hotkeyPressed: false,

  /**
   * 添加popover弹窗元素
   */
  addPop: async function (): Promise<Element> {
    // 获取本地的html，显示翻译结果
    let htmlURL = chrome.runtime.getURL("/htmls/translate.html")
    let resp = await request(htmlURL)
    let html = elemOf(await resp.text())

    // 点击弹窗外面时移除元素
    // 不可用document.onmouseup=event => {}，会覆盖之前的事件
    document.addEventListener("mouseup", event => {
      let elem = event.target
      if (elem instanceof Element && !html.contains(elem)) {
        // html.style.display = "none";
        html.remove()
      }
    })

    document.body.appendChild(html)
    return html
  },

  /**
   * 初始化
   */
  init: async function () {
    // 当指定热键被按下时记录，当非热键被按下，则删除之前的记录
    document.addEventListener("keydown", e => {
      this.hotkeyPressed = e.key === this.HOTKEY
    })

    // 当只有指定热键被按下时，在热键弹起时触发翻译功能
    document.addEventListener("keyup", async e => {
      // 排除其它按键的情况
      if (e.key !== this.HOTKEY || !this.hotkeyPressed) return

      // 获取选择的文本
      let selection = window.getSelection()

      // 判断选择的文本为空时，不翻译
      let text = selection?.toString().trim()
      if (!selection || !text) return

      // 获取选择的文本的位置，就近弹窗显示翻译结果
      let rect = selection.getRangeAt(0).getBoundingClientRect()

      // 判断翻译语言
      let sl = "auto"      // 默认源语言
      let tl = "zh-CN"     // 默认目标语言
      // 如果被翻译的文本含汉字，则设目标语言为英文
      if (/[\u4e00-\u9fa5]+/.test(text)) {
        tl = "en"
      }

      // 翻译
      // 拼接 API URL
      let url = this.api.replace("#{sl}", sl)
        .replace("#{tl}", tl).replace("#{q}", encodeURIComponent(text))

      // 使用后台脚本请求忘了，以绕过跨域的限制
      chrome.runtime.sendMessage({cmd: "cors", url: url}, async resp => {
        // 获取翻译出错
        if (!resp.ok) {
          console.log(this.TAG, "获取翻译结果出错：", resp.text)
          await showMsg("获取翻译结果出错", Msg.error)
          return
        }

        // 解析翻译结果
        let obj = JSON.parse(resp.text)
        // Google翻译返回的结果是数组，需要循环合并翻译结果
        let result = ""

        // 提取翻译的结果
        for (let line of obj[0]) {
          result += line[0].trim() + "\n"
        }

        // 添加翻译弹出层
        let popup = (await this.addPop()) as HTMLElement

        // 填充数据
        // html.querySelector("#do-title").innerText = selection.toString()
        popup.textContent = result

        // 设置弹窗的坐标位置
        let xpos = rect.x
        // y 值需要包含浏览器滚动条的高度，否则会在网页开头而不是当前屏幕上
        let ypos = (document.body.scrollTop || document.documentElement.scrollTop) + rect.y + rect.height + 1
        popup.style.transform = `translate(${xpos}px, ${ypos}px)`
        popup.style.display = "block"
      })
    })
  }
}