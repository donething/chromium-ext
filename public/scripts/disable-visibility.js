/**
 * 禁止网页检测是否切换到了后台
 * 将注入到DOM中
 * @see https://stackoverflow.com/questions/47660653/chrome-extension-how-to-disable-page-visibility-api
 */

// 修改 document 对象的属性
Object.defineProperty(Document.prototype, "hidden", {
    get: function () {
      // console.log("[visibility]", "网站读取网页可见性：'hidden'");
      return false
    },
    enumerable: true,
    configurable: true
  }
)

Object.defineProperty(Document.prototype, "visibilityState", {
    get: function () {
      // console.log("[visibility]", "网站读取网页可见性：'visibilityState'");
      return "visible"
    },
    enumerable: true,
    configurable: true
  }
)

// 捕获事情
for (let eventName of ["visibilitychange", "webkitvisibilitychange", "blur"]) {
  window.addEventListener(eventName, (event) => {
    // 跳过输入元素，避免自动完成输入下拉框不自动消失
    if (event.target.tagName === "INPUT") {
      return
    }

    event.stopImmediatePropagation()
  }, true)
}