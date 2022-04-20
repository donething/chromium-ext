import {createTheme} from "@mui/material"

// 自定义主题
const theme = createTheme({
  typography: {
    button: {
      justifyContent: "flex-start",
      textTransform: "none"
    }
  }
})

export default theme