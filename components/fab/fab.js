var app = getApp();

Component({
  data: {
    showJobSeekerEntry: false,
    showRecruitEntry: false
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
    applyRoleVisibility: function (roleInfo) {
      this.setData({
        showJobSeekerEntry: !!(roleInfo && roleInfo.showJobSeekerEntry),
        showRecruitEntry: !!(roleInfo && roleInfo.showRecruitEntry)
      });
    },
    hideEntries: function () {
      this.setData({
        showJobSeekerEntry: false,
        showRecruitEntry: false
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
          that.hideEntries();
        }
      });
    },
    onFabTap1() {
       wx.navigateTo({
      url: '../pubilshJobSeek/pubilshJobSeek'
    })
    },
    onFabTap2() {
       wx.navigateTo({
      url: '../publishjob/publishjob'
    })
    }
  }
});
