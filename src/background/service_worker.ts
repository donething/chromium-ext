import {request} from "do-utils/dist/utils"
import {initCtxMenu} from "./contextmenus"
import {notify} from "do-utils/dist/elem"
import RuleActionType = chrome.declarativeNetRequest.RuleActionType
import ResourceType = chrome.declarativeNetRequest.ResourceType
// 在第三方浏览帖子的扩展的名字
const EXT_VIEW_TOPICS = "Chromium Tasks"

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

    // 浏览V2ex主题
    // chrome.runtime.sendMessage({cmd: "viewTopic", tid: tid})
    case "viewTopic":
      viewTopic(req.tid)
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
      return
    }

    // 在 Alist 播放页面，下载播放列表
    if (url.host === "localhost:5244" || url.host === "127.0.0.1:5244") {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ["/static/js/alist.js"]
      })
      return
    }
  }
})

// 初始化上下文菜单
chrome.runtime.onInstalled.addListener(() => {
  initCtxMenu()

  initDeclarativeNet()
})

/**
 * 浏览主题
 * @param tid 主题的 ID
 */
const viewTopic = async (tid: string) => {
  let exts = await chrome.management.getAll()
  let index = exts.findIndex(value => value.name === EXT_VIEW_TOPICS)
  if (index === -1) {
    console.log("无法浏览主题：无法找到第三方扩展", EXT_VIEW_TOPICS)
    return
  }

  chrome.tabs.create({url: `chrome-extension://${exts[index].id}/index.html#/view_topic?tid=${tid}`})
}

/**
 * 重定向
 */
const initDeclarativeNet = () => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: RuleActionType.REDIRECT,
          redirect: {
            // '\0' 代表正则匹配的结果
            regexSubstitution: "https://imgoo.deno.dev/\\0",
          }
        },
        condition: {
          // 需要指定图片格式，否则循环重定向
          regexFilter: "(^https://.*\\.(jpg|jpeg|png|gif))",
          isUrlFilterCaseSensitive: false,
          // 对网页中引用的图片需要 ResourceType.IMAGE
          resourceTypes: [ResourceType.MAIN_FRAME, ResourceType.SUB_FRAME, ResourceType.IMAGE]
        }
      }
    ]
  }, () => console.log("declarativeNetRequest 失败：", chrome.runtime.lastError))
}