// 频道信息
export type Channel = {
  // 频道名，如"1+1 Hello"
  name: string
  // logo 地址，可能为空
  logo: string | undefined
  // 直播源地址，如"https://example.com/playlist.m3u8"
  url: string
  // 分类，如"Movies"、"Music"
  category: string | undefined
  // 频道语言，[ { "code": "eng", "name": "English" } ]
  languages: Array<{ code: string, name: string }>
  // 地区：[ { "code": "cn", "name": "China" } ]
  countries: Array<{ code: string, name: string }>
}