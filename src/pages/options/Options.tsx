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

// 功能开关
const Functions = () => {
  // 将开关变更保存到存储中
  let onSwitch = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    let data = await chrome.storage.sync.get({settings: {}})
    data.settings[key] = e.target.checked
    chrome.storage.sync.set({settings: data.settings})
  }

  return (
    <Card sx={{width: 300}}>
      <CardHeader title={"准许功能"}/>

      <Divider/>

      <CardContent sx={{display: "flex", flexFlow: "column nowrap", gap: 4}}>
        <FormControlLabel label="哔哩哔哩"
                          control={<Switch title={"是否准许"} defaultChecked size={"small"}
                                           onChange={e => onSwitch(e, "enableBiliVideo")}/>}/>

        <FormControlLabel label="Javlib"
                          control={<Switch title={"是否准许"} defaultChecked size={"small"}
                                           onChange={e => onSwitch(e, "enableJavlib")}/>}/>

        <FormControlLabel label="Translate"
                          control={<Switch title={"是否准许"} defaultChecked size={"small"}
                                           onChange={e => onSwitch(e, "enableTranslate")}/>}/>

        <FormControlLabel label="V2ex"
                          control={<Switch title={"是否准许"} defaultChecked size={"small"}
                                           onChange={e => onSwitch(e, "enableV2ex")}/>}/>

        <FormControlLabel label="Disable Visibility API"
                          control={<Switch title={"是否准许"} defaultChecked size={"small"}
                                           onChange={e => onSwitch(e, "enableDisableVisibilityAPI")}/>}/>
      </CardContent>
    </Card>
  )
}

// javlib 广告关键字（以"|"分隔）
const JavAds = () => {
  const [value, setValue] = useState("")

  const {showSb} = useSharedSnackbar()

  useEffect(() => {
    const init = async () => {
      let data = await chrome.storage.sync.get({settings: {javlibAds: ""}})
      setValue(data.settings.javlibAds)
    }
    init()
  }, [])

  return (
    <Card sx={{width: 300}}>
      <CardHeader title={"Javlib 广告关键字"}/>

      <Divider/>

      <CardContent sx={{display: "flex", flexFlow: "column nowrap", gap: 4}}>
        <Stack>
          <Typography>(以'|'分隔)</Typography>
          <TextField multiline value={value} rows={10} size={"small"}
                     onChange={e => setValue(e.target.value)}/>
        </Stack>
      </CardContent>

      <CardActions>
        <Button variant={"contained"} onClick={async _ => {
          let data = await chrome.storage.sync.get({settings: {javlibAds: ""}})
          data.settings.javlibAds = value
          chrome.storage.sync.set({settings: data.settings})
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
    <Stack direction={"row"} padding={2}>
      <Functions/>
      <JavAds/>
      <DoBackupPanelChromium/>
    </Stack>
  )
}

export default Options
