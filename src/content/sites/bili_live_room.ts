// 扩展哔哩哔哩直播间的功能

import {sleep} from "do-utils"

const TAG = "[BL_LIVE]"

// 更改聊天列表、输入框的样式
// 添加按空格键暂停、播放
const deal = async function () {
  console.log(TAG, "即将改进直播间的功能")
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
  let fun = (event: KeyboardEvent) => {
    if (event.code === "Space") {
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
  doc?.addEventListener("keydown", fun, true)
  document.addEventListener("keydown", fun, true)

  console.log(TAG, "已完成添加功能")
}

// 执行
deal()