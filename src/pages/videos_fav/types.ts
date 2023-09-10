// 视频信息
import React from "react";

export interface VideoInfo {
  extra: {
    cover: string
    id: string
    title: string
  }
  time: {
    // 片头曲开始时间
    end: string
    // 片尾曲开始时间
    open: string
  }
}

export interface VideoItemProps {
  plat: string
  video: VideoInfo
  setFolders: React.Dispatch<React.SetStateAction<Array<JSX.Element>>>
}