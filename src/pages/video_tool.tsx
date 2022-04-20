import {AutoComplete, Button, Input, message, Space} from "antd"
import React, {CSSProperties, useEffect, useRef, useState} from "react"
import {request} from "do-utils/dist/utils"
import "./video_tool.css"

// SSE 接收的消息
interface SSEMsg {
  id: number
  success: boolean
  msg: string
  data: any
}

interface OptionData {
  value: string
}

// 服务端地址
const ADDR = "http://127.0.0.1:8021"

// 重命名的日志项
const RnLogItem = function (props: { sseMsg: SSEMsg }) {
  let path = props.sseMsg.data.replaceAll("\\", "/")
  return (
    <li className="padding-v border-bottom" style={{fontSize: "smaller"}}>
      <span style={{fontWeight: "bold"}}>{`${props.sseMsg.msg}：`}</span>
      <span title={`点击播放 "${path}"`} className={`clickable ${props.sseMsg.success ? "" : 'focus-text'}`}
            onClick={async () => {
              // 请求后台服务显示文件
              let resp = await request(`${ADDR}/api/openfile`, {method: "open", path: path})
              let result = await resp.json()
              if (result.errcode !== 0) {
                console.log(`显示文件'${result.msg}'出错：`, result.data)
              }
            }}>{path}
      </span>
    </li>
  )
}
// 重命名组件
const Rename = function (props: {
  sseRef: React.RefObject<EventSource>,
  hashRef: React.MutableRefObject<string>
  style: CSSProperties
}) {
  const [working, setWorking] = useState(false)
  const [logs, setLogs] = useState<Array<SSEMsg>>([])
  const [options, setOptions] = useState<Array<OptionData>>([])

  useEffect(() => {
    const init = async () => {
      // 监听重命名的消息
      if (!props.sseRef.current) {
        message.warn("SSE 消息对象为空，无法为重命名添加监听器")
        return
      }
      // 自定义事件避免"TS2769: No overload matches this call"，而转为 EventListener
      props.sseRef.current.addEventListener("rename_update", ((e: MessageEvent) => {
        // console.log(`[SSE Rename] ${event.data}`);
        // 解析消息
        setLogs(prev => [...prev, JSON.parse(e.data)])
      }) as EventListener)

      // 设置自动填充输入框的视频路径
      let data = await chrome.storage.local.get({videoPaths: null})
      if (data.videoPaths) {
        setOptions(data.videoPaths)
      }
    }
    init()
  }, [])

  // 重命名
  const onRename = async (path: string) => {
    path = path.trim().replaceAll("\\", "/")
    if (!path) return

    setWorking(true)
    setLogs([])
    // 添加新路径为自动完成选项
    setOptions(prev => prev.find(v => v.value === path) ? [...prev] : [...prev, {value: path}])

    // 开始重命名
    let resp = await request(`${ADDR}/api/fanhao/rename`, {hash: props.hashRef.current, paths: [path]})
    let result = await resp.json()

    if (result.errcode !== 0) {
      setWorking(false)
      console.log("重命名失败，请求参数错误：", result)
      message.error("重命名失败，请求参数错误")
      return
    }

    setWorking(false)
    console.log(`已完成重命名操作：'${path}'`)
    message.success("已完成重命名操作")

    // 保存自动完成输入框的选项（视频路径）到存储
    // 因为 setState() 为异步执行，所以此处无法简单使用 {videoPaths: options}
    let data = await chrome.storage.local.get({videoPaths: []})
    if (!data.videoPaths.find((e: OptionData) => e.value === path)) {
      data.videoPaths.push({value: path})
      chrome.storage.local.set({videoPaths: data.videoPaths})
    }
  }

  return (
    <div className="col padding border" style={props.style}>
      <AutoComplete className="width-100per" disabled={working} size="small"
                    options={options} onSelect={onRename}>
        <Input.Search placeholder="目标视频文件夹的路径" enterButton="重命名" size="small" onSearch={onRename}/>
      </AutoComplete>

      <ul className="col padding scrollable">
        {logs.map(sseMsg => <RnLogItem sseMsg={sseMsg}/>)}
      </ul>
    </div>
  )
}

// 查找本地字幕文件
const Subtitle = function (props: { style: CSSProperties }): JSX.Element {
  const [paths, setPaths] = useState<Array<string>>([])
  const [working, setWorking] = useState(false)

  const onQuery = async function (value: string) {
    setWorking(true)

    let url = `${ADDR}/api/fanhao/subtitle`
    let resp = await request(url, {fanhao: value})
    let result = await resp.json()

    // 查找出错
    if (result["errcode"] !== 0) {
      console.log("查找字幕出错：", result.msg)
      message.warn(`查找字幕出错：${result.msg}`)
      setWorking(false)
      return
    }

    // 赋值以填充界面
    if (result.data.length >= 1) {
      setPaths(result.data)
    } else {
      message.info("没有找到字幕文件")
    }

    setWorking(false)
  }

  return (
    <div className="col padding border" style={props.style}>
      <Input.Search placeholder="需要搜索的关键字" disabled={working} enterButton="查找字幕" size="small"
                    onSearch={onQuery}>
      </Input.Search>

      <ul className="col scrollable-y">
        {paths.map(path =>
          <li>
            <Button type="text" title={path} onClick={() => {
              chrome.runtime.sendMessage({
                cmd: "cors",
                url: `${ADDR}/api/openfile`,
                data: {method: "show", path: path}
              })
            }}>
              {// 提取文件名
                path.indexOf("/") >= 0 ? path.substring(path.lastIndexOf("/") + 1) :
                  path.indexOf("\\") >= 0 ? path.substring(path.lastIndexOf("\\") + 1) : path}
            </Button>
          </li>
        )}
      </ul>
    </div>
  )
}


// 下载流视频的状态项
const DlStatusItem = function (props: { index: number, success: boolean | undefined, url: string }) {
  let bg = props.success === true ? "success-bg" : props.success === false ? "fail-bg" : ""

  return (
    <li className={`dl-status-item ${bg}`}>
      {props.index + 1}
    </li>
  )
}
// 下载流视频的组件
const DlVideo = function (props: {
  sseRef: React.RefObject<EventSource>,
  hashRef: React.MutableRefObject<string>
  style: CSSProperties
}) {
  // 输入的视频下载地址
  const videoUrlRef = useRef("")
  const totalRef = useRef(0)
  const doneRef = useRef(0)

  // 分段视频的下载进度
  // 表示当前分段的下载状态：还未下载(undefined)、下载成功(true)、下载失败(false)
  const [status, setStatus] = useState<{ [url: string]: boolean | undefined }>({})
  // 是否正在工作中，以判断禁用开始按钮
  const [working, setWorking] = useState(false)
  // 重试下载按钮是否禁用（仅在有下载失败的情况下可用）
  const [disRetry, setDisRetry] = useState(true)

  useEffect(() => {
    // 监听重命名的消息
    if (!props.sseRef.current) {
      message.warn("SSE 消息对象为空，无法为下载添加监听器")
      return
    }
    // 自定义事件避免"TS2769: No overload matches this call"，而转为 EventListener
    props.sseRef.current.addEventListener("videodl_update", ((e: MessageEvent) => {
      let result: SSEMsg = JSON.parse(e.data)
      if (result.success) {
        doneRef.current++
      } else {
        setDisRetry(false)
      }

      // 填充下载结果，以在界面显示
      // console.log("[SSE DL] 下载了视频", result.data);
      setStatus(prev => ({...prev, [result.data]: result.success}))

      // 当视频片段下载成功的数量等于总片段数量时，可以开始合并视频
      if (doneRef.current === totalRef.current) {
        combine()
      }
    }) as EventListener)
  }, [])

  // 下载
  const onDownload = async (addr: string) => {
    if (!addr) return
    // 初始化
    setWorking(true)
    videoUrlRef.current = addr
    totalRef.current = 0
    doneRef.current = 0
    setStatus({})

    // 发送下载请求
    let body = {hash: props.hashRef.current, addr: addr}
    let resp = await request(`${ADDR}/api/video/dl`, body)
    let result = await resp.json()
    if (result.errcode !== 0) {
      console.log("初始化视频下载出错：", result.msg)
      message.error("初始化视频下载出错")
      setWorking(false)
      return
    }

    // 根据返回的数据，填充界面
    let data: Array<string> = result.data
    totalRef.current = data.length
    for (let url of data) {
      setStatus(prev => ({...prev, [url]: undefined}))
    }
    console.log("服务端正在下载视频分段，请等待……")
  }

  // 重试下载失败的片段
  const onDLRetry = async () => {
    // 提取没有成功下载的视频片段的链接
    let urls = []
    for (const [url, success] of Object.entries(status)) {
      if (!success) {
        urls.push(url)
      }
    }
    if (urls.length === 0) return

    console.log(`重试下载 ${urls.length} 个视频片段`)
    message.info(`重试下载 ${urls.length} 个视频片段`)
    let body = {hash: props.hashRef.current, addr: videoUrlRef.current, sections_addr: urls}
    request(`${ADDR}/api/video/dl/sections`, body)
  }

  // 发送合并视频的请求
  const combine = async () => {
    setDisRetry(true)

    console.log("开始合并视频")
    message.info("开始合并视频")
    let body = {hash: props.hashRef.current, addr: videoUrlRef.current}
    let resp = await request(`${ADDR}/api/video/combine`, body)
    // 解析响应
    let result = await resp.json()
    if (result.errcode !== 0) {
      setWorking(false)
      console.log("合并视频出错：", result.msg, result.data)
      message.error("合并视频出错：", result.msg)
      return
    }

    console.log("合并视频已完成")
    message.success("合并视频已完成")
    setWorking(false)
  }

  return (
    <div className="col padding border" style={props.style}>
      <Input.Search placeholder="视频流的地址" disabled={working} enterButton="下载" size="small"
                    onSearch={onDownload}>
      </Input.Search>
      <div className="row justify-between align-center padding border-bottom">
        <span>已下载 {doneRef.current} 个视频，共 {totalRef.current} 个</span>
        <Button onClick={onDLRetry} disabled={disRetry} size="small">重试失败</Button>
      </div>
      <ul className="row wrap scrollable" id="dl-status">
        {Object.entries(status).map((value, index) =>
          <DlStatusItem key={value[0]} index={index} success={value[1]} url={value[0]}/>
        )}
      </ul>
    </div>
  )
}

// 视频工具组件
const VideoTool = function () {
  // 本次 SSE 连接的标识
  const hashRef = useRef(String(Date.now()))
  // SSE 接收消息的秘钥
  const sseRef = useRef<EventSource>(new EventSource(`${ADDR}/api/sse?hash=${hashRef.current}`))

  const bindSSE = function () {
    // 接收消息，成功收到某消息后才开始
    sseRef.current.onmessage = event => {
      console.log(`[SSE] ${event.data}`)
    }
    // 处理错误
    sseRef.current.onerror = _ => {
      if (sseRef.current.readyState === EventSource.CLOSED) {
        message.info(`[SSE] 已关闭连接`)
        console.log(`[SSE] 已关闭连接`)
        return
      }
      message.error(`[SSE] 连接服务端出错`)
      console.log(`[SSE] 连接服务端出错`)
    }
  }

  useEffect(() => {
    document.title = `视频工具 - ${chrome.runtime.getManifest().name}`

    // 和服务端建立 SSE 消息通道
    // 该请求需要使用 GET 方法，不能使用 POST，所以参数 hash 通过查询字符串提供
    bindSSE()

    // 每隔 1 分钟发送 SSE 的心跳
    setInterval(async () => {
      console.log(`[SSE] 发送心跳`)
      let resp = await request(`${ADDR}/api/sse/tick`, {hash: hashRef.current})
      let result = await resp.json()
      console.log(`[SSE] ${result.msg}`)
    }, 60 * 1000)
  }, [])

  return (
    <Space direction="horizontal">
      <Subtitle style={{width: 350, height: "100vh", background: "#FFF"}}/>
      <Rename sseRef={sseRef} hashRef={hashRef} style={{width: 350, height: "100vh", background: "#FFF"}}/>
      <DlVideo sseRef={sseRef} hashRef={hashRef} style={{width: 350, height: "100vh", background: "#FFF"}}/>
    </Space>
  )
}

export default VideoTool