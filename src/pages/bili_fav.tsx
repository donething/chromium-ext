// 显示哔哩哔哩收藏的视频

import React, {useEffect, useState} from "react"
import {sec, date} from "do-utils"
import {message} from "antd"
import {request} from "do-utils/dist/utils"

declare global {
  // UP主
  interface Upper {
    // 头像
    face: string
    // 用户id
    mid: number
    // 主播名
    name: string
  }

  // 视频的收藏次数、弹幕数量、播放次数的信息
  interface CntInfo {
    // 收藏次数
    collect: number
    // 弹幕数量
    danmaku: number
    // 播放次数
    play: number
  }

  // 视频的信息
  interface Video {
    // 视频的id
    id: number
    bvid: string
    title: string
    // 视频时长
    duration: number
    cover: string
    // 视频介绍
    intro: string
    // 收藏的时间
    fav_time: number
    // 视频发布的时间
    pubtime: number
    // 上传者的信息
    upper: Upper
    // 视频的影响力的信息
    cnt_info: CntInfo
  }

  // 收藏夹的信息
  interface FavFolder {
    // 收藏夹的id
    id: number
    // 收藏夹名
    title: string
    // 包含视频的数量
    media_count: number
    // 包含的视频列表
    medias: Array<Video>
  }

  // 视频项
  interface VideoItemProps extends Video {
    // useState() 中的设置状态的函数
    setLost: React.Dispatch<React.SetStateAction<number>>
  }

  // 视频搜藏夹项
  interface FavFolderItemProps extends FavFolder {
    setLost: React.Dispatch<React.SetStateAction<number>>
  }
}

// 单个视频的布局
const VideoItem = function (props: VideoItemProps) {
  // 检测失效视频的数量
  if (props.title === "已失效视频") {
    props.setLost(prev => prev + 1)
  }

  return (
    <li className="col" style={{width: 190, margin: "5px 15px 15px 0"}}>
      <a title={props.title} href={`https://www.bilibili.com/${props.bvid}`} target="_blank"
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
          <img src={props.cover} style={{width: 190, height: 119, borderRadius: 3}}/>
          <div className="col justify-center meta" style={{display: "none"}}>
            <div>时长：{sec(props.duration, true)}</div>
            <div>播放：{props.cnt_info.play.toLocaleString('en-US')}</div>
            <div>弹幕：{props.cnt_info.danmaku.toLocaleString('en-US')}</div>
            <div>收藏：{date({date: new Date(props.fav_time * 1000)})}</div>
            <div>发布：{date({date: new Date(props.pubtime * 1000)})}</div>
            <div className="hover" onClick={e => {
              window.open(`https://space.bilibili.com/${props.upper.mid}`, "_blank")
              e.preventDefault()
              e.stopPropagation()
            }}>UP：{props.upper.name}</div>
          </div>
        </div>
        <div title={props.intro} className="post-description"
             style={{lineHeight: "1.8em", maxHeight: "3.6em", overflow: "hidden"}}>
          {props.title !== "已失效视频" ? props.title : props.intro}
        </div>
      </a>
    </li>
  )
}

// 单个收藏夹的布局（内含多个视频）
const FavFolderItem = function (props: FavFolderItemProps) {
  const items = props.medias.map(e =>
    <VideoItem key={e.id} setLost={props.setLost} id={e.id} bvid={e.bvid} title={e.title}
               duration={e.duration} cover={e.cover} intro={e.intro}
               fav_time={e.fav_time} pubtime={e.pubtime}
               upper={e.upper} cnt_info={e.cnt_info}
    />
  )
  return (
    <li>
      <hr/>
      <h4 className="sticky" style={{background: "rgba(0, 161, 214)", color: "#FFF"}}>
        {`${props.title} (共 ${props.media_count} 部)`}
      </h4>
      <ul className="row wrap">
        {items}
      </ul>
    </li>
  )
}

// 显示哔哩哔哩收藏的视频
const BiliFav = function () {
  // 包含视频的收藏夹，用于展示
  const [folders, setFolders] = useState<Array<JSX.Element>>([])
  // 收藏的总视频数量
  const [total, setTotal] = useState(0)
  // 已失效的视频数量
  const [lost, setLost] = useState(0)

  useEffect(() => {
    document.title = `哔哩哔哩收藏的视频 - ${chrome.runtime.getManifest().name}`

    // 获取数据到步骤：先获取用户mid，然后获取视频收藏夹，再获取收藏夹下的视频
    const init = async () => {
      // 先获取当前登录用户的 id
      let resp = await request("https://api.bilibili.com/x/space/myinfo")
      let obj = await resp.json()
      if (obj.code !== 0) {
        console.log("请先登录一次哔哩哔哩网站")
        message.warn("请先登录一次哔哩哔哩网站")
        return
      }
      let mid = obj.data.mid

      // 再获取该用户的收藏夹
      let url = `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${mid}`
      let foldersResp = await request(url)
      let foldersObj = await foldersResp.json()
      if (foldersObj.code !== 0) {
        console.log("获取收藏夹出错：", foldersObj)
        message.error("获取收藏夹出错")
        return
      }

      // 遍历收藏夹，获取其下的视频
      for (let item of foldersObj.data.list) {
        // 请求指定收藏夹内的视频
        let url = "https://api.bilibili.com/x/v3/fav/resource/list?pn=1&ps=20&" +
          "order=mtime&type=0&tid=0&media_id=" + item.id
        await request(url).then(e => e.json()).then(obj => {
          if (obj.code !== 0) {
            console.log(`获取收藏夹"${item.title}"内的视频出错：`, obj)
            message.error(`获取收藏夹"${item.title}"内的视频出错`)
            return
          }

          let data = obj.data
          setTotal(prev => prev + data.info.media_count)
          let nItem = <FavFolderItem key={data.info.id} setLost={setLost}
                                     id={data.info.id} title={data.info.title}
                                     media_count={data.info.media_count} medias={data.medias}/>
          setFolders(prev => [...prev, nItem])
        })
      }
    }

    // 当组件被导入后开始获取数据
    init()
  }, [])

  return (
    <div style={{padding: 5}}>
      <h4>共收藏 {total} 个视频，已失效 {lost} 个</h4>
      <ul>
        {folders}
      </ul>
    </div>
  )
}

export default BiliFav