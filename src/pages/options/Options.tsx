import React, {useEffect, useState} from "react"
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  FormControlLabel, Stack,
  Switch,
  TextField, Typography
} from "@mui/material";
import {DoBackupPanelChromium, useSharedSnackbar} from "do-comps";
import {DisableSettings, Settings} from "./types"

// 禁用功能的开关
const Disable = () => {
  const [disables, setDisables] = React.useState<DisableSettings>({})

  const init = React.useCallback(async () => {
    let data = await chrome.storage.sync.get({settings: {}})
    const settings: Settings = data.settings
    if (!settings.disables) {
      settings.disables = {}
    }

    setDisables(data.settings.disables)
  }, [])

  // 将开关变更保存到存储中
  const onSwitch = React.useCallback(async (value: boolean, key: keyof DisableSettings) => {
    const data = await chrome.storage.sync.get({settings: {}})

    setDisables(prev => {
      const n = {...prev, [key]: value}
      data.settings.disables = n
      chrome.storage.sync.set({settings: data.settings})
      return n
    })
  }, [])

  useEffect(() => {
    init()
  }, [init])

  return (
    <Card sx={{width: 300}}>
      <CardHeader title={"禁用功能"}/>

      <Divider/>

      <CardContent sx={{display: "flex", flexFlow: "column nowrap", gap: 4}}>
        <FormControlLabel label="哔哩哔哩"
                          control={<Switch title={"是否禁用"} size={"small"}
                                           checked={disables.biliVideo}
                                           onChange={e => onSwitch(e.target.checked, "biliVideo")}/>}/>

        <FormControlLabel label="Javlib"
                          control={<Switch title={"是否禁用"} size={"small"}
                                           checked={disables.javlib}
                                           onChange={e => onSwitch(e.target.checked, "javlib")}/>}/>

        <FormControlLabel label="Translate"
                          control={<Switch title={"是否禁用"} size={"small"}
                                           checked={disables.translate}
                                           onChange={e => onSwitch(e.target.checked, "translate")}/>}/>

        <FormControlLabel label="V2ex"
                          control={<Switch title={"是否禁用"} size={"small"}
                                           checked={disables.v2ex}
                                           onChange={e => onSwitch(e.target.checked, "v2ex")}/>}/>

        <FormControlLabel label="Visibility API"
                          control={<Switch title={"是否禁用"} size={"small"}
                                           checked={disables.visibilityAPI}
                                           onChange={e => onSwitch(e.target.checked, "visibilityAPI")}/>}/>
      </CardContent>
    </Card>
  )
}

// javlib 广告关键字（以"|"分隔）
const JavAds = () => {
  const [value, setValue] = useState("")

  const {showSb} = useSharedSnackbar()

  const init = React.useCallback(async () => {
    let data = await chrome.storage.sync.get({settings: {javlibAds: ""}})
    setValue(data.settings.javlibAds)
  }, [])

  useEffect(() => {
    init()
  }, [init])

  return (
    <Card sx={{width: 300}}>
      <CardHeader title={"Javlib 广告关键字"}/>

      <Divider/>

      <CardContent sx={{display: "flex", flexFlow: "column nowrap", gap: 4}}>
        <Stack gap={1}>
          <Typography>(以'|'分隔)</Typography>
          <TextField multiline value={value} rows={10} size={"small"}
                     onChange={e => setValue(e.target.value)}/>
        </Stack>
      </CardContent>

      <CardActions>
        <Button variant={"contained"} onClick={async _ => {
          const data = await chrome.storage.sync.get({settings: {}})

          data.settings.javlibAds = value
          await chrome.storage.sync.set({settings: data.settings})
          showSb({open: true, message: "已保存广告关键字", severity: "success"})
        }}>
          保存
        </Button>
      </CardActions>
    </Card>
  )
}

const Options = function () {
  useEffect(() => {
    document.title = `选项 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <Stack direction={"row"} padding={2} gap={2}>
      <Disable/>

      <JavAds/>

      <DoBackupPanelChromium/>
    </Stack>
  )
}

export default Options