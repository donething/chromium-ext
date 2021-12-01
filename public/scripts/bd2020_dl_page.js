// BD 影视 https://www.bd2020.com/
// 直接显示下载链接列表

if (/^\/\w+?\/\d+\.htm$/.test(window.location.pathname)) {
  // 调用网站脚本的函数
  bdfilm.downurl.init(0, 0, 1);
  console.log("[BD2020]", "已显示下载链接列表");
}