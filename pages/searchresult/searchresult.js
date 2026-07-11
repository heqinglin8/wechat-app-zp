// pages/searchinfor/searchresult.js
var Bmob = wx.Bmob;
var util = require('../../utils/util');
var city = require('../../utils/city');
var cardFormatter = require('../../utils/cardFormatter');
var companyCache = require('../../utils/companyCache');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    searchValue: '',
    searchResults: [],
    isnull: -1,
    loadingTip: '',
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
    query.equalTo("active", "==", 1);
    city.applyJobInfoFilter(query);
    query.order('-updatedAt');
    query.limit(100);
    query.skip((pageIndex || 0) * 100);
    return query.find().then(function (rows) {
      var enrichedRows = (rows || []).map(function (row) {
        return cardFormatter.applyCompanyCache(row);
      });
      var list = (acc || []).concat(enrichedRows);
      if (rows && rows.length === 100) {
        return this.loadCurrentCityJobs((pageIndex || 0) + 1, list);
      }
      return list;
    }.bind(this));
  },
  loadCurrentCitySeekers: function (pageIndex, acc) {
    var query = Bmob.Query("JobSeeker");
    query.equalTo("active", "==", 1);
    city.applyJobSeekerFilter(query);
    query.order('-updatedAt');
    query.limit(100);
    query.skip((pageIndex || 0) * 100);
    return query.find().then(function (rows) {
      var list = (acc || []).concat(rows || []);
      if (rows && rows.length === 100) {
        return this.loadCurrentCitySeekers((pageIndex || 0) + 1, list);
      }
      return list;
    }.bind(this));
  },
  markResultType: function (rows, resultType) {
    return util.formatList(rows || []).map(function (row) {
      row.resultType = resultType;
      row.resultKey = resultType + '_' + row.objectId;
      if (resultType === 'jobSeeker') {
        cardFormatter.decorateJobSeekerCard(row);
      } else {
        cardFormatter.decorateJobCard(row);
      }
      return row;
    });
  },
  sortSearchResults: function (rows) {
    return (rows || []).sort(function (a, b) {
      var at = Date.parse(a.updatedAt || a.createdAt || '') || 0;
      var bt = Date.parse(b.updatedAt || b.createdAt || '') || 0;
      return bt - at;
    });
  },
  //查询搜索结果是否存在
  loadinfor: function(){
    var that=this;
    var keyword = String(that.data.searchValue || '').trim();
    that.setData({
      searchResults: [],
      isnull: -1,
      loadingTip: ''
    });
    wx.showToast({
      title: "正在查询",
      icon: 'loading',
      duration: 1500
    });
    Promise.all([
      companyCache.ensureLoaded(Bmob).then(function () {
        return that.loadCurrentCityJobs(0, []);
      }),
      that.loadCurrentCitySeekers(0, [])
    ]).then(function(results) {
      var jobs = results[0] || [];
      var seekers = results[1] || [];
      var filteredJobs = jobs.filter(function (row) {
        return city.rowMatchesKeyword(row, keyword, ['title', 'jobDescription', 'companyName']);
      });
      var filteredSeekers = seekers.filter(function (row) {
        return city.rowMatchesKeyword(row, keyword, ['title', 'jobIntent', 'recoJobIntent']);
      });
      var mixedResults = that.sortSearchResults(
        that.markResultType(filteredJobs, 'jobInfo')
          .concat(that.markResultType(filteredSeekers, 'jobSeeker'))
      );
      //console.log("查询到的信息 " + mixedResults.length + "条记录");
      that.setData({
        searchResults: mixedResults,
        isnull: mixedResults.length ? 1 : 0,
        loadingTip: mixedResults.length ? '没有更多内容' : ''
      });
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
      that.setData({
        searchResults: [],
        isnull: 0,
        loadingTip: ''
      });
    });

  },
  scrolltolower: function () {},
  //点击招聘列表页面跳转，页面传参
  showDetail: function (e) {
    var that = this;
    // 获取wxml元素绑定的index值
    var index = e.currentTarget.dataset.index;
    var item = that.data.searchResults[index];
    if (!item) return;
    if (item.resultType === 'jobSeeker') {
      wx.navigateTo({
        url: '../seekerDetail/seekerDetail?jobSeekId=' + item.objectId
      });
      return;
    }
    wx.navigateTo({
      url: '../jobDetail/jobDetail?jobId=' + item.objectId
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
