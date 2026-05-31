//引入SDK
var Bmob = wx.Bmob;
var util = require('../../utils/util');
var city = require('../../utils/city');
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
    winHeight: "",//窗口高度
    currentTab: 0, //预设当前项的值
    scrollLeft: 0, //tab标题的滚动条位置
  },
  /**
 * 生命周期函数--监听页面加载
 */
  onLoad: function (options) {
    this.refreshCityState();
    if (typeof (app.globalData.tabid) == "undefined") { 
    // //console.log('onload');
    // if (options && options.searchValue) {
    //   this.setData({
    //     searchValue: "搜索：" + options.searchValue,
    //   });
     
    // }
    this.qbzwLoad();
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
    })
  },
  /**
 * 列表详情跳转
 */
  //点击招聘列表页面跳转，页面传参
  showDetail: function (e) {
    var that = this;
    // 获取wxml元素绑定的index值
    var index = e.currentTarget.dataset.index;
    //console.log("1111111" + index);
    // 取出objectId
    var objectId = that.data.jobInfo[index].objectId;
    ////console.log("1111111" + objectId);
    // 跳转到详情页
    wx.navigateTo({
      url: '../jobDetail/jobDetail?jobId=' + objectId
    });
  },
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

      if (typeof (app.globalData.tabid) == "undefined") { }
      else{
        this.setData({
          currentTab: app.globalData.tabid
        });
        //console.log('onShow' + app.globalData.tabid);
        this.switchTabLoad(app.globalData.tabid);
      }
      if (typeof (app.globalData.tabid) == "undefined" && cityChanged) {
        this.reloadCurrentTab();
      }
   
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
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  //分页加载
  loadArticle: function () {
    ////console.log('分页传值:' + this.data.currentTab);
    var that = this;
    var page_size = 10;
    var query = Bmob.Query("JobInfo");
    //console.log('分页传值:' + currentTaB);
    //列表判断
    switch (that.data.currentTab) {
      case 0:
         //console.log('推荐');
         query.order('-entNum');
        break;
      case 1:
        //console.log('最新职位');
        query.order('-updatedAt');
        break;
      case 2:
           //console.log('高薪资');
           query.equalTo("payType", "==", 0);
           query.order('-detPayMax');
        break;
      case 3:
            //console.log('临时工');
            query.equalTo("payType", "==", 1);
            query.order('-detPayMax');
        break;
    }
    city.applyJobInfoFilter(query);
    // 分页
    query.limit(page_size);
    query.skip(that.data.page_index * page_size);
    var aaa = that.data.page_index * page_size
    //console.log('跳过:' + aaa)
    // 查询所有数据
    query.find().then(function(results) {
      // 请求成功将数据存入article_list
      var currentList = Array.isArray(that.data.jobInfo) ? that.data.jobInfo : [];
      var nextList = currentList.concat(util.formatList(results));
      that.setData({
        jobInfo: nextList,
        isEmpty: nextList.length === 0
      });
      //console.log('查询数量:' + results.length + '加载数量' + page_size)

      if (results.length < page_size) {
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
    ////console.log('滑动' + cur);
    this.switchTabLoad(cur + '');
  },
  // 点击标题切换当前页时改变样式
  swichNav: function (e) {

    var cur = e.target.dataset.current;
    if (this.data.currentTaB == cur) { return false; }
    else {
      this.setData({
        currentTab: cur
      })
      this.switchTabLoad(cur);
    }
    
    
  },
  //判断当前滚动超过一屏时，设置tab标题滚动条。
  checkCor: function () {
    if (this.data.currentTab > 4) {
      this.setData({
        scrollLeft: 300
      })
    } else {
      this.setData({
        scrollLeft: 0
      })
    }
  },
  //tab分类加载
  switchTabLoad: function (e) {
    //console.log('aaaa' + e);
    var that = this;
    //清空列表数据
    this.cleardata();
    var query = Bmob.Query("JobInfo");
    var e=e+''

    switch (e) {
      case '0':
        //console.log('全部职位');
        query.order('-updatedAt');
        break;
      case '1':
        //console.log('高薪资');
        query.equalTo("payType", "==", 0);
        query.order('-detPayMax');
        break;
      case '2':
        //console.log('临时工');
        query.equalTo("payType", "==", 1);
        query.order('-detPayMax');
        break;
      case '3':
        //console.log('推荐');
        query.order('-entNum');
        break;
    }
    city.applyJobInfoFilter(query);
    query.limit(10);
    wx.showToast({
      title: "正在加载",
      icon: 'loading',
      duration: 1000
    });
    // 查询数据
    query.find().then(function(results) {
      //console.log("分类第一次加载 " + results.length + "条记录");
      //请求将数据存入jobInfo
      var jobInfo = util.formatList(results);
      that.setData({
        jobInfo: jobInfo,
        page_index: 0,
        loadingTip: results.length < 10 ? "没有更多内容" : "上拉加载更多",
        isEmpty: jobInfo.length === 0
      });
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });

  },

  //全部职位加载
  qbzwLoad: function () {
    var that = this;
    // 动态添加列表详情
    var query = Bmob.Query("JobInfo");
    city.applyJobInfoFilter(query);
    query.order('-updatedAt');
    query.limit(10);
    wx.showToast({
      title: "正在加载",
      icon: 'loading',
      duration: 1000
    });
    // 查询所有数据
    query.find().then(function(results) {
      //console.log("全部职位第一次加载 " + results.length + "条记录");
      //请求将数据存入jobInfo
      var jobInfo = util.formatList(results);
      that.setData({
        jobInfo: jobInfo,
        page_index: 0,
        loadingTip: results.length < 10 ? "没有更多内容" : "上拉加载更多",
        isEmpty: jobInfo.length === 0
      });
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });
  },
  //清空招聘列表
  cleardata: function () {
    this.setData({
      jobInfo: [],
      isEmpty: false
    });
  }

  
})
