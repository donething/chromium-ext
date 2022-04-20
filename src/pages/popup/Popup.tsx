import React, {useEffect, useState} from 'react'
import {ReactComponent as IconVolume} from "../../icons/volume.svg"
import {ReactComponent as IconHot} from "../../icons/hot.svg"
import {ReactComponent as IconBili} from "../../icons/bili.svg"
import {ReactComponent as IconVideo} from "../../icons/video.svg"
import {ReactComponent as IconHeaders} from "../../icons/headers.svg"
import {ReactComponent as IconVideoTool} from "../../icons/video_tool.svg"
import {ReactComponent as IconTV} from "../../icons/tv.svg"
import {ReactComponent as IconStatus} from "../../icons/status.svg"
import {ReactComponent as IconOptions} from "../../icons/options.svg"
import {Button, Slider, Stack} from "@mui/material"
import {MySvgIcon} from "../../comm/antd"

declare global {
  interface Window {
    enhanceVolume: (volEn?: number) => void
  }
}

// 弹窗
const Popup = function (): JSX.Element {
  // 音量增强值
  const [volEnValue, setVolEnValue] = useState(1)

  // 设置音量增强值
  // 来源有3个：来自内容脚本消息中的音量增强值、滑动增强滑块的值、点击图标恢复默认值
  const updateVolEnhance = (v: number) => {
    setVolEnValue(v)
    // 如果从内容脚本传来不存在媒体元素的(即值为 -1)，则不需要对其设置音量增强，直接返回
    if (v === -1) {
      return
    }
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
        // 当 value为 -1 时表示在当前页面中没有找到媒体元素，
        console.log("[Pop] 收到音量增强值：", message.value)
        updateVolEnhance(message.value)
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
      chrome.scripting.executeScript({
          target: {tabId: tab.id},
          files: ["/scripts/volume_enhance.js"]
        },
        _ => {
          if (chrome.runtime.lastError) {
            console.log("[Pop] 不可访问内部网页")
            setVolEnValue(-1)
            return
          }

          chrome.scripting.executeScript({
            target: {tabId: tab.id || -1},
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
    <Stack direction={"column"} width={130} padding={1}>
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <MySvgIcon title={"恢复增强值为 1"} svg={IconVolume} onClick={() => updateVolEnhance(1)}/>
        <Slider min={0} max={10} step={0.1} value={volEnValue} disabled={volEnValue === -1} size={"small"}
                onChange={(_, v) => {
                  if (typeof v === "number") {
                    updateVolEnhance(v)
                  }
                }}
        />
      </Stack>

      <Button startIcon={<MySvgIcon svg={IconHot}/>} sx={{marginLeft: 0}}
              onClick={() => chrome.tabs.create({url: "/index.html#/hot_topics"})}
      >热帖</Button>

      <Button startIcon={<MySvgIcon svg={IconBili}/>} sx={{marginLeft: 0}}
              onClick={() => chrome.tabs.create({url: "/index.html#/bili_video"})}
      >哔哩视频</Button>

      <Button startIcon={<MySvgIcon svg={IconVideo}/>} sx={{marginLeft: 0}}
              onClick={() => chrome.tabs.create({url: "/index.html#/video_fav"})}
      >视频收藏</Button>

      <Button startIcon={<MySvgIcon svg={IconVideoTool}/>} sx={{marginLeft: 0}}
              onClick={() => chrome.tabs.create({url: "/index.html#/video_tool"})}
      >视频工具</Button>

      <Button startIcon={<MySvgIcon svg={IconHeaders}/>} sx={{marginLeft: 0}}
              onClick={() => chrome.tabs.create({url: "/index.html#/http_headers"})}
      >转请求头</Button>

      <Button startIcon={<MySvgIcon svg={IconTV}/>} sx={{marginLeft: 0}}
              onClick={() => chrome.tabs.create({url: "/index.html#/iptv"})}
      >IPTV 源</Button>

      <Button startIcon={<MySvgIcon svg={IconStatus}/>} sx={{marginLeft: 0}}
              onClick={() => chrome.tabs.create({url: "chrome://sync-internals"})}
      >浏览器状态</Button>

      <Button startIcon={<MySvgIcon svg={IconOptions}/>} sx={{marginLeft: 0}}
              onClick={() => chrome.tabs.create({url: "/index.html#/options"})}
      >选项</Button>
    </Stack>
  )
}

export default Popup
