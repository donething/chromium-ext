// 扩展斗鱼直播间的功能

import {waitForElem} from "do-utils"

const TAG = "[DY_LIVE]"

const deal = async function () {
  console.log(TAG, "扩展直播间的功能")

  // 当焦点在视频元素上时，按空格键可暂停、播放
  let player = document.querySelector("div.layout-Player-video")
  if (player && player instanceof HTMLElement) {
    player.addEventListener("keydown", (event: KeyboardEvent) => {
      let video = document.querySelector("video")
      if (!video) {
        console.log(TAG, "视频元素为空，无法执行播放、暂停操作")
        return
      }
      if (event.code === "Space") {
        video.paused ? video.play() : video.pause()
        event.stopImmediatePropagation()
        event.preventDefault()
        return false
      }
    }, true)
  } else {
    console.log(TAG, "视频所在元素为空，无法设置事件")
  }

  // 隐藏每周粉丝贡献排行
  console.log(TAG, "隐藏每周粉丝贡献排行")
  await waitForElem(".FansRankList")
  let rank = document.querySelector("div.layout-Player-rank") as HTMLElement
  rank.style.zIndex = "-1"
  // 摆放元素，以在隐藏其它元素时占用空白空间
  let barrage = document.querySelector("div.layout-Player-barrage") as HTMLElement
  barrage.style.top = getComputedStyle(rank, null).top

  console.log(TAG, "已完成添加功能")
}

// 执行
deal()