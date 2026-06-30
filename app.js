//app.js
//引入SDK
const Bmob = require('/utils/Bmob-2.5.30.min.js');
const city = require('/utils/city.js');
const userRole = require('/utils/userRole.js');
//初始化Bmobkey
Bmob.initialize("ba87e714fe642a8a", "489509");
wx.Bmob = Bmob;
App({
  globalData:{
    tabid:0,
    userInfo: null,
    currentCity: city.DEFAULT_CITY,
    currentUserRole: ''
  },
  syncTodayTabBarByRole: function (role) {
    var isJobSeeker = userRole.isJobSeekerRole(role);
    if (!wx.setTabBarItem) {
      return;
    }

    wx.setTabBarItem({
      index: 1,
      text: isJobSeeker ? '今日求职' : '今日招聘',
      iconPath: isJobSeeker ? 'images/money.png' : 'images/today.png',
      selectedIconPath: 'images/today_p.png',
      fail: function (err) {
        console.log('动态设置今日 tabbar 失败:', err);
      }
    });
  },
  getCurrentUserRole: function () {
    var that = this;
    return userRole.getCurrentUserRole(Bmob).then(function (role) {
      that.globalData.currentUserRole = role;
      that.syncTodayTabBarByRole(role);
      return role;
    });
  },
  getCurrentUserRoleInfo: function () {
    return this.getCurrentUserRole().then(function (role) {
      return userRole.getRoleInfo(role);
    });
  },
  onLaunch: function () {
    city.initCurrentCity()
    const info = wx.getAppBaseInfo()
    console.log('SDKVersion:',info.SDKVersion)
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
  }
})
