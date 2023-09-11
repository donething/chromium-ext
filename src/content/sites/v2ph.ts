// 微图坊 https://www.v2ph.com/

const TAG = "[V2PH]"

// 禁用图集页面的延迟加载图片
const disableLazyLoad = () => {
  // 图集的列表（模特页面）、图集中图片的列表（图集详情页面）
  const imgs: NodeListOf<HTMLImageElement> = document.querySelectorAll(".albums-list,.photos-list img")
  for (let img of imgs) {
    if (!img.dataset["src"]) {
      console.log(TAG, "无法禁用懒加载图片：图集的'data-src'数据为空")
      return
    }

    img.src = img.dataset["src"]
    // 必须用 delete，而不能赋值为 undefined，否则会设置字符串"undefined"
    delete img.dataset["src"]
  }
}

const start = () => {
  const path = window.location.pathname
  if (path.startsWith("/album/") || path.startsWith("/actor/")) {
    console.log(TAG, "禁用图集页面中延迟加载图片")
    disableLazyLoad()
  }
}

start()

export {}