module.exports = {
  webpack: {
    configure: (webpackConfig, {env, paths}) => {
      return {
        ...webpackConfig,
        entry: {
          main: [env === 'development' &&
          require.resolve('react-dev-utils/webpackHotDevClient'), paths.appIndexJs].filter(Boolean),
          // 此例中打包源文件"./src/content/content.ts"，输出名为"build/static/js/content.js"，每行一个
          content: './src/content/content.ts',
          bd2020_dl_page: './src/content/sites/bd2020_dl_page.ts',
          bili_live_room: './src/content/sites/bili_live_room.ts',
          douyu_live_room: './src/content/sites/douyu_live_room.ts',
          huya_live_room: './src/content/sites/huya_live_room.ts',
          huya_video_playback: './src/content/sites/huya_video_playback.ts',
          javlib: './src/content/sites/javlib.ts',
          v2ex: './src/content/sites/v2ex.ts',
          bili_video: './src/content/sites/videos/bili.ts',
          jd_buy: './src/content/sites/jd_buy.ts',
          alist: './src/content/sites/alist.ts',
          google_search: './src/content/sites/google_search.ts',
          laow: './src/content/sites/laow.ts',
          v2ph: './src/content/sites/v2ph.ts',
          service_worker: './src/background/service_worker.ts',
          // 单独打包依赖库
          // libs: ["jsdom"]
        },
        output: {
          ...webpackConfig.output,
          filename: 'static/js/[name].js',
        },
        optimization: {
          ...webpackConfig.optimization,
          // <---- 禁用 uglify 代码压缩混淆
          minimize: false,
          runtimeChunk: false,
          // 将依赖提取到引用它的脚本中
          splitChunks: {}
        }
      };
    },
  }
};