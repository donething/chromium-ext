// 扩展斗鱼直播间的功能

import {waitForElem} from "do-utils"

const TAG = "[DY_LIVE]"

const deal = async function () {
  console.log(TAG, "扩展直播间的功能")

  // 按空格键可暂停、播放
  console.log(TAG, "按空格键可暂停、播放")
  let fun = (event: KeyboardEvent) => {
    let video = document.querySelector("video")
    if (event.code === "Space" && video) {
      video.paused ? video.play() : video.pause()
      event.stopImmediatePropagation()
      event.preventDefault()
      return false
    }
  }
  document.addEventListener("keydown", fun, true)

  // 隐藏每周粉丝贡献排行
  console.log(TAG, "隐藏每周粉丝贡献排行")
  await waitForElem(".FansRankList")
  let rank = document.querySelector(".layout-Player-rank") as HTMLElement
  rank.style.zIndex = "-1"
  // 摆放元素，以在隐藏其它元素时占用空白空间
  let barrage = document.querySelector(".layout-Player-barrage") as HTMLElement
  barrage.style.top = getComputedStyle(rank, null).top

  console.log(TAG, "已完成添加功能")
}

// 执行
deal()