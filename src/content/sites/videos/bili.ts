// B站 视频扩展

import {VideoBase, VideoType} from "./basic"
import {EN_BILI} from "../../../pages/options/Options"
import {insertJSSrc, waitForElem} from "do-utils/dist/elem"

// B站 视频扩展
class Bili extends VideoBase {
  protected readonly TAG = "[Bili]"
  protected readonly site = "bili"
  protected readonly widgetStyle = {
    "color": "#FFFFFF",
    "background-color": "#fb7299",
    "box-shadow": "0 6px 10px 0 rgba(251,114,153,0.4)",
    "border": "1px solid #fb7299"
  }

  async getVideoExtraInfo(): Promise<VideoType.Extra> {
    // 获取、设置视频的 id 和 bvid
    // 扩展脚本内无法直接访问网站脚本的 window 对象，所以向 DOM 中插入 JS 来访问
    insertJSSrc(chrome.runtime.getURL("/scripts/get_bili_bvid.js"))

    // 等待内嵌JS代码创建包含信息的元素
    await waitForElem("#doi-video-info")
    let elem = document.querySelector("#doi-video-info") as HTMLInputElement
    let data = JSON.parse(elem.value)
    return {
      id: data.id,
      bvid: data.bvid,
      cover: data.cover,
      name: data.name
    }
  }

  nextEpisodeElem(): HTMLElement | null {
    return document.querySelector(".bilibili-player-video-btn-next")
  }

  async onVideoPlay() {
    // 默认选择宽屏模式
    let widescreenEle = this.$(".bilibili-player-video-btn-widescreen") as HTMLElement
    if (widescreenEle && widescreenEle.className.indexOf(" closed") === -1) {
      console.log(this.TAG, "开启宽屏观看")
      widescreenEle.click()
    }

    // 优先 跳到上次播放处
    let jump = this.$(".bilibili-player-video-toast-item-jump") as HTMLElement
    if (jump) {
      jump.click()
      return
    }

    // 其次 跳过片头尾等
    super.onVideoPlay()
  }
}

const deal = async () => {
  let data = await chrome.storage.sync.get({settings: {}})
  if (data.settings[EN_BILI] === false) {
    console.log("[Bili]", "根据设置 已禁用哔哩哔哩视频扩展")
    return
  }

  let bili = new Bili()
  bili.start()
}

// 执行
deal()