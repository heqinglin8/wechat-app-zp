//app.js
//引入SDK
const Bmob = require('/utils/Bmob-2.5.30.min.js');
//初始化Bmobkey
Bmob.initialize("ba87e714fe642a8a", "489509");
wx.Bmob = Bmob;
App({
  globalData:{
    tabid:0,
    userInfo: null
  },
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
       // 发送 res.code 到后台换取 openId, sessionKey, unionId
      // this.user_id.openid =res.code  //返回code
      //   console.log('aaaaa:'+code);
      }
    })

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // wx  已经不推荐getUserInfo了。

        }
      }
    }
    )
  }
})