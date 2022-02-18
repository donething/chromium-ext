// [javascript - HTML5 Volume Increase Past 100% - Stack Overflow]
// (https://stackoverflow.com/questions/43794356/html5-volume-increase-past-100)
if (typeof window.enhanceVolume !== "function") {
  /**
   * 设置音量增强的值
   * @param {number} [volumeEnhanceValue] 当值为空时，发送当前页面的媒体之前被设置的值
   */
  window.enhanceVolume = function (volumeEnhanceValue) {
    // 向 popup.html 发送当前音量增强值
    const sendVol = (vol) => {
      console.log("[EnVol]", `当前音量增强值：${vol}`);
      // 将 URL 加上前缀，已标识是音量增加值改变
      chrome.runtime.sendMessage({cmd: "volumeEnhance", volumeEnhanceValue: vol});
    };

    // 查找媒体元素
    let media = findVideo(document)
      || document.querySelector("audio");

    // 最终都没有找到媒体元素时，退出执行
    if (!media) {
      console.log("[EnVol] 未发现媒体元素，退出音量增强器");
      // -1 为没有找到媒体元素的标志
      sendVol(-1);
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
    if (typeof volumeEnhanceValue === "undefined" || !volumeEnhanceValue) {
      sendVol(window.gainNode.gain.value);
    } else {
      window.gainNode.gain.value = volumeEnhanceValue;
    }
  };
}