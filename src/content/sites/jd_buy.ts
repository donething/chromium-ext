/**
 * 订购京东购物车中指定的商品
 */

import {waitForElem} from "do-utils/dist/elem"
import {sleep} from "do-utils"

// 标签
const TAG = "[JDBUY]"

// 购买指定商品
const buyJD = async (pid: string): Promise<boolean> => {
  console.log(TAG, `开始尝试下订单，商品'${pid}'`, `https://item.jd.com/${pid}.html`)

  // 购物车页面
  if (window.location.href.indexOf("https://cart.jd.com/cart_index") === 0) {
    // 查找目标商品
    // 等待商品元素被加载
    await waitForElem(`[id='${pid}']`, 20)
    console.log(TAG, "在购物车列表中，已找到目标商品")
    let pElem = document.querySelector(`[id='${pid}']`) as HTMLElement

    // 检查该商品被选中
    let checkElem = pElem.querySelector(".jdcheckbox") as HTMLInputElement
    if (!checkElem) {
      console.log(TAG, "在购物车列表中，没有该商品的选中框，可能为预购商品还未开启购买，暂时退出")
      return false
    }
    // 选中指定的商品
    if (!checkElem.checked) {
      checkElem.click()
    }
    await sleep(300)
    if (!checkElem.checked) {
      console.log(TAG, "在购物车列表中，无法选中该商品的选中框，可能已经无货，暂时退出")
      return false
    }

    // 提交
    await waitForElem(".common-submit-btn", 20)
    console.log(TAG, "在购物车页面，已找到提交按钮('.common-submit-btn')")
    let submitElem = document.querySelector(".common-submit-btn") as HTMLElement
    submitElem.click()
  }

  // 下订单页面
  if (window.location.href.indexOf("https://trade.jd.com/shopping/order/getOrderInfo.action") === 0) {
    await waitForElem("#order-submit")
    await sleep(50)
    // 查找下订单的按钮
    let submitElem = document.querySelector("#order-submit") as HTMLElement
    console.log(TAG, "在下订单页面，已找到提交按钮('#order-submit')")
    submitElem.click()
  }

  return true
}

// 奇遇Dream 256G 尊享版 VR一体机游戏机 骁龙XR2 赠20款游戏+奇遇年会员
// https://item.jd.com/100033551654.html
const start = async (pid: string) => {
  let success = await buyJD(pid)
  if (success) {
    console.log(TAG, "已完成订购商品，退出执行")
    return
  }

  console.log(TAG, "还未成功订购，将刷新再次订购")
  await sleep(300)
  window.location.reload()
}

// 开始
start("100033551654")