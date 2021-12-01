import React, {useEffect} from 'react'
import {Button} from "antd"

const Popup = function () {
  useEffect(() => {
    document.title = `弹出框 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <div className="col" style={{backgroundColor: "#FFF"}}>
      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/hot_topics"})}>热帖
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/bili_video"})}>哔哩视频
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/video_fav"})}>收藏的视频
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/http_headers"})}>转换请求头
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/video_tool"})}>视频工具
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/iptv"})}>IPTV
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/options"})}>选项
      </Button>
    </div>
  )
}

export default Popup

