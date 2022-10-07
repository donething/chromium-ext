// 帖子列表组件

import {message} from "antd"
import {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {History} from 'history'
import {request} from "do-utils/dist/utils"
import {copyText} from "do-utils/dist/elem"

// 帖子的信息
export interface Topic {
  // 帖子的 ID
  id: number
  // 帖子的标题
  title: string
  // 帖子的内容（纯文本格式）
  content: string
  // 帖子的内容（HTML 格式）
  content_rendered: string
  // 帖子的回帖数量，如 15
  replies: number
  // 帖子的链接
  url: string
  // 帖子所在节点的信息
  node: Node
  // 帖子发布者的信息
  member: Member
  // 帖子的发布时间，如 1638074275
  created: number
  // 最后回复的用户，如"Livid"
  last_reply_by: string
  // 最后被访问的时间，如 1638017308
  last_touched: number
  // 最后修改的时间，如 1638078749
  last_modified: number
  // 帖子是否已被删除，如 0
  deleted: number
}

// 节点的信息
export interface Node {
  // 节点的 ID
  id: number
  // 节点的中文名，如"水深火热"
  title: string
  // 节点的英文名，如"flamewar"
  name: string
  // 节点的图标地址
  avatar_large: string
  // 节点的链接
  url: string
  // 节点下帖子的数量
  topics: number
  // 节点的说明（HTML 格式）
  header: string
  // 关注的人数
  stars: number
  // 父节点名，如"flood"
  parent_node_name: string;
  // 是否为根节点
  root: boolean
}

// 用户的信息
export interface Member {
  // 用户 ID
  id: number
  // 用户名
  username: string
  // 用户的头像地址
  avatar_large: string
  // 用户的空间的链接
  url: string
  // 注册时间，如 1605082153
  created: number
}

// 帖子回复的信息
export interface Reply {
  // 该回复的 ID
  id: number
  // 回复者的 ID
  member_id: number
  // 回复者的信息
  member: Member
  // 帖子的 ID
  topic_id: number
  // 回复的内容（纯文本格式）
  content: string
  // 回复的内容（HTML 格式）
  content_rendered: string
  // 发布时间
  created: number
  // 最后修改的时间
  last_modified: number
  // 楼层（额外添加的属性）
  floor: number
}

// 帖子列表的项
const TopicItem = function (props: { topic: Topic, history: History }) {
  let topic = props.topic
  return (
    <li className="row border-bottom" style={{margin: "5px 0"}}>
      <img className="avatar-medium margin" src={topic.member.avatar_large} title={topic.member.username}/>

      <div className="col width-100per">
        <div className="row">
          <a className="posts-title width-fill-remain overflow-hide-line-one" href={topic.url}
             target="_blank" rel="noreferrer">
            {topic.title}
          </a>

          <span className="clickable post-extra margin-h put-right" title="左击浏览，右击复制链接" onClick={() => {
            props.history.push({pathname: "/view_topic", search: `?tid=${topic.id}`})
          }} onContextMenu={e => {
            copyText(document, topic.url)
            message.success("已复制帖子的链接")
            e.preventDefault()
            e.stopPropagation()
          }}>
            {topic.replies}
          </span>
        </div>

        <p className="post-description overflow-hide-line-multi lines-2">{topic.content}</p>
      </div>
    </li>
  )
}

// 浏览热门的帖子列表
const HotTopics = function () {
  // 存储帖子列表，用于显示
  const [topics, setTopics] = useState<Array<Topic>>([])
  // 用于页面跳转的 hook
  const history = useHistory()

  useEffect(() => {
    document.title = `热帖 - ${chrome.runtime.getManifest().name}`

    const init = async () => {
      // 水深火热的帖子
      let resp = await request("https://v2ex.com/api/topics/show.json?node_id=314&t=${Date.now()}")
      let list: Array<Topic> = await resp.json()
      for (const topic of list) {
        setTopics(prev => [...prev, topic])
      }
    }
    // 执行
    init()
  }, [])

  return (
    <div>
      <ul className="border" style={{width: "50%", margin: "0 auto", background: "#FFF"}}>
        {topics.map(topic => <TopicItem key={topic.id} topic={topic} history={history}/>)}
      </ul>
    </div>
  )
}

export default HotTopics