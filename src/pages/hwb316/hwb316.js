// 模拟登录的部分代码，仅供参考
new Vue({
  el: '#app',
  data() {
    return {
      /**
       * 信息
       * @typedef {Object} SMS
       * @property {String} phone 号码
       * @property {String} content 内容
       * @property {String} date 收发的日期
       * @property {String} index 索引
       * @property {String} smstat 阅读状态："0" 表示还未阅读；"1" 表示已阅读
       * @property {String} smstype 类型："2" 表示为短信
       */
      /**
       * 所有的短信息数据
       * 按日期：按日期最近的排前面，远的排后面
       * @type {Array<SMS>}
       */
      allSms: [],
      // 是否加载完所有的短信息
      loading: false,
      sort: (a, b) => {
        return b.date.localeCompare(a.date);
      },
      // 短信息的数量，还未阅读的短信息的数量
      total: 0,
      unread: 0,

      // 请求的请求头、其它选项
      headers: {"Host": "192.168.8.1", "Referer": "http://192.168.8.1", "Origin": "http://192.168.8.1"},
      // 大部分请求需要在请求头中携带"__RequestVerificationToken"
      tokens: [],
      // 登录成功后返回的公钥，用于加解密短信息等数据
      rsa: {
        e: "",
        n: "",
        pubkeysignature: "",
        serversignature: ""
      },

      // 登录信息
      authInfo: {
        visible: false,
        auth: "",
        AUTH: "auth"
      },
      // 路由器的当前版本中,关键信息是否需要加密发送
      // 路由器的软件版本低于"10.0.5.1"为 false，大于时（如"11.0.0.1"）则为 true
      needEncrypt: false
    };
  },
  methods: {
    // 执行入口
    async init() {
      // 读取验证信息
      let auth = localStorage.getItem(this.authInfo.AUTH);
      this.authInfo.auth = auth;
      if (!auth) {
        this.$message.warn("请先填写验证信息，再刷新页面");
        return;
      }
      // 登录
      await this.login(auth).catch(reason => {
        console.log("[登录] 登录路由器出错：", reason);
        this.$message.error("登录路由器出错");
      });
      // 登录失败则退出执行
      if (!this.rsa.n) return;

      // 检测关键信息是否需要加密发送
      await this.checkNeedEncrypt();

      // 获取信息列表
      await this.getAllSMS().catch(reason => {
        console.log("[短信息] 获取短信息列表时出错：", reason);
        this.$message.error("获取短信息列表时出错");
      });
    },
    // 获取所有短信息
    async getAllSMS() {
      this.loading = true;
      // 获取存储、未读的信息数量
      let smsCountObj = await this.postData("/sms/sms-count", null, false, false);
      this.total = parseInt(smsCountObj.response.LocalInbox);
      this.unread = parseInt(smsCountObj.response.LocalUnread);
      // console.log("[短信息]", "短信息的数量：", smsCountObj);
      // 短信息数量为 0，则不需要再获取
      if (this.total === 0) {
        this.loading = false;
        return;
      }

      // 已经插入到列表的短信条数
      let had = 0;

      // HW 制造的奇怪的麻烦，如果目标只有一个元素时，其为对象；目标有多个元素时，其为数组
      // 需要分开处理，所以将处理函数提取出来
      // 解析、插入短信
      let parseMessage = (message) => {
        Utils.insertOrdered(this.allSms, message, [this.sort]);
        // 如果已完成读取所有短信，则表示读取操作完成，按钮设为可用
        if (++had === this.total) {
          this.loading = false;
        }
      };
      // 根据号码获取其下的所有短信息
      let getSms = (phone) => {
        // 获取该号码有关的短信息
        postObj = {
          phone: xss(phone),
          pageindex: 1,
          readcount: 20
        };
        this.postEncryptSms("/sms/sms-list-phone", postObj).then(resp => {
          // 保存每条短信息到数组
          // 按日期排序：近的排前面，远的排后面
          // HW 制造的多余的处理：如果只有一条短信息， message 为对象，有多条时为数组，所以分开处理
          if (Array.isArray(resp.response.messages.message)) {
            // this.allSms.push(...smsContentList.response.messages.message);
            for (const sms of resp.response.messages.message) {
              parseMessage(sms);
            }
          } else {
            parseMessage(resp.response.messages.message);
          }
        });
      };

      // 正式获取保存的短信息
      // 获取预览短信息的列表，提取短信息的收发号码
      let postObj = {
        pageindex: 1,
        readcount: 20,  // 数值不能大于 20
      };
      // 获取预览信息列表
      let smsListObj = await this.postEncryptSms("/sms/sms-list-contact", postObj);
      if (!smsListObj) {
        console.log("[短信息] 短信息的数量为 0");
        this.loading = false;
        return;
      }
      // 迭代号码列表，获取所有短信
      // HW 制造的多余的处理：如果只有一个号码， message 为对象，有多个时为数组，所以分开处理
      if (Array.isArray(smsListObj.response.messages.message)) {
        for (const sms of smsListObj.response.messages.message) {
          getSms(sms.phone);
        }
      } else {
        getSms(smsListObj.response.messages.message.phone);
      }
      // console.log("所有短信息的列表", this.allSms);
    },

    // 将所有短信设为已读
    async setAllRead() {
      // 查找未读的短信
      let indexList = this.allSms.filter(sms => sms.smstat === "0").map(sms => sms.index);
      if (indexList.length === 0) {
        this.$message.info("没有未读的短信息，不需设为已读");
        return;
      }
      let result = await this.setSmsRead(indexList);
      console.log("设为已读", result);
    },
    /**
     * 将短信设为已读
     * @param {Array<String>} indexList 需设为已读的短信索引(index)的数组
     * @return {Promise<Object>}
     */
    async setSmsRead(indexList) {
      // POST 的数据
      let postObj = {
        Index: indexList
      };
      // 执行请求
      return await this.postData("/sms/set-read", postObj);
    },

    // 删除所有短信息
    async delAllSMS() {
      Antdv.confirm(this, "确认", "删除 所有短信息", async () => {
        let deledPhoneList = [];
        for (const sms of this.allSms) {
          deledPhoneList.push(xss(sms.phone));
        }

        let postObj = {
          Phones: {
            Phone: deledPhoneList
          }
        };
        let resp = await this.postEncryptSms("/sms/sms-delete-phone", postObj);
        if (resp.response === "OK") {
          this.$message.success("已成功删除所有短信息");
        }
      }, {okType: "danger"});
    },

    // 登录路由器
    async login(pwd) {
      // 先访问首页获取 cookie 和 token
      let resp = await fetch("http://192.168.8.1/html/index.html");
      let doc = new DOMParser().parseFromString(await resp.text(), "text/html");
      let tokensElem = doc.querySelectorAll("meta[name='csrf_token']");
      for (const elem of tokensElem) {
        this.tokens.push(elem.content);
      }

      // 第一步骤登录
      // POST 的数据
      let username = "admin";
      let scram = CryptoJS.SCRAM();
      let firstNonce = scram.nonce().toString();
      let firstPostData = {
        username: username,
        firstnonce: firstNonce,
        mode: 1
      };
      // console.log("第一步骤登录的数据", firstPostData);
      let data1 = await this.postData("/user/challenge_login", firstPostData);
      // console.log("[登录]", "第一步骤的响应", data1);

      // 第一步骤登录失败
      if (!data1["response"]) {
        console.log("第一步骤登录失败：", data1);
        this.$message.error("第一步骤登录失败");
        return;
      }

      // 第二步骤登录
      let scarmSalt = CryptoJS.enc.Hex.parse(data1['response']['salt']);
      let iter = data1['response']['iterations'];
      let finalNonce = data1['response']['servernonce'];
      let authMsg = firstNonce + ',' + finalNonce + ',' + finalNonce;
      // let saltPassword = scram.saltedPassword(pwd, scarmSalt, iter).toString();
      // let serverKey = scram.serverKey(CryptoJS.enc.Hex.parse(saltPassword)).toString();
      let clientProof = scram.clientProof(pwd, scarmSalt, iter, authMsg).toString();
      // POST 的数据
      let finalPostData = {
        clientproof: clientProof,
        finalnonce: finalNonce
      };
      // 此处省略了 if (flag) { }
      // 因为 flag 为 undefined
      // 此处省略了 if (data['response']['newType'] && data['response']['newType'] == '1') { }
      // 因为以当前版本，该值为 0，不会运行里面的代码

      // console.log("第二步骤登录的数据", finalPostData);
      let data2 = await this.postData("/user/authentication_login", finalPostData);
      // console.log("[登录]", "第二步骤登录返回的数据", data2);

      // 保存秘钥信息，以供加解密
      this.rsa.e = data2.response.rsae;
      this.rsa.n = data2.response.rsan;
      this.rsa.pubkeysignature = data2.response.rsapubkeysignature;
      this.rsa.serversignature = data2.response.serversignature;
    },

    // 重启路由器
    async onReboot() {
      Antdv.confirm(this, "确认", "重启 路由器", async () => {
        let request = {
          Control: 1
        };
        let result = await this.postData("/device/control", request);
        if (result["response"] === "OK") {
          this.$message.success("正在重启路由器，请等待……");
          console.log("[路由] 正在重启路由器，请等待……");
        } else {
          this.$message.error("执行重启路由器操作时出错");
          console.log("[路由] 执行重启路由器操作时出错：", result);
        }
      }, {okType: "danger"});
    },

    // 检测关键信息是否需要加密发送
    async checkNeedEncrypt() {
      let result = await this.postData("/device/information", null, false, false);
      let ver = result.response.SoftwareVersion;
      ver = ver.substring(0, ver.indexOf("("));
      // 版本大于"10.0.5.1"时需要加密发送关键信息
      console.log("当前软件版本：", ver);
      this.needEncrypt = ver.localeCompare("10.0.5.1") >= 1;
    },

    /**
     * 获取 token
     * @return {Promise<String>}
     */
    async getToken() {
      let tokenObj = await this.postData("/webserver/token", null, false, false);
      let token = tokenObj.response.token;
      // 只需要后 32 位
      return token.substr(32);
    },

    /**
     * POST 和短信息有关的加密数据
     * @param {String} path 请求的路径（以"/"开头，如"/sms/sms-count"）
     * @param {Object} data 将 POST 的数据，最终会转为 String 发送
     * @return {Promise<Object>}
     */
    async postEncryptSms(path, data) {
      if (!this.needEncrypt) {
        return await this.postData(path, data, true);
      } else {
        let scram = CryptoJS.SCRAM();
        let smsNonce = scram.nonce().toString();
        let smsSalt = scram.nonce().toString();
        let nonceStr = smsNonce + smsSalt;
        // 向 POST 数据中追加秘钥
        data.nonce = doRSAEncrypt(nonceStr, this.rsa.e, this.rsa.n);
        // 发送请求
        let result = await this.postData(path, data, true);
        console.log("[Before Decrypt]", result);
        // 解码后返回响应数据
        return dataDecrypt(scram, smsNonce, smsSalt, result, path);
      }
    },

    /**
     * POST 通用数据
     * @param {String} path 请求的路径（如"/sms/sms-count"）
     * @param {Object} [data] 将 POST 的数据，最终会转为 String 发送
     * @param {Boolean} [enc] 是否需要加密发送数据，默认 false
     * @param {Boolean} [needToken] 是否需要携带 token，默认 true
     * @param {Number} retry 出错后重试的次数
     * @return {Promise<{Object}>}
     */
    async postData(path, data, enc, needToken = true, retry = 3) {
      let myHeaders = JSON.parse(JSON.stringify(this.headers));
      // 携带额外的请求头：_ResponseSource、__RequestVerificationToken
      myHeaders["_ResponseSource"] = "Broswer";
      if (needToken) {
        let token = "";
        if (this.tokens.length > 0) {
          token = this.tokens[0];
          this.tokens.splice(0, 1);
        } else {
          token = await this.getToken();
          console.log("[POST]", `获取了新 Token: '${path}' ==> '${token}'`);
        }
        myHeaders["__RequestVerificationToken"] = token;
      }

      // 发送请求
      // 需要发送的数据，可空
      let content;
      if (data) {
        content = object2xml("request", data);
        // 是否需要加密发送数据
        if (enc) {
          content = doRSAEncrypt(content, this.rsa.e, this.rsa.n);
          myHeaders["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8;enc";
        }
      }

      // 发送请求
      let ops = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(content)
      };
      let resp = await fetch("http://192.168.8.1/api" + path, ops);
      let obj = xml2object(await resp.text());
      // 重新登录后重置 token
      if (path === "/user/challenge_login" || path === "/user/authentication_login") {
        this.tokens = [];
      }
      if (!obj.error) {
        // 保存响应头中的 token
        this.getTokenFromHeader(resp.headers);
      }

      // 出错时重试
      if (obj.error && retry > 0) {
        return this.postData(path, data, enc, needToken, retry - 1);
      }
      return obj;
    },

    // 保存响应头中的 token
    getTokenFromHeader(headers) {
      // 大小写不一样
      if (headers.has("__RequestVerificationTokenone")) {
        this.tokens.push(headers.get("__RequestVerificationTokenone"));
        if (headers.has("__RequestVerificationTokentwo")) {
          this.tokens.push(headers.get("__RequestVerificationTokentwo"));
        }
      } else if (headers.has("__RequestVerificationToken")) {
        this.tokens.push(headers.get("__RequestVerificationToken"));
      }
    },

    // 保存验证信息
    async saveAuth() {
      localStorage.setItem(this.authInfo.AUTH, this.authInfo.auth);
      this.authInfo.visible = false;
    },

    // 点击了菜单
    handleMenuClick(event) {
      switch (event.key) {
        case "setAllRead":
          this.setAllRead();
          break;
        case "delAllSMS":
          this.delAllSMS();
          break;
        case "onReboot":
          this.onReboot();
          break;
        case "inputAuth":
          this.authInfo.visible = true;
          break;
      }
    }
  },
  mounted() {
    this.init();
  }
});
