import {request} from "do-utils/dist/utils"
import {initCtxMenu} from "./contextmenus"
import {notify} from "do-utils/dist/elem"

// 后台脚本
/**
 * 消息接收 runtime.onMessage、网页更新 tabs.onUpdated、网络请求 webRequest.onBeforeRequest
 * 注意：该监听器结束运行时，sendResponse 回调将失效，除非 return true，以异步发送响应
 * @see https://stackoverflow.com/a/45092821
 */
chrome.runtime.onMessage.addListener((req, _, sendResponse) => {
  console.log("[SW] 收到消息：", req)
  switch (req.cmd) {
    // 接收需要弹出通知的消息
    // 发送消息需要传递的参数，如：
    // chrome.runtime.sendMessage({cmd: "notification", options: options, callbacks: callbacks})
    case "notification":
      notify(req.options, req.callbacks)
      break

    // 打开新标签
    // chrome.runtime.sendMessage({cmd: "newtab", url: url})
    case "newtab":
      chrome.tabs.create({url: req.url})
      break

    // 进行跨域请求
    // chrome.runtime.sendMessage({cmd: "cors", url: url, data: data})
    case "cors":
      request(req.url, req.data).then(async response => {
        // 回调不能直接传递 response，也能能在对象中含 arrayBuffer，否则对面收到的是空对象：{}
        sendResponse({
          ok: response.ok,
          url: response.url,
          status: response.status,
          text: await response.text()
        })
      }).catch(error => sendResponse(error))

      // 必须返回 true，表示异步发送响应，否则会触发：
      // The message port closed before a response was received.
      return true

    // 没有匹配到 cmd 时
    default:
      console.log("[SW] 未知的消息", req)
  }
})

// 当网页更新时
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab || !tab.id || !tab.url) {
    // console.log("监听网页 onUpdated 出错，tab 缺少必要信息：", tab)
    return
  }

  let url = new URL(tab.url)

  // 网页开始导入时
  if (changeInfo.status === "loading") {
    if (url.host === "m.hupu.com") {
      // 虎扑
      let group = url.href.match(/bbs\/(.+)\.html/)
      if (group && group.length === 2) {
        let newURL = `https://bbs.hupu.com/${group[1]}.html`
        console.log(`重定向 ${url.href} 到 ${newURL}`)
        chrome.tabs.update(tabId, {url: newURL})
        return
      }

      console.log(`无法重定向，匹配出错：${url.href}`)
    } else if (/^https:\/\/zh\.(m\.)?wikipedia.org\/.*$/.test(url.href)) {
      // 维基
      // 已是正确的网址时，不能重定向，否则会导致页面一直刷新
      // 仅当 URL 不为移动端端页面（即为 PC 端页面），且语言为简体中文时，不需重定向
      if (url.href.indexOf(".m.") === -1 && url.href.indexOf("/zh-cn/") > 0) {
        return
      }

      let key = url.href.substring(url.href.lastIndexOf("/") + 1)
      let newURL = `https://zh.wikipedia.org/zh-cn/${key}`
      console.log(`重定向 ${url.href} 到 ${newURL}`)
      chrome.tabs.update(tabId, {url: newURL})
      return
    }
  }

  // 网页完成导入时
  if (changeInfo.status === "complete") {
    // 因为哔哩哔哩自动播放下一集时，网页的 video 元素会变动，所以用 chrome.tabs.onUpdated 监听下一集
    if (url.host === "www.bilibili.com" && url.pathname !== "/") {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ["/static/js/bili_video.js"]
      })
    }
  }
})

// 初始化上下文菜单
chrome.runtime.onInstalled.addListener(() => {
  initCtxMenu()
})
