const TAG = "[CEXT]"

/**
 * 判断当前元素是否为输入框（Input、Textarea）
 * @param elem 目标元素
 */
export const isInputElem = (elem: HTMLElement): boolean => {
  return elem.tagName === "TEXTAREA" || elem.tagName === "INPUT"
}
