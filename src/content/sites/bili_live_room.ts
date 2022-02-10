// 扩展哔哩哔哩直播间的功能

import {sleep} from "do-utils"
import {isInputElem} from "../../comm/utils"

const TAG = "[BL_LIVE]"

// 禁止偶尔弹出当前的分区排名
// 参考：https://stackoverflow.com/a/52048042/8179418
const banHotRank = function () {
  //create callback function to execute when changes are observed
  let banFun = function (records: MutationRecord[]) {
    let iframes = (records[0].target as HTMLElement).querySelectorAll("iframe")
    if (iframes.length <= 1) {
      return
    }

    let iframe = iframes[1]
    // 分区排名的URL如"https://live.bilibili.com/p/html/live-app-hotrank/result.html"
    if (iframe.src.indexOf("live-app-hotrank") >= 0) {
      console.log(TAG, "已屏蔽弹窗：当前的分区排名")
      iframe.style.display = "none"
    }
  }

  //Create an observer instance linked to the callback function
  let observer = new MutationObserver(banFun)

  // Start observing the target node for configured mutations(changes)
  observer.observe(document.body, {attributes: true, childList: true, subtree: false})

  // Later, you can stop observing
  //observer.disconnect();
}

// 更改聊天列表、输入框的样式
// 添加按空格键暂停、播放
const deal = async function () {
  console.log(TAG, "即将改进直播间的功能")
  // 禁止偶尔弹出当前的分区排名
  banHotRank()

  // 排名面板
  let rankPanel
  let chatPanel
  let chatInput
  let doc

  // 等待元素加载完成
  while (true) {
    // 判断元素是否在iframe中
    let frames = document.querySelectorAll("iframe")
    doc = frames.length <= 1 ? document : frames[1].contentDocument
    // 选择元素
    rankPanel = doc?.querySelector(".rank-list-section") as HTMLElement
    chatPanel = doc?.querySelector("div.chat-history-panel") as HTMLElement
    chatInput = doc?.querySelector("div.chat-control-panel") as HTMLElement

    // 已加载完，跳出循环
    if (rankPanel && chatPanel && chatInput) {
      console.log(TAG, "必要元素已加载完成")
      break
    }
    // 没有加载完，继续等待
    console.log(TAG, "等待必要的元素加载完成（每300毫秒）")
    await sleep(300)
  }

  // 添加功能
  console.log(TAG, "开始添加功能")

  // 隐藏粉丝贡献排行
  console.log(TAG, "隐藏粉丝贡献排行")
  rankPanel.style.display = "none"

  // 弹幕列表
  console.log(TAG, "更改右侧弹幕列表的背景")
  chatPanel.style.background = "rgba(1,1,1,0.9)"
  chatPanel.style.setProperty("height", `calc(100% - ${chatInput.offsetHeight}px)`)

  // 弹幕输入框
  console.log(TAG, "更改弹幕输入框的背景")
  chatInput.style.filter = "brightness(0.5)"

  // 按空格键暂停、播放
  console.log(TAG, "按空格键可暂停、播放")
  let videoEvent = (event: KeyboardEvent) => {
    if (event.code === "Space" && !isInputElem(event.target as HTMLElement)) {
      let frames = document.querySelectorAll("iframe")
      doc = frames.length <= 1 ? document : frames[1].contentDocument
      let video = doc?.querySelector("video")
      if (!video) {
        console.log(TAG, "video 元素为空，退出设置暂停、播放")
        return
      }

      video.paused ? video.play() : video.pause()
      event.stopImmediatePropagation()
      event.preventDefault()
      return false
    }
  }
  // 获取 video 元素略复杂，所以选择监听 document 对象
  doc?.addEventListener("keydown", videoEvent, true)
  document.addEventListener("keydown", videoEvent, true)

  console.log(TAG, "已完成添加功能")
}

// 执行
deal()