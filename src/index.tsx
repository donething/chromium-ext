import React from 'react'
import {createRoot} from 'react-dom/client'
import {HashRouter, Route, Routes} from "react-router-dom"
import Popup from "./pages/popup/Popup"
import Options from "./pages/options/Options"
import BiliFav from "./pages/bili_fav/bili_fav"
import VideoFav from "./pages/videos_fav/videos_fav"
import HttpHeaders from "./pages/http_headers/http_headers"
import {IPTV} from "./pages/iptv/iptv"
import {DoDialog, DoSnackbar} from "do-comps"
import {ThemeProvider} from "@mui/material"
import DoTheme from "./comm/themes";
import './index.css'

const container = document.getElementById('root')
const root = createRoot(container!)

root.render(
  <React.StrictMode>
    <ThemeProvider theme={DoTheme}>
      <DoSnackbar/>
      <DoDialog/>

      <HashRouter>
        <Routes>
          <Route path="/options" element={<Options/>}/>
          <Route path="/popup" element={<Popup/>}/>
          <Route path="/bili_video" element={<BiliFav/>}/>
          <Route path="/video_fav" element={<VideoFav/>}/>
          <Route path="/http_headers" element={<HttpHeaders/>}/>
          <Route path="/iptv" element={<IPTV/>}/>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
)

