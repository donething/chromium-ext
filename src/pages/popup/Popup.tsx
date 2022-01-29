import React, {useEffect, useState} from 'react'
import {Slider, Space} from "antd"
import Icon from '@ant-design/icons'
import {ReactComponent as IconVolume} from "../../icons/volume.svg"
import {ReactComponent as IconHot} from "../../icons/hot.svg"
import {ReactComponent as IconBili} from "../../icons/bili.svg"
import {ReactComponent as IconVideo} from "../../icons/video.svg"
import {ReactComponent as IconHeaders} from "../../icons/headers.svg"
import {ReactComponent as IconVideoTool} from "../../icons/video_tool.svg"
import {ReactComponent as IconTV} from "../../icons/tv.svg"
import {ReactComponent as IconStatus} from "../../icons/status.svg"
import {ReactComponent as IconOptions} from "../../icons/options.svg"

// 弹窗
const Popup = function (): JSX.Element {
  // 音量增强值
  const [volumeEnhance, setVomumeEnhance] = useState(1)

  // 设置音量增强值
  // 来源有3个：来自内容脚本消息中的音量增强值、滑动增强滑块的值、点击图标恢复默认值
  const updateVolEnhance = (v: number) => {
    setVomumeEnhance(v)
    chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {
      if (!tab.id) {
        return
      }
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        // @ts-ignore
        func: (volEn) => window.enhanceVolume(volEn),
        args: [v]
      })
    })
  }

  useEffect(() => {
    document.title = `弹出框 - ${chrome.runtime.getManifest().name}`

    // 接收内容脚本发送过来的音量增强消息
    const onVolEnhance = (message: any) => {
      if (message.cmd === "volumeEnhance") {
        // 当 volumeEnhanceValue为 -1 时表示在当前页面中没有找到媒体元素，
        console.log("[Pop] 收到消息，设置音量增强值：", message.volumeEnhanceValue)
        updateVolEnhance(message.volumeEnhanceValue)
      }
    }

    // 接收当前页面的媒体元素的音量增强值
    chrome.runtime.onMessage.addListener(onVolEnhance)

    // 让当前页面的内容脚本发送媒体元素的音量增强值
    chrome.tabs.query({active: true, currentWindow: true}).then(async ([tab]) => {
      if (!tab.id) {
        return
      }
      // 引入脚本
      chrome.scripting.executeScript({target: {tabId: tab.id}, files: ["/scripts/volume_enhance.js"]},
        _ => {
          if (chrome.runtime.lastError) {
            console.log("[Pop] 不可访问内部网页")
            setVomumeEnhance(-1)
            return
          }

          chrome.scripting.executeScript({
            // @ts-ignore
            target: {tabId: tab.id},
            // @ts-ignore
            func: () => window.enhanceVolume()
          })
        })
    })

    // 卸载组件时取消消息接收器，避免多次接收相同的消息
    return () => {
      chrome.runtime.onMessage.removeListener(onVolEnhance)
    }
  }, [])

  return (
    <Space direction="vertical" style={{width: 100, padding: 5}}>
      <span className="row align-center">
        <Icon title="恢复为默认增强值 1" component={IconVolume} onClick={() => updateVolEnhance(1)}/>
        <Slider className="width-fill-remain margin-h-large" min={0} max={10} step={0.1} value={volumeEnhance}
                disabled={volumeEnhance === -1} onChange={v => updateVolEnhance(v)}/>
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/hot_topics"})}>
        <Icon component={IconHot}/> 热帖
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/bili_video"})}>
        <Icon component={IconBili}/> 哔哩视频
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/video_fav"})}>
        <Icon component={IconVideo}/> 视频收藏
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/video_tool"})}>
        <Icon component={IconVideoTool}/> 视频工具
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/http_headers"})}>
        <Icon component={IconHeaders}/> 转请求头
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/iptv"})}>
        <Icon component={IconTV}/> IPTV源
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "chrome://sync-internals"})}>
        <Icon component={IconStatus}/> 浏览器
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/options"})}>
        <Icon component={IconOptions}/> 选项
      </span>
    </Space>
  )
}

export default Popup