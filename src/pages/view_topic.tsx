// 查看帖子
import React, {useEffect, useRef, useState} from "react"
import {useLocation} from "react-router-dom"
import {Reply, Topic} from "./hot_topics"
import {date} from "do-utils"
import {message} from "antd"
import {request} from "do-utils/dist/utils"

// 查看帖子
// 可通过查询字符串传递参数："?tid=123456"
export const ViewV2exTopic = function () {
  // 用于设置帖子的发布者，用于在回复列表中标识为“楼主”
  let authorIDRef = useRef(0)

  // 读取当前 URL的 query string 参数
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  // 获取帖子的 ID：优先从参数中获取
  let tid = params.get("tid") || ""

  useEffect(() => {
    document.title = `查看帖子 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <div className="border" style={{width: "50%", margin: "0 auto"}}>
      <Content tid={tid} authorIDRef={authorIDRef}/>
      <Repies tid={tid} authorIDRef={authorIDRef}/>
    </div>
  )
}

// 帖子的标题、内容
const Content = function (props: { tid: string, authorIDRef: React.MutableRefObject<number> }) {
  const [topic, setTopic] = useState<Topic | null>()
  useEffect(() => {
    const init = async () => {
      setTopic(null)
      // 获取帖子的内容
      let topicResp = await request(`https://v2ex.com/api/topics/show.json?id=${props.tid}`)
      let topic: Topic = (await topicResp.json())[0]
      if (!topic) {
        message.warn("无法获取该帖子的内容")
        console.log(`无法获取该帖子"${props.tid}"的内容`)
        return
      }
      props.authorIDRef.current = topic.member.id
      setTopic(topic)
    }
    // 执行
    init()
  }, [props.tid])

  if (!topic) {
    return <div/>
  }

  return (
    <div className="col padding">
      <div className="row justify-between">
        <img className="avatar-medium margin" src={topic.member.avatar_large}/>

        <div className="col width-100per">
          <a className="post-title" href={topic.url} target="_blank">{topic.title}</a>

          <div className="row justify-between width-100per">
            <a className="post-extra" href={topic.member.url} target="_blank">{topic.member.username}</a>

            <div className="row justify-end margin-v">
              <div className="post-extra">{date({date: new Date(topic.created * 1000)})}</div>
              <a className="post-extra margin-h-large" href={topic.node.url} target="_blank">{topic.node.title}</a>
            </div>
          </div>
        </div>
      </div>
      {topic.content_rendered &&
      <div className="post-content padding-v" dangerouslySetInnerHTML={{__html: topic.content_rendered}}/>
      }
    </div>
  )
}

// 回复项
const ReplyItem = function (props: { reply: Reply, index: number, authorID: number }) {
  const reply = props.reply
  return (
    <li className="col border-top" style={{padding: "5px 0"}}>
      <div className="row do-width-100per">
        <img className="avatar-medium margin" src={reply.member.avatar_large}/>

        <div className="col width-100per">
          <div className="row justify-between width-100per">
            <span>
              <a className="post-extra" href={reply.member.url} target="_blank">{reply.member.username}</a>
              {reply.member.id === props.authorID &&
              <span className="is-marked margin-h">[楼主]</span>
              }
            </span>

            <div className="row justify-end post-extra">
              <span className="margin-h">{date({date: new Date(reply.created * 1000)})}</span>
              <span className="margin-h">#{props.index + 1}</span>
            </div>
          </div>

          <div className="post-content" dangerouslySetInnerHTML={{__html: reply.content_rendered}}/>
        </div>
      </div>
    </li>
  )
}
// 帖子的回复列表
const Repies = function (props: { tid: string, authorIDRef: React.MutableRefObject<number> }) {
  const [replies, setReplies] = useState<Array<Reply>>([])

  useEffect(() => {
    const init = async () => {
      setReplies([])
      // 获取该贴的回复列表
      let repliesResp = await request(`https://v2ex.com/api/replies/show.json?topic_id=${props.tid}`)
      let text = await repliesResp.text()
      // 因为 @用户 的网址不带有协议和域名，所以手动搜索追加
      let nText = text.replaceAll("/member/", "https://v2ex.com/member/")
      let allReplies: Array<Reply> = JSON.parse(nText)
      allReplies.forEach((reply, index) => {
        reply.floor = index
        setReplies(prev => [...prev, reply]
        )
      })
    }
    // 执行
    init()
  }, [props.tid])

  return (
    <ul>
      {replies.map(reply => <ReplyItem key={reply.id} reply={reply} index={reply.floor}
                                       authorID={props.authorIDRef.current}/>)
      }
    </ul>
  )
}