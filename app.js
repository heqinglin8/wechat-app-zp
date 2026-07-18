//app.js
//引入SDK
const Bmob = require('/utils/Bmob-2.5.30.min.js');
const city = require('/utils/city.js');
const companyCache = require('/utils/companyCache.js');
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
  /**
   * 根据角色动态更新原生 tabbar 中“今日”入口的文案和图标。
   */
  syncTodayTabBarByRole: function (role) {
    var isJobSeeker = userRole.isJobSeekerRole(role);
    if (!wx.setTabBarItem) {
      return;
    }

    wx.setTabBarItem({
      index: 1,
      text: isJobSeeker ? '今日招聘' : '今日求职',
      iconPath: isJobSeeker ? 'images/today.png' : 'images/money.png',
      selectedIconPath: isJobSeeker ? 'images/today_p.png' : 'images/money_p.png',
      fail: function (err) {
        console.log('动态设置今日 tabbar 失败:', err);
      }
    });
  },
  /**
   * 获取当前登录用户角色，并同步全局角色状态与底部 tabbar。
   */
  getCurrentUserRole: function () {
    var that = this;
    return userRole.getCurrentUserRole(Bmob).then(function (role) {
      that.globalData.currentUserRole = role;
      that.syncTodayTabBarByRole(role);
      return role;
    });
  },
  /**
   * 获取标准化后的角色能力信息，供页面判断数据源和入口权限。
   */
  getCurrentUserRoleInfo: function () {
    return this.getCurrentUserRole().then(function (role) {
      return userRole.getRoleInfo(role);
    });
  },
  /**
   * 预加载公司信息到本地缓存，供招聘卡片按 companyId 补齐公司字段。
   */
  preloadCompanyInfoCache: function () {
    return companyCache.preload(Bmob);
  },
  /**
   * 小程序启动时初始化城市、本地日志和微信登录态。
   */
  onLaunch: function () {
    city.initCurrentCity()
    this.preloadCompanyInfoCache()
    const info = wx.getAppBaseInfo()
    console.log('SDKVersion:',info.SDKVersion)
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    Bmob.User.auth().then(res => {
      //这以后就能拿到登录信息
      console.log(res)
      console.log('一键登陆成功')

    }).catch(err => {
      console.log(err)
    });


  }
})
