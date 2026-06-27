//引入SDK
var Bmob = wx.Bmob;
var city = require('../../utils/city');
var jobService = require('../../services/jobService');
var app = getApp();

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
    if (typeof (app.globalData.tabid) == "undefined") {
      this.switchTabLoad('0');
    }
  },
  refreshCityState: function () {
    var currentCity = city.initCurrentCity();
    var changed = this.data.currentCityCode &&
      this.data.currentCityCode !== currentCity.cityCode;
    this.setData({ currentCityCode: currentCity.cityCode });
    return changed;
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
  /**
 * 列表详情跳转
 */
  //点击招聘列表页面跳转，页面传参
  showDetail: function (e) {
    var that = this;
    var index = e.currentTarget.dataset.index;
    var objectId = that.data.jobInfo[index].objectId;
    wx.navigateTo({
      url: '../jobDetail/jobDetail?jobId=' + objectId
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

    if (typeof (app.globalData.tabid) == "undefined") { }
    else {
      this.setData({
        currentTab: app.globalData.tabid
      });
      this.switchTabLoad(app.globalData.tabid);
    }
    if (typeof (app.globalData.tabid) == "undefined" && cityChanged) {
      this.reloadCurrentTab();
    }
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
    var page_size = 10;
    jobService.loadJobs({
      Bmob: Bmob,
      preset: 'today',
      tab: that.data.currentTab,
      pageIndex: that.data.page_index,
      pageSize: page_size
    }).then(function (result) {
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
      page_index: ++this.data.page_index
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
    var cur = e.detail.current;
    this.setData({
      currentTab: e.detail.current
    });
    this.checkCor();
    this.switchTabLoad(cur + '');
  },
  // 点击标题切换当前页时改变样式
  swichNav: function (e) {
    var cur = e.target.dataset.current;
    if (this.data.currentTaB == cur) { return false; }
    this.setData({
      currentTab: cur
    });
    this.switchTabLoad(cur);
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
    this.cleardata();
    wx.showToast({
      title: "正在加载",
      icon: 'loading',
      duration: 1000
    });
    jobService.loadJobs({
      Bmob: Bmob,
      preset: 'today',
      tab: e,
      pageIndex: 0,
      pageSize: 10
    }).then(function (result) {
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
    var that = this;
    wx.showToast({
      title: "正在加载",
      icon: 'loading',
      duration: 1000
    });
    jobService.loadJobs({
      Bmob: Bmob,
      preset: 'today',
      tab: 0,
      pageIndex: 0,
      pageSize: 10
    }).then(function (result) {
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
  //清空招聘列表
  cleardata: function () {
    this.setData({
      jobInfo: [],
      isEmpty: false
    });
  }
});
