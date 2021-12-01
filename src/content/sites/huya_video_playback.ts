// 扩展虎牙比赛回放页面的功能

const TAG = "[HY_PB]"

const deal = async function () {
  console.log(TAG, "扩展功能：点击“定位到当前播放”时，将聚焦到当前播放的视频")
  // 标题栏，用于获取放置按钮的容器
  let titleElem = document.querySelector(".J_matchTitle")
  if (!titleElem) {
    console.log(TAG, "标题元素为空，无法扩展定位到当前播放都功能")
    return
  }

  // 添加触发按钮
  let playingDiv = document.createElement("div")
  playingDiv.innerText = "定位到当前播放"
  playingDiv.style.marginTop = "10px"
  playingDiv.style.cursor = "pointer"
  playingDiv.style.color = "#f80"
  // 聚焦到当前播放的视频
  playingDiv.onclick = () => {
    // 元素的focus()方法，只对 input、button、a 等可聚焦的元素生效，
    // div 等元素需要设置 tabIndex 属性让其可聚焦才会生效
    // @see 一行JS实现滚动到页面某个元素所在位置：https://www.cnblogs.com/jimaww/p/10007433.html
    let current = document.querySelector(".video-current") as HTMLElement
    if (current) {
      // 先展开右侧的视频列表
      current.click()
      current.tabIndex = -1
      current.focus()
    }
  }
  titleElem.parentNode?.appendChild(playingDiv)
}

// 执行
deal()

export {}