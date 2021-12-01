// [javascript - HTML5 Volume Increase Past 100% - Stack Overflow]
// (https://stackoverflow.com/questions/43794356/html5-volume-increase-past-100)
!function () {
  // 查找媒体元素
  // 先在首层document中查找媒体元素
  let media = findLargestPlayingVideo(document) || document.querySelector("audio");
  if (!media) {
    // 首层没有找到时，从iframe中查找
    let iframes = document.querySelectorAll("iframe");
    for (const f of iframes) {
      media = findLargestPlayingVideo(f.contentWindow.document)
        || document.querySelector("audio");
      // 已找到，退出查找
      if (media) {
        break;
      }
    }
  }

  // 最终都没有找到媒体元素时，退出执行
  if (!media) {
    console.log("未发现媒体元素，退出音量增强器");
    // -1 为没有找到的标志
    chrome.runtime.sendMessage({cmd: "volume", volume: -1});
    return;
  }

  // 返回或修改媒体的音量增强
  if (!window.audioCtx) {
    // create an audio context and hook up the video element as the source
    window.audioCtx = new AudioContext();
    window.source = audioCtx.createMediaElementSource(media);

    // create a gain node
    window.gainNode = window.audioCtx.createGain();
    window.source.connect(window.gainNode);

    // connect the gain node to an output destination
    window.gainNode.connect(window.audioCtx.destination);
  }

  // Enhance the volume
  if (typeof volume === "undefined" || !volume) {
    chrome.runtime.sendMessage({cmd: "volume", volume: window.gainNode.gain.value});
  } else {
    window.gainNode.gain.value = volume;
    // 每次运行后设volume为 null，以判断是获取还是设置 volume
    volume = null;
  }
}();