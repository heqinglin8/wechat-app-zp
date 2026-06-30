//引入SDK
var Bmob = wx.Bmob;
var city = require('../../utils/city');
var userRole = require('../../utils/userRole');
var jobService = require('../../services/jobService');
var jobSeekerService = require('../../services/jobSeekerService');
var app = getApp();

function normalizeTab(tab) {
  var n = Number(tab);
  return isNaN(n) ? 0 : n;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loadingTip: "上拉加载更多",
    page_index: 0,
    jobInfo: [],
    isEmpty: false,
    currentCityCode: city.DEFAULT_CITY.cityCode,
    currentRole: '',
    isJobSeekerMode: false,

    //tab
    winHeight: "",
    currentTab: 0,
    scrollLeft: 0,
  },
  /**
 * 生命周期函数--监听页面加载
 */
  onLoad: function () {
    this.refreshCityState();
  },
  refreshCityState: function () {
    var currentCity = city.initCurrentCity();
    var changed = this.data.currentCityCode &&
      this.data.currentCityCode !== currentCity.cityCode;
    this.setData({ currentCityCode: currentCity.cityCode });
    return changed;
  },
  resolveCurrentTab: function () {
    if (app.globalData && app.globalData.tabid !== undefined && app.globalData.tabid !== null) {
      var tab = normalizeTab(app.globalData.tabid);
      app.globalData.tabid = undefined;
      return tab;
    }
    return normalizeTab(this.data.currentTab);
  },
  refreshModeAndMaybeLoad: function (options) {
    var that = this;
    var opts = options || {};
    var targetTab = this.resolveCurrentTab();

    app.getCurrentUserRoleInfo().then(function (roleInfo) {
      that.applyRoleMode(roleInfo, targetTab, opts);
    }).catch(function () {
      that.applyRoleMode(userRole.getRoleInfo(''), targetTab, opts);
    });
  },
  applyRoleMode: function (roleInfo, targetTab, options) {
    var opts = options || {};
    var nextRole = roleInfo && roleInfo.role ? roleInfo.role : '';
    var nextIsJobSeekerMode = !!(roleInfo && roleInfo.isJobSeeker);
    var nextTab = normalizeTab(targetTab);
    var roleChanged = this.data.currentRole !== nextRole ||
      this.data.isJobSeekerMode !== nextIsJobSeekerMode;
    var tabChanged = normalizeTab(this.data.currentTab) !== nextTab;

    this.setData({
      currentRole: nextRole,
      isJobSeekerMode: nextIsJobSeekerMode,
      currentTab: nextTab
    });
    this.updateNavigationTitle(nextIsJobSeekerMode);

    if (opts.force || opts.cityChanged || roleChanged || tabChanged || !this._todayLoaded) {
      this.switchTabLoad(String(nextTab));
    }
  },
  updateNavigationTitle: function (isJobSeekerMode) {
    wx.setNavigationBarTitle({
      title: isJobSeekerMode ? '今日求职' : '今日招聘'
    });
  },
  reloadCurrentTab: function () {
    this.switchTabLoad(String(this.data.currentTab || 0));
  },
  onRetryLoad: function () {
    this.reloadCurrentTab();
  },
  wxSearchTab: function () {
    wx.redirectTo({
      url: '../search/search'
    });
  },
  getListLoader: function () {
    return this.data.isJobSeekerMode
      ? jobSeekerService.loadJobSeekers
      : jobService.loadJobs;
  },
  loadCurrentList: function (pageIndex, tab) {
    var loader = this.getListLoader();
    return loader({
      Bmob: Bmob,
      preset: 'today',
      tab: tab === undefined ? this.data.currentTab : tab,
      pageIndex: pageIndex,
      pageSize: 10
    });
  },
  /**
 * 列表详情跳转
 */
  showDetail: function (e) {
    var index = e.currentTarget.dataset.index;
    var item = this.data.jobInfo[index];
    if (!item || !item.objectId) {
      return;
    }

    wx.navigateTo({
      url: this.data.isJobSeekerMode
        ? '../seekerDetail/seekerDetail?jobSeekId=' + item.objectId
        : '../jobDetail/jobDetail?jobId=' + item.objectId
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var cityChanged = this.refreshCityState();
    this.refreshModeAndMaybeLoad({ cityChanged: cityChanged });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  //分页加载
  loadArticle: function () {
    var that = this;
    var requestId = this._listRequestId;

    this.loadCurrentList(this.data.page_index).then(function (result) {
      if (requestId !== that._listRequestId) {
        return;
      }

      var currentList = Array.isArray(that.data.jobInfo) ? that.data.jobInfo : [];
      var nextList = currentList.concat(result.list);
      that.setData({
        jobInfo: nextList,
        isEmpty: nextList.length === 0
      });

      if (!result.hasMore) {
        that.setData({
          loadingTip: '没有更多内容'
        });
      }
    });
  },
  /**
 * 页面上拉触底事件的处理函数
 */
  scrolltolower: function () {
    if (this.data.loadingTip == "没有更多内容" || this.data.isEmpty) {
      return;
    }
    this.setData({
      page_index: this.data.page_index + 1
    });
    if (this.data.loadingTip != "没有更多内容") {
      wx.showToast({
        title: "正在加载",
        icon: 'loading',
        duration: 1000
      });
    }
    this.loadArticle();
  },
  // 滚动切换标签样式
  switchTab: function (e) {
    var cur = normalizeTab(e.detail.current);
    if (cur === normalizeTab(this.data.currentTab)) {
      return;
    }
    this.setData({
      currentTab: cur
    });
    this.checkCor();
    this.switchTabLoad(String(cur));
  },
  // 点击标题切换当前页时改变样式
  swichNav: function (e) {
    var cur = normalizeTab(e.currentTarget.dataset.current);
    if (normalizeTab(this.data.currentTab) === cur) {
      return false;
    }
    this.setData({
      currentTab: cur
    });
    this.switchTabLoad(String(cur));
  },
  //判断当前滚动超过一屏时，设置tab标题滚动条。
  checkCor: function () {
    if (this.data.currentTab > 4) {
      this.setData({
        scrollLeft: 300
      });
    } else {
      this.setData({
        scrollLeft: 0
      });
    }
  },
  //tab分类加载
  switchTabLoad: function (e) {
    var that = this;
    var requestId = (this._listRequestId || 0) + 1;
    var nextTab = normalizeTab(e);
    this._listRequestId = requestId;
    this.cleardata();
    this.setData({
      currentTab: nextTab
    });
    wx.showToast({
      title: "正在加载",
      icon: 'loading',
      duration: 1000
    });

    this.loadCurrentList(0, nextTab).then(function (result) {
      if (requestId !== that._listRequestId) {
        return;
      }

      that._todayLoaded = true;
      that.setData({
        jobInfo: result.list,
        page_index: 0,
        loadingTip: result.hasMore ? "上拉加载更多" : "没有更多内容",
        isEmpty: result.list.length === 0
      });
    }).catch(function () {
      //console.log("查询失败");
    });
  },

  //全部职位加载
  qbzwLoad: function () {
    this.switchTabLoad('0');
  },
  //清空招聘列表
  cleardata: function () {
    this.setData({
      jobInfo: [],
      isEmpty: false
    });
  }
});
