import {useEffect, useState} from "react"
import {Avatar, message} from "antd"

// 频道信息
type Channel = {
  // 频道名，如"1+1 Hello"
  name: string
  // logo 地址，可能为空
  logo: string | undefined
  // 直播源地址，如"https://example.com/playlist.m3u8"
  url: string
  // 分类，如"Movies"、"Music"
  category: string | undefined
  // 频道语言，[ { "code": "eng", "name": "English" } ]
  languages: Array<{ code: string, name: string }>
  // 地区：[ { "code": "cn", "name": "China" } ]
  countries: Array<{ code: string, name: string }>
}

// 单个地区的组件（内含所属的所有频道）
const CHCtyItem = function (props: { country: string, chs: Array<Channel> }) {
  let focus = props.country === "China"
  let channels = props.chs.map(ch => <CHItem key={ch.url} ch={ch}/>)

  return (
    <li className={`col ${focus ? "front" : ""}`} style={{width: 220}}>
      <strong className={`clickable ${focus ? "focus-text" : ""}`} title={props.country} onClick={e => {
        // 地区的标题元素
        let target = e.target as HTMLElement
        // 需要展开、收缩的目标元素
        let slib = target.nextElementSibling as HTMLElement
        // 目标当前是否为收缩状态

        let isHide = slib.style.display === "none"
        // 点了地区名，就改变展开、收缩的状态
        slib.style.display = isHide ? "inline-block" : "none"
        // 特别标识已展开的地区
        if (isHide) {
          target.classList.add("success-text")
        } else {
          target.classList.remove("success-text")
        }
      }}>{props.country}</strong>
      <ul className="col scrollable" style={{display: "none", maxHeight: "85vh"}}>
        {channels}
      </ul>
    </li>
  )
}

// 单个频道的组件
const CHItem = function (props: { ch: Channel }) {
  return (
    <li className="row margin-v">
      <Avatar className="margin-right-large" src="/icons/sign/loading.svg" srcSet={props.ch.logo} size="small"/>
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
        message.error("获取 IPTV 直播地址的列表时出错")
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
    <ul className="col wrap vh100per padding aligin-content-start">
      <li style={{order: -10000, width: 220}}>
        共 {Object.getOwnPropertyNames(iptvs).length} 个地区，{total} 个频道
      </li>
      {channels}
    </ul>
  )
}
