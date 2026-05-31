// pages/searchinfor/searchresult.js
var Bmob = wx.Bmob;
var util = require('../../utils/util');
var city = require('../../utils/city');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    searchValue: '',
    jobInfo: [],
    isnull:0,
    currentCityCode: city.DEFAULT_CITY.cityCode,
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.refreshCityState();
    // 搜索
    if (options && options.searchValue) {
      //console.log('onload' + options.searchValue)
      this.setData({
        searchValue: options.searchValue
      });
     this.loadinfor();
    }
  
  },
  refreshCityState: function () {
    var currentCity = city.initCurrentCity();
    var changed = this.data.currentCityCode &&
      this.data.currentCityCode !== currentCity.cityCode;
    this.setData({ currentCityCode: currentCity.cityCode });
    return changed;
  },
  loadCurrentCityJobs: function (pageIndex, acc) {
    var query = Bmob.Query("JobInfo");
    city.applyJobInfoFilter(query);
    query.order('-updatedAt');
    query.limit(100);
    query.skip((pageIndex || 0) * 100);
    return query.find().then(function (rows) {
      var list = (acc || []).concat(rows || []);
      if (rows && rows.length === 100) {
        return this.loadCurrentCityJobs((pageIndex || 0) + 1, list);
      }
      return list;
    }.bind(this));
  },
  //查询搜索结果是否存在
  loadinfor: function(){
    var that=this;
    var keyword = String(that.data.searchValue || '').trim();
    wx.showToast({
      title: "正在查询",
      icon: 'loading',
      duration: 1500
    });
    that.loadCurrentCityJobs(0, []).then(function(results) {
      var filtered = (results || []).filter(function (row) {
        return city.rowMatchesKeyword(row, keyword, ['title', 'jobDescription', 'companyName']);
      });
      //console.log("查询到的信息 " + results.length + "条记录");
      that.setData({
        jobInfo: util.formatList(filtered),
        isnull: filtered.length ? 1 : 0
      });
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
    });

  },
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
    if (this.refreshCityState() && this.data.searchValue) {
      this.loadinfor();
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})
