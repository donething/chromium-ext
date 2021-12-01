// 注意该文件包含使用 chrome.scripting.executeScript 执行.js（非.ts）代码时，需要调用的公用函数
// 而.ts文件会使用 do-utils 中的同名、同功能的函数

/**
 * 将 html 字符串转换为 Element
 *
 * 此方法可能会自动下载其中的图片等资源，如果仅需解析为 DOM，可以使用 domParser
 *
 * 1. 如果只有一个顶层元素，那么返回该 Element
 * 2. 如果有多个顶层元素，则将其用 div 包裹后返回
 * @param {string} str 需解析的html
 * @return {Element} 解析得到的 Node 对象
 * @see https://stackoverflow.com/a/494348/8179418
 */
const elemOf = function (str) {
  let div = document.createElement('div');
  div.innerHTML = str;

  // Change this to div.childNodes to support multiple top-level nodes
  if (div.children.length === 1) {
    return div.firstElementChild;
  }
  return div;
};

// Copyright 2018 Google LLC
/**
 * 获取当前网页中正在播放的占用最大面积的视频元素
 * @param {Document} doc 要查找的 Document 实例
 * @return {HTMLVideoElement} video 实例
 */
const findLargestPlayingVideo = function (doc) {
  /** @namespace video.disablePictureInPicture **/
  const videos = Array.from(doc.querySelectorAll('video'))
    .filter(video => video.readyState !== 0)
    // .filter(video => video.disablePictureInPicture === false)
    .sort((v1, v2) => {
      const v1Rect = v1.getClientRects()[0] || {width: 0, height: 0};
      const v2Rect = v2.getClientRects()[0] || {width: 0, height: 0};
      return ((v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height));
    });

  if (videos.length === 0) {
    return undefined;
  }
  return videos[0];
};