// pages/index/FirstIndex.js

//引入SDK
var Bmob = require('../../utils/Bmob-2.5.30.min');
wx.Bmob = Bmob;
var city = require('../../utils/city');
var userRole = require('../../utils/userRole');
var jobService = require('../../services/jobService');
var jobSeekerService = require('../../services/jobSeekerService');
var app = getApp();

/**
 * 将 tab 参数标准化为数字，非法值统一回退到第一个 tab。
 */
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
  /**
   * 同步轮播图当前下标，用于指示点和点击场景。
   */
  swiperChange: function (e) {
    this.setData({
      swiperCurrent: e.detail.current
    });
  },
  /**
   * 点击轮播指示点时切换当前轮播项。
   */
  chuangEvent: function (e) {
    this.setData({
      swiperCurrent: e.currentTarget.id
    });
  },
  /**
   * 轮播图片点击入口，当前暂未配置跳转目标。
   */
  swipclick: function () {
    //console.log(this.data.swiperCurrent);
    // wx.switchTab({
    //  // url: this.data.links[this.data.swiperCurrent]
    // })
  },
  /**
   * 点击列表卡片时按当前角色跳转到招聘详情或求职详情。
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
  // //点击门店导航页面跳转
  // bindViewLoaction:function(){
  //   wx.navigateTo({
  //     url: '../publishjob/publishjob'
  //   })
  //
  // },
  /**
   * 微信咨询入口暂未启用时提示用户。
   */
  bindViewXWZX: function () {
    wx.showToast({
      title: '此功能暂未启用',
      image: "../../images/warning.png",
      duration: 2000,
      mask: true
    });

  },
  /**
   * 生命周期函数--监听页面加载：初始化城市和轮播图，列表等待 onShow 获取角色后加载。
   */
  onLoad: function () {
    this.refreshCityState();
    this.getswitchimg();
  },
  /**
   * 刷新当前城市状态，并返回城市是否发生变化。
   */
  refreshCityState: function () {
    var currentCity = city.initCurrentCity();
    var changed = this.data.currentCityCode &&
      this.data.currentCityCode !== currentCity.cityCode;
    this.setData({
      currentCityCode: currentCity.cityCode
    });
    return changed;
  },
  /**
   * 获取当前用户角色，并在角色、城市或 tab 变化时重新加载列表。
   */
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
  /**
   * 应用角色信息：role=2 使用求职模式，其它角色使用招聘模式。
   */
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
  /**
   * 重置分页状态并重新加载当前 tab 的列表。
   */
  reloadJobList: function () {
    this.cleardata();
    this.setData({
      page_index: 0,
      loadingTip: '上拉加载更多',
      isEmpty: false
    });
    this.switchTabLoad(String(this.data.currentTab || 0));
  },
  /**
   * 空态页点击“重新刷新”时重试当前列表。
   */
  onRetryLoad: function () {
    this.reloadJobList();
  },
  /**
   * 城市选择变化后强制刷新当前角色模式下的列表。
   */
  onCityChange: function () {
    this.refreshCityState();
    this.refreshModeAndMaybeLoad({ force: true });
  },
  /**
   * 根据当前角色选择首页列表的数据服务。
   */
  getListLoader: function () {
    return this.data.isJobSeekerMode
      ? jobSeekerService.loadJobSeekers
      : jobService.loadJobs;
  },
  /**
   * 加载当前模式下指定分页和 tab 的首页列表。
   */
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
  /**
   * 加载首页轮播图数据。
   */
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
  /**
   * 加载下一页列表，并追加到当前列表后面。
   */
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
   * 列表滚动到底部时触发分页加载。
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
   * 点击首页搜索框时跳转到搜索页。
   */
  wxSearchTab: function () {
    //console.log('wxSearchTab');
    wx.navigateTo({
      url: '../search/search'
    });
  },
  /**
   * 旧列表入口保留招聘详情跳转，当前页面列表使用 showDetail。
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
   * 生命周期函数--监听页面显示：刷新城市和角色模式，必要时重新加载列表。
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

  /**
   * swiper 滑动切换 tab 时同步当前 tab 并重新加载列表。
   */
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
  /**
   * 点击 tab 标题时切换当前 tab 并重新加载列表。
   */
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
  /**
   * 根据当前 tab 调整 tab 标题横向滚动位置。
   */
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
  /**
   * 清空当前列表并加载指定 tab 的第一页数据。
   */
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
  /**
   * 兼容旧调用：加载第一个 tab 的首页列表。
   */
  qbzwLoad: function () {
    this.switchTabLoad('0');
  },
  /**
   * 清空当前列表数据，切换 tab 或模式前使用。
   */
  cleardata: function () {
    this.setData({
      jobInfo: [],
      isEmpty: false
    });
  },

});
