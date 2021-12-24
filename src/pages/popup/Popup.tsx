import React, {useEffect, useState} from 'react'
import {Slider, Space, Tag} from "antd"
import Icon from '@ant-design/icons'
import {ReactComponent as IconVolume} from "../../icons/volume.svg"
import {ReactComponent as IconHot} from "../../icons/hot.svg"
import {ReactComponent as IconBili} from "../../icons/bili.svg"
import {ReactComponent as IconVideo} from "../../icons/video.svg"
import {ReactComponent as IconHeaders} from "../../icons/headers.svg"
import {ReactComponent as IconVideoTool} from "../../icons/video_tool.svg"
import {ReactComponent as IconTV} from "../../icons/tv.svg"
import {ReactComponent as IconOptions} from "../../icons/options.svg"

const Popup = function () {
  // 音量增强值
  const [volumeEnhance, setVomumeEnhance] = useState(1)

  useEffect(() => {
    document.title = `弹出框 - ${chrome.runtime.getManifest().name}`

    // 接收当前页面的媒体元素的音量增强值
    chrome.runtime.onMessage.addListener(message => {
      if (message.cmd === "volumeEnhance") {
        // 当 volumeEnhanceValue为 -1 时表示在当前页面中没有找到媒体元素，
        console.log("收到消息，设置音量增强值：", message.volumeEnhanceValue)
        setVomumeEnhance(message.volumeEnhanceValue)
      }
    })

    // 让当前页面的内容脚本发送媒体元素的音量增强值
    chrome.tabs.query({active: true, currentWindow: true}).then(async ([tab]) => {
      if (!tab.id) {
        return
      }
      // 引入脚本
      await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ["/scripts/volume_enhance.js"]
      })

      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        // @ts-ignore
        func: () => window.enhanceVolume()
      })
    })
  }, [])

  return (
    <Space direction="vertical" style={{width: 100, padding: 5}}>
      <span className="row align-center">
        <Icon component={IconVolume}/>
        <Slider className="width-fill-remain margin-h-large" min={0} max={10} step={0.1} value={volumeEnhance}
                disabled={volumeEnhance === -1} onChange={v => {
          setVomumeEnhance(v)
          chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {
            if (!tab.id) {
              return
            }
            chrome.scripting.executeScript({
              target: {tabId: tab.id},
              // @ts-ignore
              func: (volEn) => window.enhanceVolume(volEn),
              args: [volumeEnhance]
            })
          })
        }}/>
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

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/http_headers"})}>
        <Icon component={IconHeaders}/> 转请求头
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/video_tool"})}>
        <Icon component={IconVideoTool}/> 视频工具
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/iptv"})}>
        <Icon component={IconTV}/> IPTV源
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/options"})}>
        <Icon component={IconOptions}/> 选项
      </span>
    </Space>
  )
}

export default Popup