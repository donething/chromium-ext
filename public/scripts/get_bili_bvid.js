// 获取、设置B站视频的 id 和 bvid
// 扩展脚本内无法直接访问网站脚本的 window 对象，所以向 DOM 中插入 JS 来访问

!function () {
  // 包含视频信息的元素的 id，在内容脚本同通过该 id 获取视频信息
  let elemID = "doi-video-info";
  document.querySelector(`#${elemID}`)?.remove();

  // 查找 id、bvid 所在地变量
  let doBVid = (typeof bvid !== "undefined" ? bvid : "") || window?.__INITIAL_STATE__?.bvid
    || "未适配的 bvid";
  let doVID = window?.__INITIAL_STATE__?.mediaInfo?.newestEp.id || doBVid
    || "未适配的 vid";

  let doCover = window?.__INITIAL_STATE__?.videoData?.pic || window?.__INITIAL_STATE__?.epInfo?.cover
    || "未适配的 cover";
  // 若网址如 "//i0.hdslb.com/bfs/a.jpg"，则在前面添加"https://"，以免因没有协议浏览器无法识别为网址
  if (doCover.indexOf("//") === 0) {
    doCover = "https:" + doCover;
  }
  // 视频名 ".media-title"表示官方发布的电视剧，".video-title"表示单个视频或用户上传的电视剧
  let name = document.querySelector(".media-title")?.textContent ||
    document.querySelector(".video-title")?.textContent ||
    "未适配的视频网址的标题";

  // 视频信息
  let data = {
    id: doVID,
    bvid: doBVid,
    cover: doCover,
    title: name
  };

  // 创建包含了 id、bvid 信息的 HTML 元素
  let input = document.createElement("input");
  input.id = elemID;
  input.value = JSON.stringify(data);
  input.style.display = "none";
  document.body.appendChild(input);

  console.log("[BiliIn]", "内嵌JS代码获取的视频信息：", data);
}();
