// 老王论坛

import {Msg, showMsg} from "do-utils"

const TAG = "[LaoW]"
const KEY = "laow"

// 存储到 chromium storage 中的数据
type SnycData = {
  // 已下载过的帖子ID的列表
  hadDL?: string[]
}
// 当前页面的信息
type PageInfo = {
  mod: string | null
  tid: string | null
}

// 帖子列表中显示是否已下载过
const markHadDLOnList = async () => {
  // 获取当前页面的信息
  const {mod, tid} = parsePageInfo()
  if (mod !== "forumdisplay") {
    console.log(TAG, "不是帖子列表页，无需标记已下载")
    return
  }

  // 从存储中获取，是否已下载过
  const obj = await chrome.storage.sync.get({[KEY]: {}})
  const data: SnycData = obj[KEY]

  const threads: NodeListOf<HTMLLinkElement> = document.querySelectorAll("div#threadlist ul#waterfall li h3 a")
  for (const t of threads) {
    const {tid} = parsePageInfo(t.href)
    if (!tid) {
      console.log(TAG, "无法标记为'已下载'：无法解析到帖子的 ID")
      await showMsg("无法标记为'已下载'：无法解析到帖子的 ID", Msg.error)
      return
    }

    // 已下载过
    if (data.hadDL?.includes(tid)) {
      const li = t.closest("li")
      if (!li) {
        console.log(TAG, "无法标记为'已下载'：无法定位到父级元素")
        await showMsg("无法标记为'已下载'：无法定位到父级元素", Msg.error)
        return
      }

      li.style.border = "3px solid green"
    }
  }
}

// 添加按钮
const addHadDLButton = async () => {
  // 获取当前页面的信息
  const {mod, tid} = parsePageInfo()
  if (mod !== "viewthread") {
    console.log(TAG, "不是帖子详情页，无需添加'已下载'按钮")
    return
  }

  if (!tid) {
    console.log(TAG, "无法添加'已下载'的按钮：无法匹配到帖子 ID。该页面可能不是帖子详情页")
    await showMsg("无法添加'已下载'的按钮：无法匹配到帖子 ID", Msg.error)
    return
  }

  // 先获取父元素
  const parent = document.querySelector("div.side_bar ul")
  if (!parent) {
    console.log(TAG, "无法添加'已下载'的按钮：父元素不存在")
    await showMsg("无法添加'已下载'的按钮：父元素不存在", Msg.error)
    return
  }

  // 添加的按钮
  const button = document.createElement("button")
  // 设置按钮样式
  button.style.width = "54px"
  button.style.height = "54px"
  button.style.zIndex = "2"
  button.style.position = "relative"
  button.style.background = "#FFD0DA"
  button.style.color = "#999"
  button.style.border = "none"
  button.style.marginTop = "1px"
  button.style.cursor = "pointer"

  // 从存储中获取，是否已下载过
  const obj = await chrome.storage.sync.get({[KEY]: {}})
  const data: SnycData = obj.laow
  if (data.hadDL?.includes(tid)) {
    button.innerText = "已下载"
    button.disabled = true
  } else {
    // 未下载时，点击按钮设置'已下载'
    button.innerText = "设为\n已下载"
    // 设置点击事件
    button.onclick = async () => {
      const obj = await chrome.storage.sync.get({[KEY]: {}})
      const data: SnycData = obj.laow
      // 避免重复添加
      if (data.hadDL?.includes(tid)) {
        console.log(TAG, "避免对同一个帖子多次设置'已下载'，返回")
        return
      }

      // 注意当没有该属性时，需要手动创建，避免为 undefined
      if (!data.hadDL) {
        data.hadDL = []
      }

      data.hadDL.push(tid)
      // 存储数据
      await chrome.storage.sync.set({[KEY]: data})

      // 设置完成
      button.disabled = true
      button.innerText = "已下载"
    }
  }

  parent.append(button)
  console.log(TAG, "已添加'已下载'的按钮")
}

// 解析当前网页的信息
const parsePageInfo = (urlStr?: string): PageInfo => {
  // 获取帖子的 ID
  const url = new URL(urlStr || window.location.href)
  const params = new URLSearchParams(url.search)

  return {
    mod: params.get("mod"),
    tid: params.get("tid")
  }
}

// 调用

markHadDLOnList()
addHadDLButton()