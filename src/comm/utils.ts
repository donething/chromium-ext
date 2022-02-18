const TAG = "[CEXT]"

/**
 * 判断当前元素是否为输入框（Input、Textarea）
 * @param elem 目标元素
 */
export const isInputElem = (elem: HTMLElement): boolean => {
  return elem.tagName === "TEXTAREA" || elem.tagName === "INPUT"
}

/**
 * 返回网页中的 Video 元素，查询范围包括 document、iframe、shadow dom 等容器
 * @param doc 需查找的 Document 对象
 * @param selector 当 Video 元素在 iframe、shadow dom 中时，可指定选择器查找
 * @param shadowSelector 如果需要在 shadow dom 中查找，需要指定其的选择器
 */
export const findVideo = (doc: Document, selector?: string,
                          shadowSelector?: string): HTMLVideoElement | null => {
  let target = selector || "video"

  // 优先从首层 document 中查找元素
  let v = document.querySelector(target)
  if (v) {
    return v as HTMLVideoElement
  }


  // 首层中没有找到时，从所在 iframe 中查找
  let iframes = document.querySelectorAll("iframe")
  for (const f of iframes) {
    // 跳过和网站不同域名的 iframe，以免访问时报错"cross-origin frame"
    if (document.location.host !== new URL(f.src).host) {
      // console.log(TAG, "跳过查找该 iframe 内的 Video 元素：域名不匹配")
      continue
    }
    if (!f.contentWindow) {
      // console.log(TAG, "跳过查找该 iframe 内的 Video 元素：contentWindow 对象为空")
      continue
    }

    v = f.contentWindow.document.querySelector(target)
    // 已找到，退出查找
    if (v) {
      return v as HTMLVideoElement
    }
  }

  // 从 iframe 中也没有找到时，从 shadow dom 中查找
  let allNodes = document.getElementsByTagName("*")
  for (let i = 0; i < allNodes.length; i++) {
    try {
      // @ts-ignore
      let shadowRoot = chrome.dom.openOrClosedShadowRoot(allNodes[i])
      if (shadowRoot) {
        return shadowRoot.querySelector(target) as HTMLVideoElement
      }
    } catch (e) {
      // nothing
    }
  }

  return null
}