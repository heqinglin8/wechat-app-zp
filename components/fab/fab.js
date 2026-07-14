var app = getApp();

Component({
  data: {
    showJobSeekerEntry: false,
    showRecruitEntry: true
  },
  lifetimes: {
    attached: function () {
      this.refreshEntryVisibility();
    }
  },
  pageLifetimes: {
    show: function () {
      this.refreshEntryVisibility();
    }
  },
  methods: {
    firstText: function () {
      for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined && arguments[i] !== null) {
          var text = String(arguments[i]).trim();
          if (text) {
            return text;
          }
        }
      }
      return '';
    },
    getCurrentUser: function () {
      var Bmob = typeof wx !== 'undefined' && wx.Bmob;
      return Bmob && Bmob.User && Bmob.User.current ? Bmob.User.current() : null;
    },
    isLoggedIn: function () {
      var currentUser = this.getCurrentUser();
      return !!(currentUser && currentUser.objectId);
    },
    fetchCurrentUserInfo: function (userId) {
      var Bmob = typeof wx !== 'undefined' && wx.Bmob;
      if (!Bmob || !Bmob.Query || !userId) {
        return Promise.resolve(null);
      }
      var query = Bmob.Query('_User');
      query.equalTo('objectId', '==', userId);
      return query.find().then(function (results) {
        return results && results.length ? results[0] : null;
      });
    },
    showLoginPrompt: function (publishType) {
      wx.showModal({
        title: '提示',
        content: '只有登录后才能发布' + publishType,
        showCancel: false,
        confirmText: '知道了',
        success: function () {
          wx.switchTab({
            url: '/pages/personal/personal'
          });
        }
      });
    },
    showSetInfoPrompt: function (publishType) {
      wx.showModal({
        title: '提示',
        content: '先完善电话号微信才能发布' + publishType,
        showCancel: false,
        confirmText: '去完善',
        success: function () {
          wx.navigateTo({
            url: '/pages/setinfor/setinfor'
          });
        }
      });
    },
    ensurePublishReady: function (publishType, targetUrl) {
      var that = this;
      var currentUser = this.getCurrentUser();
      if (!currentUser || !currentUser.objectId) {
        this.showLoginPrompt(publishType);
        return;
      }

      this.fetchCurrentUserInfo(currentUser.objectId).then(function (userInfo) {
        if (!userInfo) {
          that.showLoginPrompt(publishType);
          return;
        }

        var mobilePhoneNumber = that.firstText(userInfo.mobilePhoneNumber);
        var wxid = that.firstText(userInfo.wxid);
        if (!mobilePhoneNumber || !wxid) {
          that.showSetInfoPrompt(publishType);
          return;
        }

        wx.navigateTo({
          url: targetUrl
        });
      }).catch(function (error) {
        console.error('发布前用户信息校验失败', error);
        wx.showToast({
          title: '用户信息获取失败',
          icon: 'none',
          duration: 1500
        });
      });
    },
    applyRoleVisibility: function (roleInfo) {
      var showJobSeekerEntry = this.isLoggedIn() && !!(roleInfo && roleInfo.showJobSeekerEntry);
      this.setData({
        showJobSeekerEntry: showJobSeekerEntry,
        showRecruitEntry: !showJobSeekerEntry
      });
    },
    showDefaultEntry: function () {
      this.setData({
        showJobSeekerEntry: false,
        showRecruitEntry: true
      });
    },
    refreshEntryVisibility: function () {
      var that = this;
      var requestId = Date.now();
      this._roleRequestId = requestId;

      app.getCurrentUserRoleInfo().then(function (roleInfo) {
        if (that._roleRequestId !== requestId) {
          return;
        }
        that.applyRoleVisibility(roleInfo);
      }).catch(function () {
        if (that._roleRequestId === requestId) {
          that.showDefaultEntry();
        }
      });
    },
    onFabTap1() {
      this.ensurePublishReady('求职', '/pages/pubilshJobSeek/pubilshJobSeek');
    },
    onFabTap2() {
      this.ensurePublishReady('招聘', '/pages/publishjob/publishjob');
    }
  }
});
