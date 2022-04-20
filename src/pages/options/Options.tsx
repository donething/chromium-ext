import {BackupPanel} from "../../comm/antd"
import React, {useEffect, useState} from "react"
import {Card, CardContent, FormControlLabel, FormGroup, IconButton, Stack, Switch, TextField} from "@mui/material"
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'

// 存储到 Chrome storage 中的设置的键名，指向是否启用某功能
export const EN_BILI = "enableBiliVideo"
export const EN_JAVLIB = "enableJavlib"
export const EN_TS = "enableTranslate"
export const EN_V2EX = "enableV2ex"
export const EN_VISB = "enableDisableVisibilityAPI"

// 存储读取 Chrome storage 中的设置，用来显示
class EnablesFunc {
  bili: boolean = true
  javlib: boolean = true
  translate: boolean = true
  v2ex: boolean = true
  visibility: boolean = true
}

// 功能开关
const Enables = () => {
  const [enables, setEnables] = useState(new EnablesFunc())

  useEffect(() => {
    const init = async () => {
      let data = await chrome.storage.sync.get({settings: {}})
      setEnables({
        bili: data.settings[EN_BILI] !== false,
        javlib: data.settings[EN_JAVLIB] !== false,
        translate: data.settings[EN_TS] !== false,
        v2ex: data.settings[EN_V2EX] !== false,
        visibility: data.settings[EN_VISB] !== false
      })
    }

    init()
  }, [])

  // 将开关变更保存到存储中
  let onSwitch = async (checked: boolean, property: string, key: string) => {
    setEnables(prev => ({...prev, [property]: checked}))

    let data = await chrome.storage.sync.get({settings: {}})
    data.settings[key] = checked
    chrome.storage.sync.set({settings: data.settings})
  }

  return (
    <Card>
      <CardContent>
        <span>准许功能</span>
        <hr/>
        <FormGroup>
          <FormControlLabel label="哔哩哔哩" control={
            <Switch checked={enables.bili}
                    onChange={e => onSwitch(e.target.checked, "bili", EN_BILI)}/>}
          />

          <FormControlLabel label="Javlib" control={
            <Switch checked={enables.javlib}
                    onChange={e => onSwitch(e.target.checked, "javlib", EN_JAVLIB)}/>}
          />

          <FormControlLabel label="Translate" control={
            <Switch checked={enables.translate}
                    onChange={e => onSwitch(e.target.checked, "translate", EN_TS)}/>}
          />

          <FormControlLabel label="V2ex" control={
            <Switch checked={enables.v2ex}
                    onChange={e => onSwitch(e.target.checked, "v2ex", EN_V2EX)}/>}
          />

          <FormControlLabel label="Disable Visibility API" control={
            <Switch checked={enables.visibility}
                    onChange={e => onSwitch(e.target.checked, "visibility", EN_VISB)}/>}
          />
        </FormGroup>
      </CardContent>
    </Card>
  )
}

// javlib 广告关键字（以"|"分隔）
const JavAds = () => {
  const [value, setValue] = useState("")
  useEffect(() => {
    const init = async () => {
      let data = await chrome.storage.sync.get({settings: {javlibAds: ""}})
      setValue(data.settings.javlibAds)
    }
    init()
  }, [])
  return (
    <Card>
      <CardContent>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <span>Javlib</span>

          <IconButton title={"保存"} color={"primary"} onClick={async _ => {
            let data = await chrome.storage.sync.get({settings: {javlibAds: ""}})
            data.settings.javlibAds = value
            chrome.storage.sync.set({settings: data.settings})
            // message.success("已保存 广告关键字")
          }}>
            <SaveOutlinedIcon/>
          </IconButton>
        </Stack>

        <hr/>

        <TextField value={value} multiline rows={15} label={"广告关键字，以'|'分隔"}
                   onChange={e => setValue(e.target.value)}/>
      </CardContent>
    </Card>
  )
}

const Options = () => {
  useEffect(() => {
    document.title = `选项 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <Stack direction={"row"} spacing={2}>
      <Enables/>
      <JavAds/>
      <BackupPanel/>
    </Stack>
  )
}

export default Options
