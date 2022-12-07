/**
 * 在`localhost`域名下执行网站
 */
import {M3uPlaylist, M3uMedia} from 'm3u-parser-generator'
import {sleep} from "do-utils"
import {download} from "do-utils/dist/elem"

// 获取 Alist 的播放列表
const genAlistPlaylist = async () => {
  // 为管理页面
  if (window.location.pathname === "/@manage") {
    console.log("为管理页面，退出获取播放列表")
    return
  }

  // 需要现在页面中显示播放列表，脚本才能获取到播放列表
  let showPlaylistBn: Element | undefined | null = undefined
  while (true) {
    showPlaylistBn = document.querySelector("div#video-player")?.nextElementSibling
    if (showPlaylistBn) {
      break
    }
    // 为目录页面，退出
    if (document.querySelector("div.title p")?.textContent === "名称") {
      console.log("为目录页面，退出获取播放列表")
      return
    }

    // console.log("还需等待显示播放列表的按钮")
    await sleep(100)
  }
  console.log("已出现显示播放列表的按钮，将添加下载按钮")

  // 显示播放列表按钮
  let bnShow = showPlaylistBn as HTMLButtonElement

  // 添加下载按钮
  // 已存在，直接返回
  if (document.querySelector("#do_bn_down_playlist")) return

  let bnDown = document.createElement("button")
  bnDown.id = "do_bn_down_playlist"
  bnDown.textContent = "保存列表"
  bnDown.title = "下载播放列表为'.m3u8'文件"
  bnDown.style.padding = "5px"
  bnDown.style.cursor = "pointer"

  bnDown.onclick = () => {
    bnShow.click()
    // 获取播放列表所在的父元素
    let listParent = document.querySelector('div[role="listbox"]')
    if (!listParent) {
      console.log("无法获取播放列表所在的父元素")
      return
    }

    // 构造播放列表
    const playlist = new M3uPlaylist()
    playlist.title = "播放列表"

    // 获取当前视频目录的播放地址 dirAddr
    let potLink = document.querySelector("a[href^='potplayer://']")
    if (!potLink) {
      console.log("Potplay 链接元素为空，无法获取到视频目录的播放地址")
      return
    }
    let path = (potLink as HTMLLinkElement).href.replace("potplayer://", "")
    path = decodeURIComponent(decodeURIComponent(path))
    let dirAddr = path.substring(0, path.lastIndexOf("/") + 1)
    let filename = path.substring(path.lastIndexOf("/") + 1)
    filename = filename.substring(0, filename.indexOf("."))

    // 添加播放列表
    let names = Array.from(listParent.children).map(item => item.textContent || "未知的文件名")
    names = names.sort((a, b) => a.localeCompare(b))
    for (let name of names) {
      const media = new M3uMedia(dirAddr + name)
      media.name = name

      playlist.medias.push(media)
    }

    // 提取显示播放列表
    const m3uString = playlist.getM3uString()
    download(m3uString, `${filename}.m3u8`)

    // 隐藏播放列表
    bnShow.click()
  }

  // 添加按钮
  let tools = bnShow.nextElementSibling
  if (!tools) {
    console.log("没有找到工具栏，无法添加下载按钮")
    return
  }
  tools.appendChild(bnDown)
}

const start = async () => {
  console.log("开始获取`Alist`的播放列表")
  genAlistPlaylist()
}

start()