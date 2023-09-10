// 根据收藏 ID 获取到收藏视频的响应信息
export namespace FavResp {
  export interface Resp {
    // 0 表示无错
    code: number
    message: string
    // 数据
    data: Data
  }

  export interface Data {
    info: Info
    medias: Media[]
    has_more: boolean
  }

  // 收藏夹的信息
  export interface Info {
    // 用户 ID
    id: number
    // 收藏夹的ID
    fid: number
    // 用户 MID
    mid: number
    attr: number
    // 收藏夹的标题
    title: string
    // 收藏夹的封面
    cover: string
    // UP 主的信息
    upper: Upper
    type: number
    // 收藏夹的介绍
    intro: string
    // 创建时间。如 1438895296
    ctime: number
    // 修改时间。如 1438895296
    mtime: number
    state: number
    fav_state: number
    like_state: number
    // 其中的视频数量
    media_count: number
  }

  // UP 主的信息
  export interface Upper {
    mid: number
    name: string
    // 头像
    face: string
    followed: boolean
    vip_type: number
    vip_statue: number
  }

  // 视频集的信息
  export interface Media {
    // 视频集的 ID。如 19110507
    id: number
    type: number
    // 视频集的标题
    title: string
    // 视频集的封面
    cover: string
    // 视频集的介绍
    intro: string
    // 视频集的集数
    page: number
    // 视频集的总时长
    duration: number
    // UP 主的信息
    upper: MediaUpper
    attr: number
    // 播放、弹幕等信息
    cnt_info: CntInfo
    // 应用内链接。如 "bilibili://video/19150107"
    link: string
    // 创建时间。如 1438895296
    ctime: number
    // 发布时间。如 1438895296
    pubtime: number
    // 收藏时间。如 1438895296
    fav_time: number
    // 视频 ID。如 "BV1jW611J761"
    bv_id: string
    // 视频 ID。如 "BV1jW611J761"
    bvid: string
    season: any
  }

  export interface MediaUpper {
    mid: number
    name: string
    face: string
  }

  // 播放、弹幕等信息
  export interface CntInfo {
    // 被收藏的人数
    collect: number
    // 弹幕数量
    danmaku: number
    // 播放次数
    play: number
    // 播放次数的文本格式
    view_text_1: string
  }
}
