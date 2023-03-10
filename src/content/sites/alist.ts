/**
 * 在`localhost`域名下执行网站
 */
import {M3uPlaylist, M3uMedia} from 'm3u-parser-generator'
import {sleep} from "do-utils"
import {download} from "do-utils/dist/elem"

const TAG = "[CEXT]"

// 视频格式
const VIDEO_EXT = ".mp4.mkv.avi.ts.mov.rmvb.webm.flv"

// 获取 Alist 的播放列表
const genAlistPlaylist = async () => {
  // 为管理页面
  if (window.location.pathname === "/@manage") {
    console.log(TAG, "为管理页面，退出获取播放列表")
    return
  }

  // 需要现在页面中显示播放列表，脚本才能获取到播放列表
  let toolsNav: Element | undefined | null = undefined
  while (true) {
    toolsNav = document.querySelector("div.hope-stack")
    if (toolsNav) {
      break
    }

    // console.log(TAG, "还需等待显示播放列表的按钮")
    await sleep(100)
  }

  // 添加下载按钮
  // 已存在，直接返回
  if (document.querySelector("#do_bn_down_playlist")) return

  let bnDown = document.createElement("button")
  bnDown.id = "do_bn_down_playlist"
  bnDown.textContent = "下载列表"
  bnDown.title = "下载播放列表为'.m3u8'文件"
  bnDown.style.cursor = "pointer"
  bnDown.style.padding = "5px"
  bnDown.style.marginRight = "16px"
  bnDown.style.marginLeft = "auto"

  bnDown.onclick = () => {
    // 获取播放列表所在的父元素
    let videoElems = document.querySelectorAll("a.list-item")
    if (videoElems.length === 0) {
      console.log(TAG, "该页面中无法获取到视频列表")
      return
    }

    // 视频集的名字
    let albumName = document.querySelector("nav.nav ol")?.lastChild?.textContent || "未知的视频集名"

    // 构造播放列表
    const playlist = new M3uPlaylist()
    playlist.title = "播放列表"

    // 添加播放列表
    let links = Array.from(videoElems).filter(item => {
      // 从链接中提取为视频的链接（根据后缀格式判断）
      let href = (item as HTMLLinkElement).href
      let name = href.substring(href.lastIndexOf("/"))
      if (name.indexOf(".") === -1) {
        return false
      }

      let ext = name.substring(name.lastIndexOf("."))
      return VIDEO_EXT.indexOf(ext) !== -1
    }).map(item => (item as HTMLLinkElement).href || "未知的文件地址")

    if (links.length === 0) {
      console.log(TAG, "该页面中没有找到视频")
      return
    }

    // 需要先排序
    links = links.sort((a, b) => a.localeCompare(b))
    for (let link of links) {
      // 解码为"https://example.com/测试.mp4"
      const decodeLink = decodeURIComponent(link)
      const u = new URL(decodeLink)
      // 此时 u.pathname 为经过encodeURIComponent()后的字符串，需要再解码得到 "/测试.mp4"
      // 再替换pathname，得到"https://example.com"
      const host = decodeLink.replace(decodeURIComponent(u.pathname), "")
      const media = new M3uMedia(host + "/d" + u.pathname)
      media.name = decodeLink.substring(decodeLink.lastIndexOf("/") + 1)

      playlist.medias.push(media)
    }

    // 提取显示播放列表
    const m3uString = playlist.getM3uString()
    download(m3uString, `${albumName}.m3u8`)
  }

  // 添加按钮
  toolsNav.insertBefore(bnDown, toolsNav.lastChild)
}

const start = async () => {
  console.log(TAG, "开始添加下载视频列表的功能")
  genAlistPlaylist()
}

start()