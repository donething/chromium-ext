import React from 'react'
import ReactDOM from 'react-dom'
import {HashRouter as Router, Route} from 'react-router-dom'
import reportWebVitals from './reportWebVitals'
import './index.css'
import Popup from "./pages/popup/Popup"
import Options from "./pages/options/Options"
import BiliFav from "./pages/bili_fav/bili_fav"
import VideoFav from "./pages/videos_fav/videos_fav"
import HttpHeaders from "./pages/http_headers"
import {IPTV} from "./pages/iptv"
import {DoSnackbar} from "do-comps";

ReactDOM.render(
  <React.StrictMode>
    <DoSnackbar/>

    <Router>
      <Route path="/options" component={Options}/>
      <Route path="/popup" component={Popup}/>
      <Route path="/bili_video" component={BiliFav}/>
      <Route path="/video_fav" component={VideoFav}/>
      <Route path="/http_headers" component={HttpHeaders}/>
      <Route path="/iptv" component={IPTV}/>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
