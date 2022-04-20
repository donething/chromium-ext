// BD 影视：https://www.bd2020.com/

import {insertJSSrc} from "do-utils/dist/elem"

// 直接显示下载链接列表
insertJSSrc(chrome.runtime.getURL("/scripts/bd2020_dl_page.js"))