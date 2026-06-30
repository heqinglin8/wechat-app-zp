// pages/index/FirstIndex.js

//引入SDK
var Bmob = require('../../utils/Bmob-2.5.30.min');
wx.Bmob = Bmob;
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

    swiperCurrent: 0,
    indicatorDots: true,
    autoplay: true,
    interval: 3000,
    duration: 800,
    circular: true,
    imgUrls: '',

    //tab
    winHeight: "",
    currentTab: 0,
    scrollLeft: 0,

  },
  //轮播图的切换事件
  swiperChange: function (e) {
    this.setData({
      swiperCurrent: e.detail.current
    });
  },
  //点击指示点切换
  chuangEvent: function (e) {
    this.setData({
      swiperCurrent: e.currentTarget.id
    });
  },
  //点击图片触发事件
  swipclick: function () {
    //console.log(this.data.swiperCurrent);
    // wx.switchTab({
    //  // url: this.data.links[this.data.swiperCurrent]
    // })
  },
  //点击列表页面跳转，页面传参
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
  // //点击门店导航页面跳转
  // bindViewLoaction:function(){
  //   wx.navigateTo({
  //     url: '../publishjob/publishjob'
  //   })
  //
  // },
  //点击微信咨询
  bindViewXWZX: function () {
    wx.showToast({
      title: '此功能暂未启用',
      image: "../../images/warning.png",
      duration: 2000,
      mask: true
    });

  },
  /**
   *
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.refreshCityState();
    this.getswitchimg();
  },
  refreshCityState: function () {
    var currentCity = city.initCurrentCity();
    var changed = this.data.currentCityCode &&
      this.data.currentCityCode !== currentCity.cityCode;
    this.setData({
      currentCityCode: currentCity.cityCode
    });
    return changed;
  },
  refreshModeAndMaybeLoad: function (options) {
    var that = this;
    var opts = options || {};
    var targetTab = normalizeTab(this.data.currentTab);

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

    if (opts.force || opts.cityChanged || roleChanged || tabChanged || !this._indexLoaded) {
      this.switchTabLoad(String(nextTab));
    }
  },
  reloadJobList: function () {
    this.cleardata();
    this.setData({
      page_index: 0,
      loadingTip: '上拉加载更多',
      isEmpty: false
    });
    this.switchTabLoad(String(this.data.currentTab || 0));
  },
  onRetryLoad: function () {
    this.reloadJobList();
  },
  onCityChange: function () {
    this.refreshCityState();
    this.refreshModeAndMaybeLoad({ force: true });
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
      preset: 'home',
      tab: tab === undefined ? this.data.currentTab : tab,
      pageIndex: pageIndex,
      pageSize: 10
    });
  },
  //加载轮播图
  getswitchimg: function () {
    var that = this;
    var query = Bmob.Query("SwiperImgSrc");
    // 查询所有数据
    query.find().then(function (results) {
      //console.log("轮播图共查询到 " + results.length + " 条记录");
      that.setData({
        imgUrls: results
      });
    }).catch(function (error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });
  },
//分页加载
  loadArticle: function () {
    var that = this;
    var requestId = this._listRequestId;

    this.loadCurrentList(this.data.page_index).then(function (result) {
    // 请求成功将数据存入article_list
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
    //console.log('--下拉刷新-')
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
  /**
   * 页面搜索事件的处理函数
   */
  wxSearchTab: function () {
    //console.log('wxSearchTab');
    wx.navigateTo({
      url: '../search/search'
    });
  },
  /**
   * 列表详情跳转
   */
  bindViewList: function () {
    wx.navigateTo({
      url: '../jobDetail/jobDetail'
    });
  },
  // /**
  //  * 推荐奖励跳转
  //  */
  // bindViewAward: function () {
  //   wx.navigateTo({
  //     url: '../pubilshJobSeek/pubilshJobSeek'
  //   })
  // },

  // /**
  //  * 求职热线跳转
  //  */
  // bindViewServicePhone: function () {
  //   wx.navigateTo({
  //     url: '../servicephone/servicephone'
  //   })
  // },
  // /**
  //  * 今日招聘（全部职位）跳转
  //  */
  // bindViewToday: function () {
  //   app.globalData.tabid = 1;
  //   wx.switchTab({
  //     url: '../today/today',
  //   })
  // },
  // /**
  // * 最新求职-跳转
  // */
  // bindViewTodayGxz: function () {
  //   app.globalData.tabid=1;
  //   wx.switchTab({
  //     url: '../todayjobseek/todayjobseek',
  //     success: function (e) {
  //       var page = getCurrentPages().pop();
  //       if (page == undefined || page == null) return;
  //       page.onLoad();
  //     }
  //   })
  // },
  // /**
  // * 今日招聘（临时工）跳转
  // */
  // bindViewTodayLsg: function () {
  //   app.globalData.tabid = 0;
  //   wx.switchTab({
  //     url: '../todayjobseek/todayjobseek',
  //     success: function (e) {
  //       var page = getCurrentPages().pop();
  //       if (page == undefined || page == null) return;
  //       page.onLoad();
  //     }
  //   })
  // },
  // /**
  // * 今日招聘（推荐）跳转
  // */
  // bindViewTodayTj: function () {
  //   app.globalData.tabid = 0;
  //   wx.switchTab({
  //     url: '../today/today',
  //     success: function (e) {
  //     var page = getCurrentPages().pop();
  //     if (page == undefined || page == null) return;
  //     page.onLoad();
  //     }
  //   })
  // },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

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
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },



  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  //滚动tab

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
    ////console.log('滑动' + cur);
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
    //  //console.log('点击tab'+cur);
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

      that._indexLoaded = true;
      that.setData({
        jobInfo: result.list,
        page_index: 0,
        loadingTip: result.hasMore ? "上拉加载更多" : "没有更多内容",
        isEmpty: result.list.length === 0
      });
    }).catch(function (error) {
      //console.log("查询失败: " + error.code + " " + error.message);
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
  },

});
