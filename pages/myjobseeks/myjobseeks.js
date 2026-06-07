// pages/myjobseeks/myjobseeks.js
var Bmob = wx.Bmob;
var util = require('../../utils/util');

function firstText() {
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function salaryText(item) {
  var min = Number(firstText(item.detPayMin));
  var max = Number(firstText(item.detPayMax));
  var hasMin = !isNaN(min) && min > 0;
  var hasMax = !isNaN(max) && max > 0;
  var formatMonthly = function (value) {
    if (value >= 1000) {
      var k = value / 1000;
      return (k % 1 === 0 ? String(k) : String(Number(k.toFixed(1)))) + 'k';
    }
    return String(value);
  };
  if (hasMin && hasMax) {
    if (max >= 10000 && min < 1000) return formatMonthly(max);
    return formatMonthly(min) + '-' + formatMonthly(max);
  }
  if (hasMax) return formatMonthly(max);
  if (hasMin) return formatMonthly(min);
  return '待补充薪资';
}

function compactTags(tags) {
  return tags.filter(function (tag) {
    return tag && String(tag).trim();
  });
}

function splitTags(value) {
  var text = firstText(value);
  if (!text) return [];
  return text.split('|').map(function (tag) {
    return String(tag).trim();
  }).filter(function (tag) {
    return !!tag;
  });
}

function splitPhotoUrls(value) {
  var text = firstText(value);
  if (!text) return [];
  return text.split('|').map(function (photo) {
    return util.toDisplayUrl(String(photo).trim());
  }).filter(function (photo) {
    return !!photo;
  }).slice(0, 3);
}

function decorateJobSeekerCards(list) {
  return (list || []).map(function (item) {
    item.cardTitle = firstText(item.title, item.recoJobIntent, '未写标题');
    item.cardSalary = salaryText(item);
    item.cardSummary = firstText(item.summary, '未写摘要');
    item.cardFinancing = firstText(item.recoEducation, '未写学历');
    item.cardTags = compactTags([
      firstText(item.recoEducation, '')
    ].concat(splitTags(item.recoJobIntent)));
    var recoName = firstText(item.recoName, '未写发布人');
    var recruiterRole = firstText(item.commitJobRole, '');
    item.cardSeeker = recruiterRole ? recoName + ' · ' + recruiterRole : recoName;
    item.cardLocation = firstText(item.cityDisplayName, item.cityName, '未写地点');
    item.cardBadge = item.payType == 1 ? '临' : '';
    item.cardPhotos = splitPhotoUrls(item.photoImgs);
    item.avatar = util.toDisplayUrl(item.seekerAvatar) ? util.toDisplayUrl(item.seekerAvatar) : item.firstPhoto;
    return item;
  });
}

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
    isEmpty: false,
    loadingTip: '没有更多内容'
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
    query.equalTo("active", "==", 1);
    // 查询所有数据
    query.find().then(function(results) {
      var list = decorateJobSeekerCards(util.formatList(results));
      that.setData({
        infor: list,
        num: list.length,
        isEmpty: list.length === 0
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
      url: '../seekerDetail/seekerDetail?jobSeekId=' + objectId
    });
  },

})
