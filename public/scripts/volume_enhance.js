// [javascript - HTML5 Volume Increase Past 100% - Stack Overflow]
// (https://stackoverflow.com/questions/43794356/html5-volume-increase-past-100)
if (typeof window.enhanceVolume !== "function") {
  const TAG = "[VolEn]";

  // 向 popup.html 发送当前音量增强值
  const sendVol = (vol) => {
    chrome.runtime.sendMessage({cmd: "volumeEnhance", value: vol});
  };

  /**
   * 设置音量增强的值
   * @param {number} [value] 当值为空时，发送当前页面的媒体之前被设置的值
   */
  window.enhanceVolume = function (value) {
    // 查找媒体元素
    let media = findVideo(document) || document.querySelector("audio");
    // 最终都没有找到媒体元素时，退出执行
    if (!media) {
      console.log(TAG, "未发现媒体元素，退出音量增强器");
      // -1 为没有找到媒体元素的标志
      sendVol(-1);
      return;
    }

    // 返回或修改媒体的音量增强
    if (!window._audioCtx) {
      // create an audio context and hook up the video element as the source
      window._audioCtx = new AudioContext();
      window._source = window._audioCtx.createMediaElementSource(media);

      // create a gain node
      window._gainNode = window._audioCtx.createGain();
      window._source.connect(window._gainNode);

      // connect the gain node to an output destination
      window._gainNode.connect(window._audioCtx.destination);
    }

    // Enhance the volume
    if (typeof value === "undefined" || !value) {
      sendVol(window._gainNode.gain.value);
    } else {
      console.log(TAG, "设置音量增强值：", window._gainNode.gain.value);
      window._gainNode.gain.value = value;
    }
  };
}
