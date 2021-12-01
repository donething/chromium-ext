// 扩展虎牙直播间的功能

const TAG = "[HY_LIVE]"

// 虎牙默认使用 canvas ，切换清晰度能转为使用 video
// 按空格键播放、暂停
const deal = async function () {
  console.log(TAG, "扩展直播间的功能")
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
}

// 执行
deal()

export {}