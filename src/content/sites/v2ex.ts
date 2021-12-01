// v2ex的扩展
import {elemOf, Msg, showMsg} from "do-utils"
import {request} from "do-utils/dist/utils"

// 回复
type Reply = {
  // 发表回复的用户
  member: {
    // 用户名
    username: string,
    // 用户头像（大）
    avatar_large: string,
  },

  // 用户发表的内容（原始）
  content: string
  // 用户发表的内容（HTML处理化后）
  content_rendered: string
  // 回复的创建时间戳
  created: number
}

const V2ex = {
  TAG: "[V2ex]",

  // 此帖的所有回复
  allReplies: <Array<Reply>>[],

  // 对话列表的弹出层
  commsDiv: document.createElement("div") as HTMLElement,

  // 需要处理的页面的路径的正则匹配模式（需匹配整个 window.pathname，以免误判）
  // 如下的路径为：'/'、'/recent'、'/changes'、'/go/'、'/member/'
  regNeedDealPages: /^(\/|\/recent|\/changes|\/go\/.+|\/member\/.+)$/,

  // 悬浮显示对话列表的延迟（毫秒）
  delay: 300,

  // 处理首页帖子列表
  dealTopicList: function () {
    console.log(this.TAG, "扩展功能：1.帖子列表字体颜色为黑色；2.点击帖子右侧在扩展中浏览；3.新窗口打开帖子")
    // 帖子列表的标题设置黑色
    document.styleSheets[0].insertRule(".item_title a.topic-link:link {color: black}")

    // 点击帖子右侧（回复数地位置）时，在扩展中强行浏览该帖子
    document.querySelectorAll(".box .item tbody tr").forEach(e => {
      let target = e.lastElementChild as HTMLElement
      // 改变为手型指针
      target.style.cursor = "pointer"
      target.style.background = "rgba(245,245,245,0.5)"
      // 鼠标悬浮回帖数时，显示右击复制的提示
      target.title = "点击在扩展中浏览该帖子"

      // 点击以在本扩展中浏览该帖子
      target.onclick = (event) => {
        // 获取该贴的链接
        let elem = event.target as HTMLElement
        let linkElem = elem.closest("tr")?.querySelector(".topic-link") as HTMLLinkElement
        let group = linkElem.href?.match(/\/t\/(\d+)/)
        if (!group || group.length <= 1) {
          console.log(this.TAG, "尝试在扩展中浏览帖子出错：捕获帖子的链接失败", event.target)
          return
        }

        // 发送消息，新标签打开帖子
        chrome.runtime.sendMessage({
          cmd: "newtab",
          url: `/index.html#/view_topic?tid=${group[1]}`
        })

        event.preventDefault()
        event.stopImmediatePropagation()
      }
    })

    // 新窗口打开帖子
    document.addEventListener("click", event => {
      let target = event.target as HTMLLinkElement
      // 只处理不为 tab 的超链接
      if (target.tagName === "A" && new URL(target.href).pathname !== window.location.pathname) {
        window.open(target.href, "_blank")
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    })
  },

  // 帖子详情页
  /**
   * 添加回复列表的弹出层
   * @return {Promise<void>}
   */
  initPopupDiv: async function () {
    // 读取对话框列表的面板
    let htmlURL = chrome.runtime.getURL("/htmls/v2ex_pane.html")
    let resp = await request(htmlURL)
    this.commsDiv = elemOf(await resp.text()) as HTMLElement

    // 点击空白处，关闭面板
    document.addEventListener("mouseup", event => {
      let elem = event.target
      if (elem instanceof Element && !this.commsDiv.contains(elem)) {
        this.commsDiv.style.display = "none"
      }
    })
    // 或按ESC隐藏面板
    document.addEventListener("keyup", event => {
      if (event.key === "Escape" && this.commsDiv) {
        this.commsDiv.style.display = "none"
      }
    })

    document.body.appendChild(this.commsDiv)
  },

  // 初始化帖子详情页内的会话列表
  // 1. 筛选、显示 @TA 的回复或 TA 的回复
  // 2. 点击会话框上的楼层，在原网页中跳转
  initCommsPanel: async function () {
    console.log(this.TAG, "扩展功能：1.筛选、显示 @TA 的回复或 TA 的回复；2.点击会话框上的楼层，在原网页中跳转")
    // 帖子的发布者（楼主）
    let topicAuthorElem = document.querySelector(".header small a") as HTMLElement
    if (!topicAuthorElem) {
      console.log(this.TAG, "无法解析出楼主，不是帖子的详情页面，退出处理回复")
      showMsg("无法解析出楼主，退出处理回复", Msg.warning)
      return
    }
    let topicAuthor = topicAuthorElem.textContent

    // 添加回复列表的弹出层
    this.initPopupDiv()

    // 联网获取该贴的所有回复
    let reg = /\/t\/(\d+)/
    reg.test(window.location.pathname)
    let url = `//${window.location.host}/api/replies/show.json?topic_id=${RegExp.$1}`
    // 下载所有回复，存储到allReplies对象中
    let resp = await request(url)
    this.allReplies = await resp.json()

    // 迭代当前页面的所有回复的元素，添加功能
    for (let item of document.querySelectorAll(".reply_content")) {
      // 当前回复的发布者（层主）
      // @ts-ignore
      let author = item.closest("td").querySelector("strong a").innerText
      // 当前回复的层主所在的HTML节点（精确到<strong>，而不是更精确的<a>）
      // @ts-ignore
      let authorElem = item.closest("td").querySelector("strong")
      // 楼主回复的帖子，特殊标记
      let authorTagElem = document.createElement("span")
      authorTagElem.innerText = " [楼主]"
      if (author === topicAuthor) {
        authorTagElem.style.color = "#008000"
        authorElem?.appendChild(authorTagElem)
      }

      // 添加 显示回复者在本帖内的所有回复、本帖内@该回复者的所有回复的按钮
      let bnStr = "<a href='#' class='thank' data-show-replies='{type}' style='margin-right: 15px;'>{text}</a>"
      // type 为需要展示的回复的类型：TA 的回复("its")或 @TA 的回复("at_its")
      // @ts-ignore
      let itsReplies = elemOf(bnStr.format({type: "its", text: "TA的回复"}))
      // @ts-ignore
      let atItsReplies = elemOf(bnStr.format({type: "at_its", text: "@TA的回复"}))
      // 未登录状态没有".thank_area"元素，需要先创建该元素后添加上面的元素
      // @ts-ignore
      let thankArea = authorElem.parentElement.querySelector(".thank_area")
      // @ts-ignore
      let fr = authorElem.parentElement.querySelector(".fr")
      if (thankArea) {
        thankArea.prepend(atItsReplies)
        thankArea.prepend(itsReplies)
      } else if (fr) {
        let thankDiv = document.createElement("div")
        thankDiv.classList.add("thank_area")
        thankDiv.appendChild(itsReplies)
        thankDiv.appendChild(atItsReplies)
        fr.prepend(thankDiv)
      }
    }

    // 根据需要筛选、显示 @TA 的回复或 TA 的回复
    document.addEventListener("click", event => {
      let target = event.target
      // 需要展示回复的筛选条件
      // @ts-ignore
      let filter = target.dataset.showReplies
      // 对应的筛选回调函数
      let filterFunc
      // 在对话列表上方显示的标题
      let title
      if (filter) {
        // @ts-ignore
        let author = target.closest("td").querySelector("strong .dark").innerText
        // @ts-ignore
        let floor = target.closest(".fr").querySelector(".no").innerText
        // 根据需要 @TA 的回复或 TA 的回复，筛选回复
        switch (filter) {
          case "its":
            filterFunc = (reply: Reply) => author === reply.member.username
            title = `${author} 的回复`
            break
          case "at_its":
            filterFunc = (reply: Reply) => reply.content.indexOf(`@${author}`) >= 0
            title = `@${author} 的回复`
            break
          default:
            console.log(this.TAG, `未知的筛选回复的条件：${filter}`)
            showMsg(`未知的筛选回复的条件：${filter}`, Msg.warning)
            return
        }
        // 筛选、显示回复
        this.filterShowReplies(filterFunc, (floorNo: number) => String(floorNo) === floor, title)

        event.preventDefault()
        event.stopImmediatePropagation()
      }
    })

    // 悬浮@用户时，显示对话列表
    // 定时器集合，用于实现悬浮操作，楼层号为其键
    let timers: { [floor: string]: NodeJS.Timer } = {}
    document.addEventListener("mouseover", event => {
      let target = event.target as HTMLLinkElement
      if (target.tagName === "A" && target.href.indexOf("/member/") >= 0
        && target.closest(".reply_content")) {
        target.style.cursor = "wait"
        // 在定时器内设置显示对话列表，并保存该定时器，用于取消定时
        // 注意 nodejs 和 chromium 中 setTimeout() 的返回值不同
        // @ts-ignore
        let floor = target.closest("td").querySelector(".no").textContent || ""
        timers[floor] = setTimeout(_ => {
          // @ts-ignore
          let author = target.closest("td").querySelector("strong a").textContent
          let atUser = target.innerText
          // @ts-ignore
          let floor = target.closest("td").querySelector(".fr .no").textContent
          // 显示相关回复
          // 从回复的数组中，筛选回复
          this.filterShowReplies((reply: Reply) => reply.member.username === atUser
              || (reply.member.username === author && reply.content.indexOf(`@${atUser}`) >= 0)
            , (floorNo: number) => String(floorNo) === floor, `与 @${atUser} 有关的回复`)
        }, this.delay)
      }
    })

    // 在指定时间内鼠标移出了目标，说明不是悬浮事件，需要取消、删除对应的定时器
    document.addEventListener("mouseout", event => {
      let target = event.target as HTMLLinkElement
      if (target.tagName === "A" && target.href.indexOf("/member/") !== -1
        && target.closest(".reply_content")) {
        // @ts-ignore
        let floor = target.closest("td").querySelector(".no").textContent || ""
        if (timers[floor]) {
          clearTimeout(timers[floor])
          delete timers[floor]
        }
      }
    })

    // 点击会话框上的#楼层，在原网页中会跳转到该楼层（翻页无效）
    document.addEventListener("click", event => {
      let target = event.target as HTMLElement
      let floor = target.dataset.floor
      if (floor) {
        let elems = Array.from<HTMLElement>(document.querySelectorAll(".no"))
          .filter((elem: HTMLElement) => elem.textContent === floor)
        // @ts-ignore
        elems[0].closest(".cell").scrollIntoView({behavior: "smooth"})

        event.preventDefault()
        event.stopImmediatePropagation()
      }
    })
  },

  /**
   * 筛选并显示回复
   * @param filterFunc 筛选的条件。传递两个参数：回复（为对象，包含发布者、头像等信息）、楼层号
   * @param isCurrentFunc 是否为点击当前回复出现的。传递一个参数（数字类型）：楼层号
   * @param title 标题
   */
  filterShowReplies: async function (filterFunc: (reply: Reply, floorNo: number) => boolean,
                                     isCurrentFunc: (floorNo: number) => boolean,
                                     title: string) {
    // 获取回复的模板
    let htmlURL = chrome.runtime.getURL("/htmls/v2ex_item.html")
    let resp = await request(htmlURL)
    let tpl = await resp.text()

    // 临时保存对话列表的html字符串
    let html = ""
    // 楼层号
    let floorNo = 0

    // 填充所有回复
    for (let reply of this.allReplies) {
      floorNo++
      // 从回复的数组中，提取需要的回复
      if (filterFunc(reply, floorNo)) {
        // 替换为大图
        let avatar = reply.member.avatar_large.replace("_mini.", "_large.")
          .replace("s=24", "s=48")
        // @ts-ignore
        html += tpl.format({
          avatar: avatar,
          author: reply.member.username,
          replyTag: isCurrentFunc(floorNo) ? "[当前]" : "",
          date: new Date(reply.created * 1000).toLocaleString('chinese', {hour12: false}),
          floor: floorNo,
          content: reply.content_rendered
        })
      }
    }

    // 设置标题
    // @ts-ignore
    this.commsDiv.firstElementChild.innerText = title
    // 设置内容
    // 判断是否有回复内容，没有则提示没有回复
    // @ts-ignore
    this.commsDiv.lastElementChild.innerHTML = html.trim() || "&nbsp没有符合要求的回复"
    this.commsDiv.style.display = "block"
  }
}

/**
 * 使用占位符格式化字符串
 *
 * let str = "js 实现用{two}自符串替换占位符{two} {three}  {one} ".format({one: "I",two: "LOVE",three: "YOU"});
 * let str2 = "js 实现用{1}自符串替换占位符{1} {2}  {0} ".format("I","LOVE","YOU");
 * @see https://blog.csdn.net/qq_23616601/article/details/77481516
 */
// @ts-ignore
String.prototype.format = function (args: Array<string>) {
  if (arguments.length === 0) return this
  let param = arguments[0]
  let s = this
  if (typeof (param) == 'object') {
    for (let key in param)
      if (param.hasOwnProperty(key)) {
        s = s.replace(new RegExp("\\{" + key + "\\}", "g"), param[key])
      }
    return s
  } else {
    for (let i = 0; i < arguments.length; i++)
      s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i])
    return s
  }
}

const deal = async function () {
  let data = await chrome.storage.sync.get({settings: {}})
  if (data.settings.enableV2ex === false) {
    console.log(V2ex.TAG, "根据设置 已禁用该网站上的扩展功能")
    return
  }

  // 网页加载出错
  if (!document.styleSheets[0]) {
    console.log(V2ex.TAG, "网页加载出错，退出执行扩展功能")
    return
  }

  // 本扩展开始工作
  // 处理首页
  if (V2ex.regNeedDealPages.test(window.location.pathname)) {
    V2ex.dealTopicList()
    return
  }

  // 处理帖子详情页
  if (window.location.pathname.indexOf("/t/") === 0) {
    V2ex.initCommsPanel()
  }
}

// 执行
deal()
