// 显示哔哩哔哩收藏的视频

import React, {useEffect, useState} from "react"
import {date, parseSec, request} from "do-utils"
import {useSharedSnackbar} from "do-comps";
import {Stack, Typography} from "@mui/material"
import {FavResp} from "./types";
import {useBetween} from "use-between"

// React 组件需要使用的公共数据
const useData = () => {
  // 收藏的总视频数量
  const [total, setTotal] = useState(0)
  // 已失效的视频数量
  const [lost, setLost] = useState(0)

  return {total, setTotal, lost, setLost}
}
const useSharedData = () => useBetween(useData)

// 单个视频的布局
const VideoItem = (props: { media: FavResp.Media }) => {
  const {setLost} = useSharedData()

  // 检测失效视频的数量
  /* 不能直接判断后调用setLost，会循环渲染同一个视频，报错
  if (props.media.title === "已失效视频") {
    setLost(prev => prev + 1)
  }
  */
  // 为避免循环渲染，增加useEffect和唯一约束
  // props.media.id 表示已换了下个视频，不用 props.media.title 是因为不同视频可能标题一样，逻辑不适合
  useEffect(() => {
    if (props.media.title === "已失效视频") {
      setLost(prev => prev + 1);
    }
  }, [props.media.id, setLost]);

  return (
    <li className="col" style={{width: 190, margin: "5px 15px 15px 0"}}>
      <a title={props.media.title} href={`https://www.bilibili.com/${props.media.bvid}`}
         target="_blank" rel="noreferrer"
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
          <img alt={"封面"} src={props.media.cover} style={{width: 190, height: 119, borderRadius: 3}}/>
          <div className="col justify-center meta" style={{display: "none"}}>
            <div>时长：{parseSec(props.media.duration, true)}</div>
            <div>播放：{props.media.cnt_info.play.toLocaleString('en-US')}</div>
            <div>弹幕：{props.media.cnt_info.danmaku.toLocaleString('en-US')}</div>
            <div>收藏：{date(new Date(props.media.fav_time * 1000))}</div>
            <div>发布：{date(new Date(props.media.pubtime * 1000))}</div>
            <div className="hover" onClick={e => {
              window.open(`https://space.bilibili.com/${props.media.upper.mid}`, "_blank")
              e.preventDefault()
              e.stopPropagation()
            }}>UP：{props.media.upper.name}</div>
          </div>
        </div>
        <div title={props.media.intro} className="posts-content"
             style={{lineHeight: "1.8em", maxHeight: "3.6em", overflow: "hidden"}}>
          {props.media.title !== "已失效视频" ? props.media.title : props.media.intro}
        </div>
      </a>
    </li>
  )
}

// 单个收藏夹的布局（内含多个视频）
const FavFolderItem = (props: { fav: FavResp.Data }) => {
  const items = props.fav.medias.map(media =>
    <VideoItem key={media.id} media={media}/>
  )

  return (
    <li>
      <hr/>
      <h4 className="sticky" style={{background: "rgba(0, 161, 214)", color: "#FFF"}}>
        {`${props.fav.info.title} (共 ${props.fav.info.media_count} 部)`}
      </h4>
      <ul className="row wrap">{items}</ul>
    </li>
  )
}

// 显示哔哩哔哩收藏的视频
const BiliFav = function () {
  // 包含视频的收藏夹，用于展示
  const [favDatas, setFavDatas] = useState<FavResp.Data[]>()

  const {total, setTotal, lost} = useSharedData()

  const {showSb} = useSharedSnackbar()

  const init = React.useCallback(async () => {
    // 先获取当前登录用户的 id
    let resp = await request("https://api.bilibili.com/x/space/myinfo")
    let obj = await resp.json()
    if (obj.code !== 0) {
      console.log("请先登录一次哔哩哔哩网站")
      showSb({open: true, message: "请先登录一次哔哩哔哩网站", severity: "warning"})
      return
    }
    let mid = obj.data.mid

    // 再获取该用户的收藏夹
    let url = `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${mid}`
    let foldersResp = await request(url)
    let foldersObj = await foldersResp.json()
    if (foldersObj.code !== 0) {
      console.log("获取收藏夹出错：", foldersObj)
      showSb({open: true, message: "获取收藏夹出错", severity: "warning"})
      return
    }

    // 遍历收藏夹，获取其下的视频
    for (let item of foldersObj.data.list) {
      // 请求指定收藏夹内的视频
      let url = "https://api.bilibili.com/x/v3/fav/resource/list?pn=1&ps=20&" +
        "order=mtime&type=0&tid=0&media_id=" + item.id
      const resp = await request(url)
      const obj: FavResp.Resp = await resp.json()
      if (obj.code !== 0) {
        console.log(`获取收藏夹"${item.title}"时出错：`, obj)
        showSb({open: true, message: `获取收藏夹"${item.title}"时出错`, severity: "error"})
        return
      }

      setFavDatas(prev => [...(prev || []), obj.data])
    }
  }, [showSb])

  const items = React.useMemo(() => {
    return favDatas?.map(fav => {
      setTotal(prev => prev + fav.info.media_count)

      return (
        <FavFolderItem key={fav.info.id} fav={fav}/>
      )
    })
  }, [favDatas, setTotal])

  useEffect(() => {
    document.title = `哔哩哔哩收藏的视频 - ${chrome.runtime.getManifest().name}`

    // 当组件被导入后开始获取数据
    init()
  }, [init])

  return (
    <Stack gap={2} padding={2}>
      <Typography>共收藏 {total} 个视频，已失效 {lost} 个</Typography>
      <ul>{items}</ul>
    </Stack>
  )
}

export default BiliFav