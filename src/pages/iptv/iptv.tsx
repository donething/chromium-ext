import {useEffect, useState} from "react"
import {Avatar} from "@mui/material";
import {Channel} from "./types";

// 单个地区的组件（内含所属的所有频道）
const CHCtyItem = function (props: { country: string, chs: Array<Channel> }) {
  // 需要排到前面（也将变色来标识）的地区（可以继续用"||"选择更多的地区）
  let focus = props.country === "China"
  // 当前地区的所有频道
  let channels = props.chs.map(ch => <CHItem key={ch.url} ch={ch}/>)

  return (
    <li className={`col ${focus ? "order-front" : ""}`} style={{width: 200, marginRight: 20}}>
      <span className="row" title={props.country}>
        <span className={`posts-title clickable overflow-hide-line-one ${focus ? "focus-text" : ""}`}
              onClick={e => {
                // 地区的标题元素
                let target = e.target as HTMLElement
                // 需要展开、收缩的目标元素
                let chsELem = (target.parentElement as HTMLElement).nextElementSibling as HTMLElement
                // 目标当前是否为收缩状态

                let isHide = chsELem.style.display === "none"
                // 点了地区名，就改变展开、收缩的状态
                chsELem.style.display = isHide ? "inline-block" : "none"
                // 特别标识已展开的地区
                if (isHide) {
                  target.classList.add("success-text")
                } else {
                  target.classList.remove("success-text")
                }
              }}>{props.country}</span>&nbsp;
        <span className="post-description" style={{whiteSpace: "nowrap"}}>({props.chs.length})</span>
      </span>
      <ul className="col scrollable" style={{display: "none", maxHeight: "85vh", marginLeft: 10}}>
        {channels}
      </ul>
    </li>
  )
}

// 单个频道的组件
const CHItem = function (props: { ch: Channel }) {
  return (
    <li className="row margin-v">
      <Avatar className="margin-right-large" src="/icons/sign/loading.svg" srcSet={props.ch.logo}/>
      <a href={`potplayer://${props.ch.url}`} title={props.ch.name}>{props.ch.name}</a>
    </li>
  )
}

// IPTV 直播源列表的组件
export const IPTV = function () {
  // 格式化后的所有频道
  const [iptvs, setIPTVs] = useState<{ [country: string]: Array<Channel> }>({})
  // 总频道数
  const [total, setTotal] = useState(0)

  useEffect(() => {
    document.title = `IPTV 直播源 - ${chrome.runtime.getManifest().name}`

    const init = async () => {
      let resp = await fetch("https://iptv-org.github.io/iptv/channels.json")
      if (!resp.ok) {
        console.log("获取 IPTV 直播地址的列表时出错：", await resp.text())
        return
      }

      // 解析 IPTV 直播源
      let all: Array<Channel> = await resp.json()
      let tmp: { [country: string]: Array<Channel> } = {}
      setTotal(all.length)

      // 按地区分类频道（以排在第一的语言为准）
      for (const ch of all) {
        let key = ch.countries[0]?.name || "Others"
        if (!tmp[key]) {
          tmp[key] = []
        }

        tmp[key].push(ch)
      }
      setIPTVs(tmp)
    }
    // 执行
    init()
  }, [])

  const channels = Object.entries(iptvs).map(item =>
    <CHCtyItem key={item[0]} country={item[0]} chs={item[1]}/>
  )

  return (
    <ul className="col wrap padding-h aligin-content-start" style={{height: "100vh", overflowY: "hidden"}}>
      <li className="post-description" style={{order: -10000, width: 220}}>
        共 {Object.getOwnPropertyNames(iptvs).length} 个地区，{total} 个频道
      </li>
      {channels}
    </ul>
  )
}
