// 全网站通用的内容脚本

import {insertJSSrc} from "do-utils"
import {Translate} from "./cs/translate"

const TAG = "[CS]"

const deal = async function () {
  let data = await chrome.storage.sync.get({settings: {}})

  // 禁止网页检测是否切换到了后台
  if (data.settings.enableDisableVisibilityAPI === false) {
    console.log(TAG, "根据设置 已禁用禁止网页检测是否切换到了后台")
  } else {
    console.log(TAG, "禁止网页检测是否切换到了后台")
    // 阻止检测可见性的事件
    for (let eventName of ["visibilitychange", "webkitvisibilitychange"]) {
      window.addEventListener(eventName, function (event) {
        // console.log(TAG, `网站监测了网页可见性：'${event.type}'`);
        event.stopImmediatePropagation()
      }, true)
    }

    // 设置可见性的属性为“隐藏”
    insertJSSrc(chrome.runtime.getURL("/scripts/disable-visibility.js"))
  }


  // 选中文本后，按 Ctrl 翻译
  if (data.settings.enableTranslate === false) {
    console.log(TAG, "根据设置 已禁用选中文字后，按 Ctrl 弹出翻译")
  } else {
    console.log(TAG, "已开启 选中文字后，按 Ctrl 弹出翻译")
    Translate.init()
  }
}

// 执行
deal()