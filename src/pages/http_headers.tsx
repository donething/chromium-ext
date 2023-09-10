import {useEffect, useState} from "react"
import {Button, FormControl, FormControlLabel, RadioGroup, Radio, Stack, TextField} from "@mui/material"
import {useSharedSnackbar} from "do-comps"

/**
 * 将数组形式的请求头键值对转换为字符串
 * @param headers 请求头的数组，如 ["Host: www.hdsay.net", "Connection: keep-alive"]
 * @returns 如 {"Host": "www.hdsay.net", "Connection": "keep-alive"}
 */
const toKV = function (headers: Array<string>) {
  let obj: { [header: string]: string } = {}
  for (let header of headers) {
    let [key, value] = header.split(": ")
    obj[key.trim()] = value.trim()
  }

  // 转为字符串
  let str = JSON.stringify(obj, null, 2)
  // 去除请求头的值中可能存在的引号而出现的'\"'
  return str.replaceAll('\\"', "")
}

// 将请求头转换为指定语言的格式
const HttpHeaders = () => {
  // 目标语言
  const [lang, setLang] = useState("js")
  // 源请求头的文本
  const [srcText, setSrcText] = useState("")
  // 转为目标语言请求头的文本
  const [dstText, setDstText] = useState("")

  const {showSb} = useSharedSnackbar()

  useEffect(() => {
    document.title = `转换请求头 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <Stack gap={2} padding={2}>
      <Stack direction={"row"} gap={2}>
        <FormControl>
          <RadioGroup row defaultValue={lang} onChange={e => setLang(e.target.value)}>
            <FormControlLabel value="js" control={<Radio size={"small"}/>} label="JavaScript"/>
            <FormControlLabel value="go" control={<Radio size={"small"}/>} label="Golang"/>
          </RadioGroup>
        </FormControl>

        <Button variant={"contained"} size="small" onClick={() => {
          // 每行都为一个请求头，分割后过滤得到有效请求头（包含": "则为有效），再转为字符串格式
          let str = toKV(srcText.split("\n").filter(item => item.indexOf(": ") !== -1))
          switch (lang) {
            case "js":
              setDstText("let headers = " + str)
              break
            case "go":
              setDstText("var headers = map[string]string" + str)
              break
            default:
              console.log(`未适配的目标语言：${lang}`)
              showSb({open: true, message: `未适配的目标语言：${lang}`, severity: "warning"})
          }
        }}>
          转换
        </Button>
      </Stack>

      <Stack direction={"row"}>
        <TextField
          multiline
          value={srcText}
          placeholder="源请求头"
          rows={25}
          size={"small"}
          style={{width: 600}}
          onChange={e => setSrcText(e.target.value)}
          onScroll={e => {
            let srcScrollTop = (e.target as HTMLElement).scrollTop
            let dst = document.querySelector("#doi-dst-headers") as HTMLElement
            // 还需增加目标输入框首行的高度，才能匹配到源输入框的首行
            dst.scrollTop = srcScrollTop + parseFloat(window.getComputedStyle(dst).lineHeight)
          }}
        />

        <TextField
          multiline
          id="doi-dst-headers"
          value={dstText}
          placeholder="目标语言请求头"
          rows={25}
          size={"small"}
          style={{width: 600, marginLeft: 10}}
          onChange={e => setDstText(e.target.value)}
        />
      </Stack>
    </Stack>
  )
}

export default HttpHeaders