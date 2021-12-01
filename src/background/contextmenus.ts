// 创建上下文菜单

import qrcodeParser from "qrcode-parser"
import {copyTextInBG} from "do-utils"
import {request} from "do-utils/dist/utils"

/**
 * 优先选择文本数据
 * 优先级：已选择的文本、悬浮的超链接的URL、悬浮的含src属性的元素的src、当前页面的URL
 * @param  info 点击上下文菜单项时 chromium 传递来的数据
 * @return 返回选择的文本
 */
const selectedText = function (info: chrome.contextMenus.OnClickData): string {
  return info.selectionText || info.linkUrl || info.srcUrl || info.pageUrl || ""
}

// 点击菜单事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "baidu":
      chrome.tabs.create({url: `https://www.baidu.com/s?wd=${info.selectionText}`})
      break

    case "douban":
      chrome.tabs.create({
        url: `https://search.douban.com/movie/subject_search?search_text=${info.selectionText}`
      })
      break

    case "incognito":
      chrome.windows.create({
        url: `https://google.com/search?q=${info.selectionText}`,
        incognito: true,
        state: "maximized"
      })
      break

    case "qrcode_gen":
      if (!tab || !tab.id) {
        console.log("生成二维码出错：tab id 为空：", tab)
        alert("生成二维码出错：tab id 为空")
        break
      }

      // 获取需要生成二维码的文本
      let selected = selectedText(info)

      // 先注入依赖脚本
      await chrome.scripting.executeScript({
        target: {tabId: tab.id, allFrames: true},
        files: ["/scripts/gen_qrcode.js"]
      })
      chrome.scripting.executeScript({
        target: {tabId: tab.id, allFrames: true},
        // @ts-ignore
        func: (text) => window.genQRCode(text),
        args: [selected]
      })
      break

    case "qrcode_parse":
      let data: Blob = new Blob()
      // 如果为图片地址，先下载再转为 File 来解析
      if (info.srcUrl) {
        console.log("待解析二维码的地址：", info.srcUrl)
        let resp = await request(info.srcUrl)
        let blob = await resp.blob()
        data = new File([blob], "qrcode")
      }

      // input should be File object, image url, image base64
      await qrcodeParser(data).then(text => {
        console.log("已解析二维码为：", text)
        // 复制文本到剪贴板
        copyTextInBG(text || "")
      }).catch(e => {
        console.log("解析二维码出错：", e)
        return
      })
      break

    case "markdown":
      if (!tab || !tab.id || !tab.title || !tab.url) {
        console.log("生成Markdown出错：tab 信息为空：", tab)
        alert("生成Markdown出错：tab 信息为空")
        break
      }
      copyTextInBG(`[${tab.title}](${tab.url})`)
      break
  }
})

// 扩展图标上添加上下文菜单
// 似乎图标的上下文菜单的数量最多为6个（包括分隔符"separator"）
export const initCtxMenu = function () {
  // 百度
  chrome.contextMenus.create({id: "baidu", title: '百度"%s"', contexts: ["selection"]})

  // 豆瓣
  chrome.contextMenus.create({id: "douban", title: '豆瓣"%s"', contexts: ["selection"]})

  // 无痕模式下搜索
  chrome.contextMenus.create({id: "incognito", title: '无痕搜索"%s"', contexts: ["selection"]})

  // 生成二维码
  chrome.contextMenus.create({
    id: "qrcode_gen",
    title: '生成二维码',
    contexts: ["page", "selection", "link", "image", "video", "audio"]
  })

  // 解析二维码
  chrome.contextMenus.create({id: "qrcode_parse", title: '解析二维码', contexts: ["image"]})

  // 复制网址为 Markdown 的超链接
  chrome.contextMenus.create({
    id: "markdown",
    title: '🔗 复制为 Markdown 链接',
    contexts: ["action"]
  })
}