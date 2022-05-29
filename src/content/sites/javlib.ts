// 扩展 Javlib 的功能
import {copyText, elemOf, Msg, showMsg} from "do-utils/dist/elem"

const Javlib = {
  TAG: "[Javlib]",
  // 本地后台服务地址
  host: "http://127.0.0.1:58000",
  // 默认的广告评论的关键字，以半角逗号","分隔
  ADS_TEXT: "點擊進入,点击进入,點擊下載,点击下載,点击下载,点此下载,点击此处,极速下载,可离线,无需等待,無需等待",

  // 在番号的详情页面添加的功能
  // 添加扩展链接的功能
  addExtLink: async function () {
    console.log(this.TAG, "扩展功能：添加超链接")
    // 番号详情页
    let fanhaoNode = document.querySelector("#video_id .text") as HTMLElement
    fanhaoNode.style.cursor = "pointer"
    fanhaoNode.classList.add("genre")
    // 提取番号名
    let fanhao = fanhaoNode.textContent || ""

    // 在右侧的 video id 旁边添加链接
    let videoIDElem = document.querySelector("#video_id")
    if (!videoIDElem) {
      console.log(this.TAG, "添加超链接出错：没有找到 video id 的元素")
      showMsg("扩展添加超链接出错", Msg.warning)
      return
    }

    videoIDElem.after(elemOf(
      `<div id='javbus' class='item'><table><tr>
<td class='header'>扩展链接: </td>
<td class='text genre'><a href='https://www.javbus.com/${fanhao}' target='_blank'>Javbus</a></td>
<td class='text genre'><a href='#' target='_blank' id="sht">SeHuaT</a></td>
<td class='text genre'><a href='https://www.google.com/search?q=site:t66y.com ${fanhao}' target='_blank'>T66y</a></td>
<td class='text genre'><a href='https://cn.bt4g.org/search/${fanhao}' target='_blank'>BT4G</a></td>
<td class='text genre'><a href='javascript:void(0);' id='querySubtitle' data-path="">Subtitle</a></td>
</tr></table></div>`))

    // 字幕按钮
    let querySubtitleElem = document.querySelector("#querySubtitle") as HTMLElement
    // 如果存在字幕，点击打开文件夹
    querySubtitleElem.onclick = () => {
      if (querySubtitleElem.dataset.path) {
        chrome.runtime.sendMessage({
          cmd: "cors",
          url: `${this.host}/api/openfile`,
          data: {method: "show", path: querySubtitleElem.dataset.path}
        })
      } else {
        // 没有在本地找到字幕，打开 Google 查找
        window.open(`https://www.google.com/search?q=${fanhao} (ass|srt)`, "_blank")
      }
    }

    // 查询本地是否存在字幕
    let url = `${this.host}/api/fanhao/subtitle`
    let msg = {cmd: "cors", url: url, data: {fanhao: fanhao}}
    chrome.runtime.sendMessage(msg, resp => {
      let result = JSON.parse(resp.text)
      // 出错了
      if (result["errcode"] !== 0) {
        console.log(this.TAG, "查找字幕出错：", resp.text)
        showMsg(`查找字幕出错：${result.msg}`, Msg.error)
        return
      }

      // data 为字幕数组，存在 data 表示本地存在其字幕文件，并将第一个字幕文件设为路径，以供打开文件夹
      if (result.data && result.data.length >= 1) {
        querySubtitleElem.dataset.path = result.data[0]
        querySubtitleElem.title = "本地存在字幕，点击打开文件夹"
        querySubtitleElem.style.color = "#008800"
      }
    })

    // 如果本地存在影片，则将右侧番号变色以标识
    // 番号详情页，只传递一个键值对
    this.existLocalFiles({[fanhao]: fanhaoNode})

    // 设置色花堂的 href
    this.addSHT(fanhao)
  },

  // 右击右侧的演员名时，搜索该演员
  addSearchLink: async function () {
    console.log(this.TAG, "扩展功能：右击演员名时搜索")
    // 可能有多个演员参演
    let starsNode = document.querySelectorAll(".cast .star a")
    if (starsNode.length === 0) {
      showMsg("演员列表为空，无法添加搜索链接", Msg.warning)
      return
    }
    // 遍历演员列表，逐个注册右击搜索事件
    for (const item of starsNode) {
      const elem = item as HTMLElement
      elem.title = `右键单击可搜索 ${elem.innerText}`
      // 只用到右键，不必用onmouse*事件
      elem.oncontextmenu = event => {
        let keyword = (event.target as HTMLElement).textContent
        window.open(`https://www.google.com/search?q=${keyword}`, "_blank")
        event.preventDefault()
      }
    }
  },

  /**
   * 在右侧添加色花堂搜索按钮的
   * 因为跨域限制，只能在后台脚本中发送请求获取链接后，再设置为该按钮元素的 href
   * @param keyworkd 搜索关键字（番号）
   */
  addSHT: function (keyworkd: string) {
    // discuz!的搜索规则，先访问搜索API获取formhash，再根据该formhash创建搜索链接，打开该链接即可查看结果
    // 先获取formhash，以创建请求
    let msg = {cmd: "cors", url: "https://www.sehuatang.org/search.php"}
    chrome.runtime.sendMessage(msg, resp => {
      let m = resp.text.match(/<input.*?formhash.*?value="(\w+)"/)
      if (m.length <= 1) {
        console.log(this.TAG, "添加色花堂搜索按钮时出错：", resp.text)
        showMsg("添加色花堂搜索按钮时出错", Msg.warning)
        return
      }

      // 再创建搜索记录
      let msg = {
        cmd: "cors",
        url: "https://www.sehuatang.org/search.php?mod=forum",
        data: `formhash=${m[1]}&srchtxt=${keyworkd}&searchsubmit=yes`
      }
      chrome.runtime.sendMessage(msg, resp => {
        (document.querySelector("#sht") as HTMLLinkElement).href = resp.url
      })
    })
  },

  /**
   * 如果本地存在影片，则将番号变色以标识，左击时将打开所在的文件夹；同时右击可复制番号
   *
   * 此方法可一次传递多个番号，在浏览影片列表时会用到
   * @param fanhaosObj 键为番号、值为 HTMLElement 的键值对对象
   */
  existLocalFiles: function (fanhaosObj: { [fanhao: string]: HTMLElement }) {
    let url = `${this.host}/api/fanhao/exist`
    // 查询本地文件时，只传递番号列表即可
    let fanhaos = Object.keys(fanhaosObj)
    chrome.runtime.sendMessage({cmd: "cors", url: url, data: fanhaos}, resp => {
      // 解析
      let results = JSON.parse(resp.text)
      if (results.errcode !== 0) {
        showMsg("查找本地是否存在该影片时出错", Msg.error)
        console.log(this.TAG, "查找本地是否存在该影片时出错：", resp.text)
        return
      }

      // 遍历查找的结果
      for (let fanhao of fanhaos) {
        fanhaosObj[fanhao].title = "右击复制番号"
        // 存在番号文件时，利用参数中元素的引用来修改样式
        if (results.data[fanhao]) {
          fanhaosObj[fanhao].title = "本地存在该影片，左击打开文件夹；右击复制番号"
          fanhaosObj[fanhao].style.background = "#99CC66"
          // 元素为 block 级才能设置边距、长宽等属性
          fanhaosObj[fanhao].style.display = "inline-block"
          fanhaosObj[fanhao].style.padding = "3px"
        }

        // 右击番号可复制，左击时若存在该影片就打开所在地文件夹
        // 注意onmouse*事件和 onclick、oncontextmenu 是分开触发的，由于已在 onmouse* 事件中处理了左右点击事件，
        // 为避免触发后两者，手动注册后 preventDefault
        fanhaosObj[fanhao].onclick = (e) => e.preventDefault()
        fanhaosObj[fanhao].oncontextmenu = (e) => e.preventDefault()

        // onclick事件无法捕获右击，所以用onmouse*事件
        fanhaosObj[fanhao].onmouseup = (event: MouseEvent) => {
          if (event.button === 2) {
            copyText(document, fanhao)
            showMsg(`已复制番号"${fanhao}"`, Msg.success)
          } else if (event.button === 0 && results.data[fanhao]) {
            chrome.runtime.sendMessage({
              cmd: "cors",
              url: `${this.host}/api/openfile`,
              data: {method: "show", path: results.data[fanhao]}
            })
          }
        }
      }
    })
  },

  // 功能
  // 隐藏广告评论
  hideRubbishComments: async function () {
    console.log(this.TAG, "扩展功能：隐藏垃圾评论")
    // 获取广告屏蔽样本，格式如下："广告1|广告2|广告3"
    let ads = (await chrome.storage.sync.get({settings: {javlibAds: ""}})).settings.javlibAds
    // 已屏蔽的广告条数
    let ban = 0
    // 遍历评论
    for (let elem of document.querySelectorAll(".comment .text")) {
      let adText = (elem.closest(".text") as HTMLElement).innerText
      if (!adText) {
        console.log(this.TAG, "目标元素的文本为 null，跳过匹配该元素的广告")
        continue
      }
      // 使用正则判断是否为广告
      // 注意不能为了性能将`new RegExp(ads)`放在循坏外，避免`lastIndex`偏移导致匹配不到广告的问题
      // 参考：https://www.cnblogs.com/52cik/p/js-regexp-test.html
      if (new RegExp(ads).test(adText)) {
        console.log(this.TAG, "将屏蔽", adText)
        let target = elem.closest(".comment") as HTMLElement
        target.style.display = "none"
        ban++
        // console.log(this.TAG, `已屏蔽广告文本：${adText}`)
      }
    }

    // 在评论栏顶部显示屏蔽了几条垃圾评论
    // 评论栏在番号详情页和评论详情页中不同，所以先后获取
    let titleNode = document.querySelector("#video_reviews .header") ||
      document.querySelector("#video_comments .header")
    let span = elemOf(`<span style="color: rgba(0,0,0,0.3)">（已屏蔽 ${ban} 条垃圾评论）</span>`)
    if (!titleNode) {
      console.log("评论栏元素不存在，无法显示垃圾评论的条数")
      showMsg("评论栏元素不存在", Msg.warning)
      return
    } else {
      titleNode.appendChild(span)
    }
  },

  // 点击楼中楼不跳转到回复框
  disableClickJump: function () {
    console.log(this.TAG, "扩展功能：禁止点击楼中楼时跳转到回复框")
    window.addEventListener("click", event => {
      if ((event.target as HTMLElement).className === "quote") {
        event.stopImmediatePropagation()
      }
    }, true)
  }
}

const deal = async function () {
  let data = await chrome.storage.sync.get({settings: {}})
  if (data.settings.enableJavlib === false) {
    console.log(Javlib.TAG, "根据设置 已禁用该网站上的扩展功能")
    return
  }

  // 番号列表页
  if (window.location.href.indexOf("/vl_") >= 0) {
    let fanhaosElems = document.querySelectorAll(".videos .id")
    // 以番号为键、番号所在的 HTMLElement 为值，作为参数传递，以判断本地是否已存在该番号的文件
    let fanhaoObjs: { [fanhao: string]: HTMLElement } = {}

    // 遍历获取番号和 HTMLElement
    for (let item of fanhaosElems) {
      let elem = item as HTMLElement
      if (!elem.textContent) {
        continue
      }
      fanhaoObjs[elem.textContent] = elem
    }
    // 一次传递多个键值对
    Javlib.existLocalFiles(fanhaoObjs)
  }

  // 番号详情页、评论页
  if (window.location.href.indexOf("/?v=") >= 0) {
    // 添加扩展链接的功能
    Javlib.addExtLink()
    // 添加搜索链接
    Javlib.addSearchLink()
    // 隐藏广告评论
    Javlib.hideRubbishComments()
    // 点击楼中楼不跳转到回复框
    Javlib.disableClickJump()
  }

  // 评论翻页
  if (window.location.pathname.indexOf("videocomments") >= 0) {
    // 隐藏广告评论
    Javlib.hideRubbishComments()
    // 点击楼中楼不跳转到回复框
    Javlib.disableClickJump()
  }
}

// 执行
deal()
