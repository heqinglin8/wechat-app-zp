var userRole = require('../utils/userRole');

var TAB_HOME = {
  pagePath: 'pages/index/index',
  text: '首页',
  iconPath: '/images/index.png',
  selectedIconPath: '/images/index_p.png'
};

var TAB_TODAY_RECRUIT = {
  pagePath: 'pages/today/today',
  text: '今日招聘',
  iconPath: '/images/today.png',
  selectedIconPath: '/images/today_p.png'
};

var TAB_TODAY_JOB_SEEKER = {
  pagePath: 'pages/todayjobseek/todayjobseek',
  text: '今日求职',
  iconPath: '/images/money.png',
  selectedIconPath: '/images/money_p.png'
};

var TAB_PERSONAL = {
  pagePath: 'pages/personal/personal',
  text: '个人中心',
  iconPath: '/images/me.png',
  selectedIconPath: '/images/me_p.png'
};

function cloneTab(tab) {
  return {
    pagePath: tab.pagePath,
    text: tab.text,
    iconPath: tab.iconPath,
    selectedIconPath: tab.selectedIconPath
  };
}

Component({
  data: {
    tabs: [cloneTab(TAB_HOME), cloneTab(TAB_TODAY_RECRUIT), cloneTab(TAB_PERSONAL)],
    selectedPath: '',
    currentRole: ''
  },
  lifetimes: {
    attached: function () {
      this.refreshTabsByRole();
    }
  },
  pageLifetimes: {
    show: function () {
      this.refreshTabsByRole();
    }
  },
  methods: {
    onTabTap: function (e) {
      var pagePath = e.currentTarget.dataset.path;
      if (!pagePath || pagePath === this.data.selectedPath) {
        return;
      }
      wx.switchTab({
        url: '/' + pagePath
      });
    },
    refreshTabsByRole: function () {
      var that = this;
      var app = getApp();

      if (app && typeof app.getCurrentUserRole === 'function') {
        app.getCurrentUserRole().then(function (role) {
          that.applyRole(role);
        }).catch(function () {
          that.applyRole((app && app.globalData && app.globalData.currentUserRole) || '');
        });
        return;
      }

      that.applyRole((app && app.globalData && app.globalData.currentUserRole) || '');
    },
    applyRole: function (role) {
      var roleText = userRole.normalizeRole(role);
      var nextTabs = this.buildTabs(roleText);
      var currentRoute = this.getCurrentRoute();
      this.setData({
        currentRole: roleText,
        tabs: nextTabs
      });
      this.updateSelectedByRoute();
      this.ensureVisibleTodayTab(currentRoute, roleText);
    },
    buildTabs: function (roleText) {
      var todayTab = roleText === userRole.ROLE.JOB_SEEKER
        ? TAB_TODAY_JOB_SEEKER
        : TAB_TODAY_RECRUIT;
      return [
        cloneTab(TAB_HOME),
        cloneTab(todayTab),
        cloneTab(TAB_PERSONAL)
      ];
    },
    getCurrentRoute: function () {
      var pages = getCurrentPages();
      if (!pages || !pages.length) {
        return '';
      }
      return pages[pages.length - 1].route || '';
    },
    updateSelectedByRoute: function () {
      var currentRoute = this.getCurrentRoute();
      var selectedPath = '';
      for (var i = 0; i < this.data.tabs.length; i++) {
        if (this.data.tabs[i].pagePath === currentRoute) {
          selectedPath = currentRoute;
          break;
        }
      }
      this.setData({
        selectedPath: selectedPath
      });
    },
    ensureVisibleTodayTab: function (currentRoute, roleText) {
      var shouldGoJobSeeker = roleText === userRole.ROLE.JOB_SEEKER;
      var hiddenRoute = shouldGoJobSeeker ? TAB_TODAY_RECRUIT.pagePath : TAB_TODAY_JOB_SEEKER.pagePath;
      var visibleRoute = shouldGoJobSeeker ? TAB_TODAY_JOB_SEEKER.pagePath : TAB_TODAY_RECRUIT.pagePath;
      if (currentRoute !== hiddenRoute) {
        return;
      }
      wx.switchTab({
        url: '/' + visibleRoute
      });
    }
  }
});
