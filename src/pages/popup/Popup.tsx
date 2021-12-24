import React, {useEffect} from 'react'
import {Button, Space} from "antd"

const Popup = function () {
  useEffect(() => {
    document.title = `弹出框 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <Space direction="vertical" style={{width: 80, padding: 5}}>
      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/hot_topics"})}>热帖
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/bili_video"})}>哔哩视频
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/video_fav"})}>视频收藏
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/http_headers"})}>转请求头
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/video_tool"})}>视频工具
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/iptv"})}>IPTV源
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/options"})}>选项
      </span>
    </Space>
  )
}

export default Popup

