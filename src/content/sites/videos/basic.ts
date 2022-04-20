// 视频扩展的基类
// 所有子类视频扩展的数据都保存到 chromium storage 中键"fav_videos"之下，
// 因为保存数据的操作(chStorage中)都是即时读取该网站得视频信息后修改、保存，
// 所以理论**不用担心**在打开多个网站时，后来的修改会覆盖前一个网站上的修改的问题，
// 即当两个网站都读取、修改了数据，导致后一个保存操作会覆盖前一个保存操作，导致前一个的数据还是之前的数据的问题

import {request} from "do-utils/dist/utils"
import {isInputElem} from "../../../comm/utils"
import {elemOf, Msg, showMsg, waitForElem} from "do-utils/dist/elem"
import {parseSec} from "do-utils/dist/text"

// typescript 向内置对象声明属性
declare global {
  interface Window {
    VideoBase: object;
  }

// setInterval()的返回值，用于取消定时
  interface HTMLVideoElement {
    _updateInterval: NodeJS.Timeout
  }
}

// 在Window对象中声明属性，避免报没有该属性的错误
export declare namespace VideoType {
  // 片头尾时间信息
  // 避免损失精度，用字符串存储时间
  interface Time {
    open?: string
    end?: string
  }

  // 剧集的信息
  // 不同网站可额外添加其它属性，如B站的"bvid"（注意继承后适配）
  interface Extra {
    // 剧集的 id
    id: string,
    // 剧集名
    name: string,
    // 剧集的封面
    cover: string

    // 其它属性，如 B站的 bvid
    [key: string]: string
  }

  // 剧集的详细信息
  interface VideoInfo {
    extra?: Extra
    time?: Time
  }

  // 片头尾时间信息的项
  type TimeItem = "open" | "end"
}

// 对视频时间的操作
enum Operate {
  GET = "GET",
  SET = "SET",
  DEL = "DEL"
}

/**
 * 视频扩展的基类，子类中可以继承
 *
 * **必须重写** 属性 site，方法：onVideoPlay()、getVideoExtraInfo()
 */
export abstract class VideoBase {

  // 打印日志时区分来源
  protected readonly TAG: string = "[VBase]"
  // 存储数据到 chromium storage 的键，**子类中需要重写**，如"bili"
  protected readonly site: string = "video_base"
  // 快进、快退的秒数
  protected readonly step: number = 10
  // 添加的按钮 widget 的样式
  protected readonly widgetStyle: { [key: string]: string } = {}
  // 元素查询
  protected readonly $ = document.querySelector.bind(document)

  // 保存视频信息，当点击按钮设置片头尾时间时，除了保存数据到存储，还需要更新此变量，这样不用每次从存储从读取
  protected videoInfo: VideoType.VideoInfo = {}

  /**
   * 网页加载完毕时，调用执行初始化
   */
  async start() {
    console.log(this.TAG, "网页加载完毕，开始扩展功能")
    // 从 settings 中读取是否在该网站禁用了扩展功能
    let enable = (await chrome.storage.sync.get({settings: {[this.site]: {}}})).settings[this.site].enable
    if (enable === false) {
      console.log(this.TAG, "根据设置 已禁用该网站上的扩展功能")
      return
    }

    // 设置 video 事件，如快进快退
    this.setVideoEvent()

    // 提取信息
    let extra = await this.getVideoExtraInfo()
    console.log(this.TAG, "内容脚本获取到的视频信息：", extra)

    if (!extra.id) {
      console.log(this.TAG, "没有匹配到视频的ID，退出执行")
      showMsg("没有匹配到视频的ID，退出执行", Msg.warning)
      return
    }

    // 只需要在初始化时读取视频信息保存到变量中，不需要每次从存储中读取
    // 然后在需要在更新片头尾时间信息时（即点击设置时间戳的按钮），更新变量
    this.videoInfo = await this.chStorage(extra, Operate.GET, null, this.site)
    console.log(this.TAG, "从存储中读取的视频时间信息", this.videoInfo.time)

    // 添加组件
    this.addWidgets()
  }

  /**
   * 当视频播放时检测需执行的操作，如跳过片头尾。会由定时器周期调用
   *
   * 在子类中可以重写以添加功能，如跳到上次播放处
   *
   * 注意重写时调用 super.onVideoPlay() 的位置，以决定新功能的先后顺序
   */
  async onVideoPlay() {
    await waitForElem("video")
    let video = this.$("video") as HTMLVideoElement

    // 仅在影片从头开始播放时才跳过片头
    // 因无法保证 currentTime 一定为整数0（秒），需容错
    if (this.videoInfo.time?.open && video.currentTime < 3) {
      video.currentTime = parseFloat(this.videoInfo.time.open)
      console.log(this.TAG, `已跳过片头曲：${this.videoInfo.time.open}`)
      return
    }

    // 在存在下一集的情况下，跳过片尾
    let nextElem = this.nextEpisodeElem()
    if (nextElem && this.videoInfo.time?.end
      && video.currentTime + parseFloat(this.videoInfo.time.end) >= video.duration) {
      nextElem.click()
      console.log(this.TAG, `已跳过片尾曲：${this.videoInfo.time.end}`)
    }
  }

  /**
   * 绑定 video 元素的事件，如快进快退
   */
  async setVideoEvent() {
    console.log(this.TAG, "扩展功能：开始绑定 video 的事件，如快进快退")
    // 等待 video 元素加载完毕
    await waitForElem("video")

    let video = this.$("video")
    if (!video) {
      return
    }

    // 当视频开始播放时，间隔检测判断是否需要：跳到上次播放处、跳过片头片尾曲
    // 不使用"timeupdate"是为了实现更多的操作（暂停时停止检测、每秒检查一次而不是1秒内检查60次）
    video.addEventListener("play", e => {
      let v = e.target as HTMLVideoElement
      this.onVideoPlay()
      // 每隔指定时间检查是否需要跳转时间（即执行 onVideoPlay），当视频暂停时也将暂停检查
      v._updateInterval = setInterval(() => {
        this.onVideoPlay()
      }, 1000)
    })

    // 视频暂停时也暂停检测
    video.addEventListener("pause", (e) => {
      let v = e.target as HTMLVideoElement
      clearInterval(v._updateInterval)
    }, true)


    // 快捷键：方向键快进、快退、播放暂停
    window.addEventListener("keydown", e => {
      if (isInputElem(e.target as HTMLElement)) {
        return
      }

      let v = this.$("video") as HTMLVideoElement
      switch (e.code) {
        // 左方向键：快退
        case "ArrowLeft":
          v.currentTime = v.currentTime - this.step
          e.preventDefault()
          e.stopImmediatePropagation()
          break
        // 右方向键：快进
        case "ArrowRight":
          v.currentTime = v.currentTime + this.step
          e.preventDefault()
          e.stopImmediatePropagation()
          break
        // 空格键：暂停
        case "Space":
          v.paused ? v.play() : v.pause()
          e.preventDefault()
          e.stopImmediatePropagation()
          break
      }
    }, true)

    // 让其它可能干扰快进退的按键事件失效
    let keyeventNames = ["keyup", "keypress"]
    keyeventNames.forEach(name =>
      window.addEventListener(name, event => {
        let e = event as KeyboardEvent
        if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault()
          e.stopImmediatePropagation()
        }
      }, true)
    )
  }

  /**
   * 向网页中添加设置片头尾时间的面板
   *
   * 默认在页面右边，可在子类中重写
   */
  async addWidgets() {
    console.log(this.TAG, "扩展功能：添加设置片头尾时间的面板")
    // 如果已存在按钮，则先移除，以更新时间信息
    let timeDiv = this.$("#doi-video-panel") as HTMLElement
    if (timeDiv) {
      timeDiv.parentNode?.removeChild(timeDiv)
    }

    // 添加面板
    let htmlURL = chrome.runtime.getURL("/htmls/video-panel.html")
    let resp = await request(htmlURL)
    timeDiv = elemOf(await resp.text()) as HTMLElement
    // 设置自定义的样式
    for (const [key, value] of Object.entries(this.widgetStyle)) {
      // @ts-ignore
      timeDiv.style[key] = value
    }

    // 根据已设置的片头尾秒数生成标题
    let genTitle = (seconds: string) => {
      let tip = "左击设置，右击删除"
      return (seconds ? `${parseSec(parseFloat(seconds), true)} (${seconds} 秒)` : "还未设置") + `\n${tip}`
    }
    // children[1]为隔离元素
    (timeDiv.children[0] as HTMLElement).title = genTitle(this.videoInfo.time?.open || "");
    (timeDiv.children[2] as HTMLElement).title = genTitle(this.videoInfo.time?.end || "")

    // 点击了设置片头尾按钮，设置视频片头尾时间
    let onDealTime = (event: MouseEvent) => {
      // 没有该视频的 extra 信息，就无法获取到该视频的时间信息
      if (!this.videoInfo.extra) {
        return
      }

      let target = event.target as HTMLElement
      // 根据自定义数据获取当前按下的是 open 还是 end 按钮
      let type: VideoType.TimeItem = target.dataset.type as VideoType.TimeItem

      let video = this.$("video") as HTMLVideoElement
      if (!video) {
        console.log(this.TAG, "video 元素为空，无法获取视频时间、设置片头尾")
        showMsg("video 元素为空，无法获取视频时间", Msg.warning)
        return
      }

      // 是设置还是移除（左击设置，右击删除）
      switch (event.button) {
        case 0:
          // 是片头还是片尾时间（toFixed()返回 String 类型的数据）
          let cTime = type === "open" ? video.currentTime.toFixed(2) :
            (video.duration - video.currentTime).toFixed(2)
          if (!this.videoInfo.time) {
            this.videoInfo.time = {}
          }
          this.videoInfo.time[type] = cTime
          this.chStorage(this.videoInfo.extra, Operate.SET, {[type]: cTime}, this.site)
          target.title = genTitle(cTime)
          break
        case 2:
          if (this.videoInfo.time) {
            delete this.videoInfo.time[type]
          }
          this.chStorage(this.videoInfo.extra, Operate.DEL, {[type]: "1"}, this.site)
          target.title = genTitle("")
          break
      }
    }

    // 设置事件
    (timeDiv.children[0] as HTMLElement).onmouseup = onDealTime;
    (timeDiv.children[2] as HTMLElement).onmouseup = onDealTime

    // 添加设置事件的面板到网页中
    document.body.appendChild(timeDiv)
  }

  /**
   * 填充当前视频的信息
   *
   * 在子类中需要重写
   *
   * 为了兼容更复杂的网页，可能用到 async、await
   */
  abstract getVideoExtraInfo(): Promise<VideoType.Extra>

  /**
   * 下一集的按钮（需可调用 elem.click()）
   *
   * **当存在下一集时**，跳过下一集
   *
   * **在子类中需要实现**
   * @return
   */
  abstract nextEpisodeElem(): HTMLElement | null

  /**
   * 获取、设置存储中的片头尾时间信息
   *
   * 时间信息保存在 chromium storage 的 {fav_videos: {[site]: {}}} 对象中
   *
   * 如果 op 为"DEL"，且当 open 或 end 属性不为 null 时，表示删除对应的时间记录，如{open: "1"}}表示删除 open 属性
   * @param extra 视频的额外信息
   * @param op 执行的操作：Operate中的 "GET"、"SET"、"DEL"
   * @param vTime 片头尾时间信息，可只含其中一个属性。仅当 op 为 "GET" 时可为空
   * @param site 视频网站的代号，在 chromium storage 中作为 key，如"bili"
   * @return 视频的信息
   */
  async chStorage(extra: VideoType.Extra, op: Operate,
                  vTime: VideoType.Time | null, site: string): Promise<VideoType.VideoInfo> {
    let id = extra.id
    // 读取存储数据中该视频的信息，不存在则创建默认值返回
    let timeData = (await chrome.storage.sync.get({fav_videos: {[site]: {}}})).fav_videos[site]
    let videoInfo = timeData[id] || {time: {open: "", end: ""}, extra: extra}

    // 根据参数选择操作
    switch (op) {
      case Operate.GET:
        return videoInfo
      case Operate.SET:
        if (vTime?.open) {
          videoInfo.time.open = vTime.open
        }
        if (vTime?.end) {
          videoInfo.time.end = vTime.end
        }
        timeData[id] = videoInfo
        console.log(this.TAG, `已设置视频"${id}"的片头尾时间：`, videoInfo.time)
        showMsg("已设置片头尾的时间", Msg.success)
        break
      case Operate.DEL:
        // 如果操作为"DEL"，且 open 或 end 不为空，表示删除对应的片头/尾时间
        if (vTime?.open) {
          delete videoInfo.time.open
        }
        if (vTime?.end) {
          delete videoInfo.time.end
        }
        // 如果 open 和 end 都为空，则直接删除该视频的时间记录
        if (!videoInfo.time.open && !videoInfo.time.end) {
          delete timeData[id]
        }
        console.log(this.TAG, `已删除视频"${id}"的片头尾时间：`, videoInfo.time)
        showMsg("已删除片头尾的时间信息", Msg.success)
        break
      default:
        console.log(this.TAG, `操作参数错误：${op}`)
        showMsg(`操作参数错误：${op}`, Msg.error)
        return videoInfo
    }

    // 将修改保存到存储
    await chrome.storage.sync.set({fav_videos: {[site]: timeData}})
    console.log(this.TAG, "已保存视频的时间信息：", timeData)
    // showMsg(`已保存视频的时间信息`, Msg.success)
    return videoInfo
  }
}