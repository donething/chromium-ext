import React, {useEffect, useState} from "react"
import {IconButton, Typography} from "@mui/material"
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import {VideoInfo, VideoItemProps} from "./types"

// 根据平台，解析链接、图标等
const parsePlat = function (plat: string, id: string): { site: string, url: string, icon: string } {
  switch (plat) {
    case "bili":
      return {
        // 视频播放页面
        site: "哔哩哔哩",
        url: `https://www.bilibili.com/${id}`,
        icon: "https://www.bilibili.com/favicon.ico",
      }
    default:
      console.log("错误的平台：", plat, id)
      return {site: "错误的平台", url: "", icon: ""}
  }
}

// 单个视频的布局
const VideoItem = function (props: VideoItemProps) {
  let info = parsePlat(props.plat, props.video.extra.id)

  return (
    <li className="col" style={{width: 190, margin: "5px 15px 15px 0"}}>
      <a href={info.url} title={props.video.extra.title} target="_blank" rel={"noreferrer"}
         onMouseEnter={e => {
           let atag = (e.target as HTMLElement).closest("a") as HTMLElement
           let target = atag.firstElementChild?.children[1] as HTMLElement
           target.style.display = "block"
         }} onMouseLeave={e => {
        let atag = (e.target as HTMLElement).closest("a") as HTMLElement
        let target = atag.firstElementChild?.children[1] as HTMLElement
        target.style.display = "none"
      }}>
        <div className="mask">
          <img alt={"封面"} src={props.video.extra.cover} style={{width: 190, height: 119, borderRadius: 3}}/>
          <div className="col justify-center meta" style={{display: "none"}}>
            <IconButton title={"删除"} color={"warning"} style={{position: "absolute", top: 8, right: 8}}
                        onClick={e => {
                          console.log("还未实现删除")
                          e.preventDefault()
                          e.stopPropagation()
                        }}><DeleteForeverIcon/></IconButton>
            <div>片头：{(props.video.time.open || "未设定") + " 秒"}</div>
            <div>片尾：{(props.video.time.end || "未设定") + " 秒"}</div>
          </div>
        </div>
        <div title={props.video.extra.title} className="posts-content"
             style={{lineHeight: "1.8em", maxHeight: "3.6em", overflow: "hidden"}}>
          {props.video.extra.title}
        </div>
      </a>
    </li>
  )
}

// 单个平台下视频的布局的参数
interface FolderItemProps {
  plat: string
  videos: { [id: string]: VideoInfo }
  setTotal: React.Dispatch<React.SetStateAction<number>>
  setFolders: React.Dispatch<React.SetStateAction<Array<JSX.Element>>>
}

// 单个平台下视频的布局（内含多个视频）
const FolderItem = function (props: FolderItemProps) {
  // 视频所在的网站名，如“哔哩哔哩”
  const site = parsePlat(props.plat, "").site
  // 收藏的该网站的视频数量
  let count = 0
  // 视频列表
  const items: Array<JSX.Element> = []
  for (const [, video] of Object.entries(props.videos)) {
    items.push(<VideoItem key={video.extra.id} plat={props.plat} video={video} setFolders={props.setFolders}/>)
    count++
  }
  props.setTotal(prev => prev + count)

  return (
    <li>
      <hr/>
      <Typography className="sticky" style={{background: "rgba(0, 161, 214)", color: "#FFF"}}>
        {`${site} (共 ${count} 部)`}
      </Typography>
      <ul className="row wrap">
        {items}
      </ul>
    </li>
  )
}

// 收藏的视频
const VideoFav = function () {
  document.title = `收藏的视频 - ${chrome.runtime.getManifest().name}`

  // 包含视频的收藏夹，用于展示
  const [folders, setFolders] = useState<Array<JSX.Element>>([])
  // 收藏的总视频数量
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const init = async () => {
      let data = await chrome.storage.sync.get({fav_videos: {}})
      let favVideos: { [site: string]: { [id: string]: VideoInfo } } = data.fav_videos
      for (const [site, videos] of Object.entries(favVideos)) {
        let item = <FolderItem key={site} plat={site} videos={videos}
                               setTotal={setTotal} setFolders={setFolders}/>
        setFolders(prev => [...prev, item])
      }
    }
    // 初始化
    init()
  }, [])

  return (
    <div style={{padding: 5}}>
      <Typography>共收藏 {total} 个视频</Typography>
      <ul>
        {folders}
      </ul>
    </div>
  )
}

export default VideoFav