var Bmob = wx.Bmob;
var cardFormatter = require('../../utils/cardFormatter');
var companyCache = require('../../utils/companyCache');

function firstText() {
  return cardFormatter.firstText.apply(cardFormatter, arguments);
}

function cloneRow(row) {
  var target = {};
  row = row || {};
  Object.keys(row).forEach(function (key) {
    target[key] = row[key];
  });
  return target;
}

function decorateCollectJob(job, collect) {
  var card = cardFormatter.decorateJobCard(cloneRow(job));
  card.collectRecordId = firstText(collect && collect.objectId);
  card.collectType = '1';
  card.objectId = firstText(card.objectId, collect && collect.jobId);
  card.targetId = card.objectId;
  card.commitUid = firstText(job && job.commitUid);
  return card;
}

function decorateCollectSeeker(seeker, collect) {
  var card = cardFormatter.decorateJobSeekerCard(cloneRow(seeker));
  card.collectRecordId = firstText(collect && collect.objectId);
  card.collectType = '2';
  card.objectId = firstText(card.objectId, collect && collect.jobId);
  card.targetId = card.objectId;
  card.commitUid = firstText(seeker && seeker.commitUid);
  return card;
}

Page({
  data: {
    tabs: [
      { type: '1', text: '招聘' },
      { type: '2', text: '求职' }
    ],
    currentTab: 0,
    currentType: '1',
    userId: '',
    items: [],
    isEmpty: false,
    loading: false,
    loadingTip: '加载中...',
    actionSheetVisible: false,
    activeItem: null
  },

  onLoad: function (options) {
    var currentUser = Bmob.User.current();
    var userId = (currentUser && currentUser.objectId) || (options && options.userId) || '';
    this.setData({
      userId: userId
    });
  },

  onShow: function () {
    var currentUser = Bmob.User.current();
    var userId = (currentUser && currentUser.objectId) || this.data.userId || '';
    if (!userId) {
      this.setData({
        userId: '',
        items: [],
        isEmpty: true,
        loading: false,
        loadingTip: '请先登录'
      });
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    if (userId !== this.data.userId) {
      this.setData({
        userId: userId
      });
    }
    this.loadCollections();
  },

  onPullDownRefresh: function () {
    this.loadCollections().finally(function () {
      wx.stopPullDownRefresh();
    });
  },

  currentTabInfo: function () {
    return this.data.tabs[this.data.currentTab] || this.data.tabs[0];
  },

  onTabTap: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    if (isNaN(index) || index < 0 || index >= this.data.tabs.length) {
      return;
    }
    if (index === this.data.currentTab) {
      return;
    }
    var tab = this.data.tabs[index];
    var that = this;
    this.setData({
      currentTab: index,
      currentType: tab.type,
      items: [],
      isEmpty: false,
      actionSheetVisible: false,
      activeItem: null
    }, function () {
      that.loadCollections();
    });
  },

  loadCollections: function () {
    var that = this;
    var userId = firstText(that.data.userId);
    var type = firstText(that.data.currentType, '1');
    if (!userId) {
      that.setData({
        items: [],
        isEmpty: true,
        loading: false,
        loadingTip: '请先登录'
      });
      return Promise.resolve();
    }

    that.setData({
      loading: true,
      loadingTip: '加载中...'
    });

    var prepare = type === '1' ? companyCache.ensureLoaded(Bmob) : Promise.resolve();
    return prepare.then(function () {
      var query = Bmob.Query('MyCollectInfo');
      query.equalTo('userId', '==', userId);
      query.equalTo('type', '==', type);
      query.order('-createdAt');
      return query.find();
    }).then(function (rows) {
      rows = Array.isArray(rows) ? rows : [];
      if (!rows.length) {
        that.setData({
          items: [],
          isEmpty: true,
          loading: false,
          loadingTip: '没有更多内容'
        });
        return;
      }
      var tasks = rows.map(function (row) {
        return that.fetchTarget(type, row);
      });
      return Promise.all(tasks).then(function (items) {
        var list = items.filter(function (item) {
          return !!(item && item.collectRecordId && item.objectId);
        });
        that.setData({
          items: list,
          isEmpty: list.length === 0,
          loading: false,
          loadingTip: '没有更多内容'
        });
      });
    }).catch(function (error) {
      console.log('我的收藏加载失败:', error);
      that.setData({
        items: [],
        isEmpty: true,
        loading: false,
        loadingTip: '加载失败'
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 1500
      });
    });
  },

  fetchTarget: function (type, collect) {
    var jobId = firstText(collect && collect.jobId);
    if (!jobId) {
      return Promise.resolve(null);
    }
    var tableName = type === '2' ? 'JobSeeker' : 'JobInfo';
    var query = Bmob.Query(tableName);
    query.equalTo('objectId', '==', jobId);
    return query.find().then(function (rows) {
      var target = rows && rows[0];
      if (!target) {
        return null;
      }
      return type === '2'
        ? decorateCollectSeeker(target, collect)
        : decorateCollectJob(target, collect);
    }).catch(function () {
      return null;
    });
  },

  showDetail: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    var item = (this.data.items || [])[index] || {};
    if (!item.objectId) {
      wx.showToast({
        title: '信息不存在',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    wx.navigateTo({
      url: item.collectType === '2'
        ? '../seekerDetail/seekerDetail?jobSeekId=' + item.objectId
        : '../jobDetail/jobDetail?jobId=' + item.objectId
    });
  },

  openActionSheet: function (e) {
    var index = Number(e.currentTarget.dataset.index);
    var item = (this.data.items || [])[index] || null;
    if (!item) {
      return;
    }
    this.setData({
      actionSheetVisible: true,
      activeItem: item
    });
  },

  closeActionSheet: function () {
    this.setData({
      actionSheetVisible: false,
      activeItem: null
    });
  },

  onDeleteAction: function () {
    var that = this;
    var item = that.data.activeItem || {};
    var collectRecordId = firstText(item.collectRecordId);
    if (!collectRecordId) {
      wx.showToast({
        title: '收藏记录不存在',
        icon: 'none',
        duration: 1500
      });
      that.closeActionSheet();
      return;
    }
    wx.showModal({
      title: '删除收藏',
      content: '确认删除该收藏吗？',
      cancelText: '取消',
      confirmText: '删除',
      success: function (res) {
        if (!res.confirm) {
          return;
        }
        var query = Bmob.Query('MyCollectInfo');
        query.destroy(collectRecordId).then(function () {
          wx.showToast({
            title: '已删除',
            icon: 'success',
            duration: 1500
          });
          that.closeActionSheet();
          that.loadCollections();
        }).catch(function () {
          wx.showToast({
            title: '删除失败',
            icon: 'none',
            duration: 1500
          });
        });
      }
    });
  },

  onEditAction: function () {
    var item = this.data.activeItem || {};
    var userId = firstText(this.data.userId);
    var ownerId = firstText(item.commitUid);
    if (!item.objectId) {
      wx.showToast({
        title: '信息不存在',
        icon: 'none',
        duration: 1500
      });
      this.closeActionSheet();
      return;
    }
    if (!ownerId || ownerId !== userId) {
      wx.showToast({
        title: '无权编辑该信息',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    this.closeActionSheet();
    wx.showToast({
      title: '暂不支持从收藏编辑',
      icon: 'none',
      duration: 1500
    });
  },

  onRetryLoad: function () {
    this.loadCollections();
  },

  noop: function () {}
});
