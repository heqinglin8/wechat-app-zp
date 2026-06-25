// pages/myjobseeks/myjobseeks.js
var Bmob = wx.Bmob;
var jobSeekerService = require('../../services/jobSeekerService');
var cardFormatter = require('../../utils/cardFormatter');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //用户名
    username: '',
    userId: '',
    //报名信息
    infor: [],
    //将要删除的信息
    seleteinfor: '',
    num: '',
    isEmpty: false,
    loadingTip: '没有更多内容',
    selectedSeekIds: [],
    selectedCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var currentUser = Bmob.User.current();
    var currentUserId = currentUser && currentUser.objectId ? currentUser.objectId : '';
    var optionUserId = cardFormatter.firstText(options && options.userId);
    if (!currentUserId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      });
      this.setData({
        userId: '',
        infor: [],
        num: 0,
        isEmpty: true
      });
      return;
    }
    if (optionUserId && optionUserId !== currentUserId) {
      wx.showToast({
        title: '只能查看自己的求职',
        icon: 'none',
        duration: 1500
      });
    }

    this.setData({
      username: cardFormatter.firstText(options && options.username, currentUser.username, '我的求职'),
      userId: currentUserId
    })

    this.getinfor();
  },
  //获取报名信息
  getinfor: function () {
    var that = this;
    if (!that.data.userId) {
      that.setData({
        infor: [],
        num: 0,
        isEmpty: true,
        selectedSeekIds: [],
        selectedCount: 0
      });
      return;
    }
    jobSeekerService.loadOwnedJobSeekers({
      Bmob: Bmob,
      userId: that.data.userId
    }).then(function(list) {
      that.setData({
        infor: list,
        num: list.length,
        isEmpty: list.length === 0,
        selectedSeekIds: [],
        selectedCount: 0
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
    this.getinfor();
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

  noop: function () {},

  onSelectChange: function (e) {
    var rawIds = (e.detail && e.detail.value) || [];
    var ids = (Array.isArray(rawIds) ? rawIds : [rawIds]).map(function (id) {
      return id === undefined || id === null ? '' : String(id).trim();
    }).filter(function (id) {
      return !!id;
    });
    this.setData({
      selectedSeekIds: ids,
      selectedCount: ids.length
    });
  },

  deleteinfor: function () {
    var that = this;
    var ids = (that.data.selectedSeekIds || []).map(function (id) {
      return id === undefined || id === null ? '' : String(id).trim();
    }).filter(function (id) {
      return !!id;
    });
    if (!ids.length) {
      wx.showToast({
        title: '请先勾选记录',
        icon: 'none',
        duration: 1200
      });
      return;
    }
    var checkTasks = ids.map(function (id) {
      var query = Bmob.Query('JobSeeker');
      return query.get(id);
    });
    Promise.all(checkTasks).then(function (rows) {
      var hasNoPermission = rows.some(function (row) {
        return cardFormatter.firstText(row && row.commitUid) !== that.data.userId;
      });
      if (hasNoPermission) {
        wx.showToast({
          title: '只能删除自己的求职',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      wx.showModal({
        title: '确认删除',
        content: '删除后不可恢复，确认删除已勾选的' + ids.length + '条求职记录吗？',
        cancelText: '取消',
        confirmText: '确认删除',
        success: function (res) {
          if (!res.confirm) {
            return;
          }
          var tasks = ids.map(function (id) {
            var query = Bmob.Query('JobSeeker');
            return query.destroy(id);
          });
          Promise.all(tasks).then(function () {
            wx.showToast({
              title: '已删除' + ids.length + '条',
              icon: 'success',
              duration: 1500
            });
            that.getinfor();
          }).catch(function () {
            wx.showToast({
              title: '删除失败',
              icon: 'none',
              duration: 1500
            });
          });
        }
      });
    }).catch(function () {
      wx.showToast({
        title: '删除前校验失败',
        icon: 'none',
        duration: 1500
      });
    });
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
      url: '../seekerDetail/seekerDetail?jobSeekId=' + objectId
    });
  },

})
