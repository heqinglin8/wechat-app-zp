// pages/myjobseeks/myjobseeks.js
var Bmob = wx.Bmob;
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //用户名
    username: '',
    //报名信息
    infor: '',
    //将要删除的信息
    seleteinfor: '',
    num: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.setData({
      username: options.username
    })

    this.getinfor();
  },
  //获取报名信息
  getinfor: function () {
    var that = this;
    //获取报名信息
    var query = Bmob.Query("JobSeeker");
    query.equalTo("commitUsername", "==", that.data.username);
    // 查询所有数据
    query.find().then(function(results) {
      //console.log("共查询到 " + results.length + " 条记录");
      that.setData({
        infor: util.formatList(results),
        num: results.length
      });
    }).catch(function(error) {
      //console.log("查询失败: " + error.code + " " + error.message);
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

  },

    //点击招聘列表页面跳转，页面传参
  showDetail: function (e) {
    var that = this;
    // 获取wxml元素绑定的index值
    var index = e.currentTarget.dataset.index;
    //console.log("1111111" + index);
    // 取出objectId
    var objectId = that.data.infor[index].objectId;
    ////console.log("1111111" + objectId);
    // 跳转到详情页
    wx.navigateTo({
      url: '../seekerDetail/seekerDetail?jobId=' + objectId
    });
  },

})
