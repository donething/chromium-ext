/**
 * 设置
 */
export type Settings = {
  disables?: DisableSettings

  javlibAds?: string
}

/**
 * 设置中的准许选项
 */
export type DisableSettings = {
  biliVideo?: boolean

  javlib?: boolean

  translate?: boolean

  v2ex?: boolean

  visibilityAPI?: boolean
}