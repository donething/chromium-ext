import {BackupPanel} from "../../comm/antd"
import {Button, Card, message, Switch} from "antd"
import TextArea from "antd/es/input/TextArea"
import {useEffect, useState} from "react"

// 功能开关
function Functions() {
  // 将开关变更保存到存储中
  let onSwitch = async (checked: boolean, key: string) => {
    let data = await chrome.storage.sync.get({settings: {}})
    data.settings[key] = checked
    chrome.storage.sync.set({settings: data.settings})
  }

  return (
    <Card title="准许功能" size="small" style={{width: 300}}>
      <div className="row justify-between">
        <span>哔哩哔哩</span>
        <Switch title="是否准许" defaultChecked={true} size="small"
                onChange={checked => onSwitch(checked, "enableBiliVideo")}/>
      </div>

      <div className="row justify-between">
        <span>Javlib</span>
        <Switch title="是否准许" defaultChecked={true} size="small"
                onChange={checked => onSwitch(checked, "enableJavlib")}/>
      </div>

      <div className="row justify-between">
        <span>Translate</span>
        <Switch title="是否准许" defaultChecked={true} size="small"
                onChange={checked => onSwitch(checked, "enableTranslate")}/>
      </div>

      <div className="row justify-between">
        <span>V2ex</span>
        <Switch title="是否准许" defaultChecked={true} size="small"
                onChange={checked => onSwitch(checked, "enableV2ex")}/>
      </div>

      <div className="row justify-between">
        <span>Disable Visibility API</span>
        <Switch title="是否准许" defaultChecked={true} size="small"
                onChange={checked => onSwitch(checked, "enableDisableVisibilityAPI")}/>
      </div>
    </Card>
  )
}

// javlib 广告关键字（以"|"分隔）
function JavAds() {
  const [value, setValue] = useState("")
  useEffect(() => {
    const init = async () => {
      let data = await chrome.storage.sync.get({settings: {javlibAds: ""}})
      setValue(data.settings.javlibAds)
    }
    init()
  }, [])
  return (
    <Card title="Javlib 广告关键字(以'|'分隔)" size="small" style={{width: 300}} extra={<Button onClick={async _ => {
      let data = await chrome.storage.sync.get({settings: {javlibAds: ""}})
      data.settings.javlibAds = value
      chrome.storage.sync.set({settings: data.settings})
      message.success("已保存 广告关键字")
    }} type="primary" size="small" shape="round">保存</Button>}>
      <TextArea value={value} rows={15} onChange={e => setValue(e.target.value)}/>
    </Card>
  )
}

const Options = function () {
  useEffect(() => {
    document.title = `选项 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <div className="row wrap">
      <Functions/>
      <JavAds/>
      <BackupPanel/>
    </div>
  )
}

export default Options
