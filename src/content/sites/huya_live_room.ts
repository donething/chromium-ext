// 扩展虎牙直播间的功能

import {isInputElem} from "../../comm/utils"

const TAG = "[HY_LIVE]"

// 虎牙默认使用 canvas ，切换清晰度能转为使用 video
// 按空格键播放、暂停
const deal = async function () {
  console.log(TAG, "扩展直播间的功能")

  // 当焦点在视频元素上时，按空格键可暂停、播放
  // 因为在虎牙网页中点击时，点击目标一直是 document.body，而不是更具体的 video 元素，
  // 所以只好在 document 中监听事件，然后排除输入框
  document.addEventListener("keydown", (event: KeyboardEvent) => {
    let video = document.querySelector("video")
    if (!video) {
      console.log(TAG, "视频元素为空，无法执行播放、暂停操作")
      return
    }
    if (event.code === "Space" && !isInputElem(event.target as HTMLElement)) {
      video.paused ? video.play() : video.pause()
      event.stopImmediatePropagation()
      event.preventDefault()
      return false
    }
  }, true)
}

// 执行
deal()

export {}
