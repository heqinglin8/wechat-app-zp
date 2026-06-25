// pages/linkings/linkings.js

//引入SDK
var Bmob = wx.Bmob;
var util = require('../../utils/util.js');

var DEFAULT_AVATAR = '../../images/default_user_avatar.jpeg';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    linkings: [],
    loading: false
  },
  firstNonEmpty: function () {
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  },
  buildMetaText: function (userInfo) {
    var roleJob = this.firstNonEmpty(userInfo.jobRole, userInfo.roleJobRole, userInfo.position, userInfo.roleName, '未填职位');
    var roleTypeRaw = this.firstNonEmpty(userInfo.role, userInfo.identity, userInfo.roleType, userInfo.userType);
    var roleType = '未知身份';
    if (roleTypeRaw === '1' || roleTypeRaw === 1 || String(roleTypeRaw).indexOf('招') >= 0) {
      roleType = '招聘者';
    } else if (roleTypeRaw === '2' || roleTypeRaw === 2 || String(roleTypeRaw).indexOf('求职') >= 0) {
      roleType = '求职者';
    } else if (roleTypeRaw) {
      roleType = String(roleTypeRaw);
    }
    var education = this.firstNonEmpty(userInfo.education, userInfo.educationText, '未填学历');
    return roleJob + ' | ' + roleType + ' | ' + education;
  },
  formatLinkingItem: function (row, userInfo, index) {
    var uid = this.firstNonEmpty(row && row.applyUserid);
    var info = userInfo || {};
    var type = Number(row && row.type);
    var linkType = type === 2 ? 'wechat' : 'phone';
    var avatarPath = this.firstNonEmpty(info.avatarPath, info.imgSrc, info.avatar, info.avatarUrl);
    return {
      rowIndex: index,
      uid: uid,
      username: this.firstNonEmpty(info.username, info.nickname, '未命名用户'),
      avatar: avatarPath ? util.toDisplayUrl(avatarPath) : DEFAULT_AVATAR,
      meta: this.buildMetaText(info),
      linkType: linkType,
      linkTypeText: linkType === 'wechat' ? '微信' : '电话',
      icon: linkType === 'wechat' ? '../../images/wechat.png' : '../../images/tel.png',
      phone: this.firstNonEmpty(info.mobilePhoneNumber, info.userphone, info.phone, info.mobile, info.tel),
      wechat: this.firstNonEmpty(info.wxid, info.wechat, info.weixin, info.wechatNo)
    };
  },
  queryApplicantUser: function (uid) {
    if (!uid) return Promise.resolve(null);
    var query = Bmob.Query('_User');
    query.equalTo('objectId', '==', uid);
    return query.find().then(function (rows) {
      return rows && rows.length ? rows[0] : null;
    }).catch(function () {
      return null;
    });
  },
  loadLinkingList: function () {
    var that = this;
    var currentUser = Bmob.User.current();
    var currentUid = currentUser ? currentUser.objectId : '';
    that.setData({ loading: true });
    if (!currentUid) {
      that.setData({
        linkings: [],
        loading: false
      });
      return;
    }
    var linkingQuery = Bmob.Query('linking');
    linkingQuery.equalTo('verifyUserid', '==', currentUid);
    linkingQuery.find().then(function (rows) {
      var list = (Array.isArray(rows) ? rows : []).filter(function (row) {
        return !!that.firstNonEmpty(row && row.applyUserid);
      }); 
      var tasks = list.map(function (row, index) {
        var applyUid = that.firstNonEmpty(row && row.applyUserid);
        return that.queryApplicantUser(applyUid).then(function (userInfo) {
          return that.formatLinkingItem(row, userInfo, index);
        });
      });
      return Promise.all(tasks).then(function (linkings) {
        that.setData({
          linkings: linkings,
          loading: false
        });
      });
    }).catch(function (error) {
      console.log('加载联系方式交换记录失败:', error);
      that.setData({
        loading: false,
        linkings: []
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },
  onTapContactIcon: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    var list = this.data.linkings || [];
    var item = list[index];
    if (!item) return;
    var that = this;
    wx.showModal({
      title: '交换提醒',
      content: '此人向你申请交换' + item.linkTypeText + '，是否接受？',
      cancelText: '取消',
      confirmText: '接受',
      success: function (res) {
        if (res.confirm) {
          that.showContactDetail(item);
        }
      }
    });
  },
  showContactDetail: function (item) {
    var value = item.linkType === 'wechat' ? item.wechat : item.phone;
    var label = item.linkType === 'wechat' ? '微信号' : '手机号';
    if (!value) {
      wx.showToast({
        title: '对方未填写' + label,
        icon: 'none'
      });
      return;
    }
    wx.showModal({
      title: item.username + '的' + label,
      content: value,
      showCancel: true,
      cancelText: '知道了',
      confirmText: '复制',
      success: function (res) {
        if (!res.confirm) return;
        wx.setClipboardData({
          data: value,
          success: function () {
            wx.showToast({
              title: '已复制到剪贴板',
              icon: 'none'
            });
          }
        });
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    this.loadLinkingList();
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
