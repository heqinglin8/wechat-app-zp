// pages/award/award.js
// MyRecommend（Bmob）需在控制台为 Class 添加列后即可写入：recoEducation recoContact recoJobIntent recoSalaryRange recoIntro recoExtra

var Bmob = wx.Bmob;
var app = getApp();

Page({
  data: {
    userName: '',
    recoName: '',
    recoContact: '',
    recoJobIntent: '',
    recoSalaryRange: '',
    recoIntro: '',
    recoExtra: '',
    educationOptions: ['初中及以下', '中专 / 高中', '大专', '本科', '硕士及以上'],
    educationIndex: 2,
    userLoaded: false,
  },

  onRecoNameInput: function (e) {
    this.setData({ recoName: (e.detail && e.detail.value) || '' });
  },
  onRecoContactInput: function (e) {
    this.setData({ recoContact: (e.detail && e.detail.value) || '' });
  },
  onRecoJobIntentInput: function (e) {
    this.setData({ recoJobIntent: (e.detail && e.detail.value) || '' });
  },
  onRecoSalaryInput: function (e) {
    this.setData({ recoSalaryRange: (e.detail && e.detail.value) || '' });
  },
  onRecoIntroInput: function (e) {
    this.setData({ recoIntro: (e.detail && e.detail.value) || '' });
  },
  onRecoExtraInput: function (e) {
    this.setData({ recoExtra: (e.detail && e.detail.value) || '' });
  },
  onEducationChange: function (e) {
    var idx = parseInt(e.detail.value, 10);
    if (isNaN(idx)) return;
    this.setData({ educationIndex: idx });
  },

  onLoad: function () {},

  onReady: function () {
    var that = this;
    var objectId = wx.getStorageSync('objectId');
    if (!objectId) {
      wx.showToast({ title: '请先登录后再推荐', icon: 'none', duration: 2000 });
      return;
    }
    var query = Bmob.Query('_User');
    query.equalTo('objectId', '==', objectId);
    query.find().then(function (results) {
      if (!results.length) {
        wx.showToast({ title: '未找到用户信息，请先登录', icon: 'none', duration: 2000 });
        return;
      }
      var u = results[0];
      var phone = u.userphone != null ? String(u.userphone).trim() : '';
      var uname = u.username || '';
      that.setData({
        userName: uname,
        recoName: uname,
        recoContact: phone,
        userLoaded: true,
      });
    }).catch(function () {
      wx.showToast({ title: '用户信息加载失败', icon: 'none', duration: 2000 });
    });
  },

  onShareAppMessage: function () {},

  validateForm: function () {
    var d = this.data;
    if (!(d.recoName && String(d.recoName).trim())) {
      wx.showToast({ title: '请填写求职者姓名', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.recoContact && String(d.recoContact).trim())) {
      wx.showToast({ title: '请填写联系方式', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.recoJobIntent && String(d.recoJobIntent).trim())) {
      wx.showToast({ title: '请填写求职意向', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.recoSalaryRange && String(d.recoSalaryRange).trim())) {
      wx.showToast({ title: '请填写期待薪资范围', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    return true;
  },

  educationLabel: function () {
    var opts = this.data.educationOptions;
    var i = this.data.educationIndex;
    if (i < 0 || i >= opts.length) return '';
    return opts[i];
  },

  applyMyRecommendFields: function (row) {
    var d = this.data;
    var edu = this.educationLabel();
    row.set('userName', d.userName);
    row.set('recoName', String(d.recoName).trim());
    row.set('recoEducation', edu);
    row.set('recoContact', String(d.recoContact).trim());
    row.set('recoJobIntent', String(d.recoJobIntent).trim());
    row.set('recoSalaryRange', String(d.recoSalaryRange).trim());
    row.set('recoIntro', (d.recoIntro && String(d.recoIntro).trim()) || '');
    row.set('recoExtra', (d.recoExtra && String(d.recoExtra).trim()) || '');
  },

  put_infor: function () {
    var that = this;
    if (!that.data.userLoaded || !that.data.userName) {
      wx.showToast({ title: '请先登录后再推荐', image: '../../images/warning.png', duration: 2000 });
      return;
    }
    if (!that.validateForm()) {
      return;
    }

    var query = Bmob.Query('MyRecommend');
    query.equalTo('userName', '==', that.data.userName);
    query.equalTo('recoName', '==', String(that.data.recoName).trim());

    query.find().then(function (results) {
      if (!results.length) {
        var created = Bmob.Query('MyRecommend');
        that.applyMyRecommendFields(created);
        return created.save().then(function () {
          wx.switchTab({ url: '../index/index' });
          setTimeout(function () {
            wx.showToast({ title: '推荐成功', icon: 'success', duration: 2000 });
          }, 320);
        });
      }
      var row = results[0];
      that.applyMyRecommendFields(row);
      return row.save().then(function () {
        wx.switchTab({ url: '../index/index' });
        setTimeout(function () {
          wx.showToast({ title: '档案已更新', icon: 'success', duration: 2000 });
        }, 320);
      });
    }).catch(function () {
      wx.showToast({
        title: '提交失败，请稍后重试',
        icon: 'none',
        duration: 2000,
      });
    });
  },
});
