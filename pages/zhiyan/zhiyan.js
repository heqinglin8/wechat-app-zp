var Bmob = wx.Bmob;
var postService = require('../../services/postService');

var PAGE_SIZE = 10;

Page({
  data: {
    posts: [],
    searchValue: '',
    pageIndex: 0,
    loading: false,
    refreshing: false,
    hasMore: true,
    isEmpty: false,
    loadingTip: '上拉加载更多',
  },

  onLoad: function () {
    this.loadFirstPage();
  },

  onShow: function () {
    if (this._needRefreshOnShow) {
      this._needRefreshOnShow = false;
      this.loadFirstPage();
      return;
    }
    if (this.data.posts && this.data.posts.length) {
      this.refreshVisibleInteractions();
    }
  },

  onPullDownRefresh: function () {
    this.loadFirstPage().then(function () {
      wx.stopPullDownRefresh();
    }).catch(function () {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    this.loadMore();
  },

  loadFirstPage: function () {
    var that = this;
    this._requestId = Date.now();
    var requestId = this._requestId;
    this.setData({
      posts: [],
      pageIndex: 0,
      loading: true,
      hasMore: true,
      isEmpty: false,
      loadingTip: '加载中'
    });
    return this.loadPosts(0).then(function (result) {
      if (that._requestId !== requestId) return;
      that.applyLoadedPosts(result, true);
    }).catch(function (err) {
      if (that._requestId !== requestId) return;
      console.error('职言列表加载失败:', err);
      that.setData({
        loading: false,
        hasMore: false,
        isEmpty: true,
        loadingTip: '加载失败'
      });
      wx.showToast({ title: '帖子加载失败', icon: 'none', duration: 1800 });
    });
  },

  loadMore: function () {
    var that = this;
    if (this.data.loading || !this.data.hasMore || this.data.isEmpty) return;
    var nextPage = this.data.pageIndex;
    this.setData({
      loading: true,
      loadingTip: '加载中'
    });
    this.loadPosts(nextPage).then(function (result) {
      that.applyLoadedPosts(result, false);
    }).catch(function (err) {
      console.error('职言分页加载失败:', err);
      that.setData({
        loading: false,
        loadingTip: '加载失败，稍后再试'
      });
    });
  },

  loadPosts: function (pageIndex) {
    var keyword = String(this.data.searchValue || '').trim();
    var options = {
      Bmob: Bmob,
      pageIndex: pageIndex,
      pageSize: PAGE_SIZE,
      keyword: keyword
    };
    return keyword ? postService.searchPosts(options) : postService.loadPosts(options);
  },

  applyLoadedPosts: function (result, reset) {
    var loaded = result && result.list ? result.list : [];
    var current = reset ? [] : this.data.posts.slice();
    var next = current.concat(loaded);
    var hasMore = !!(result && result.hasMore);
    this.setData({
      posts: next,
      pageIndex: reset ? 1 : this.data.pageIndex + 1,
      loading: false,
      hasMore: hasMore,
      isEmpty: next.length === 0,
      loadingTip: next.length === 0 ? '' : (hasMore ? '上拉加载更多' : '没有更多内容')
    });
    this.measureTitleOverflow();
  },

  refreshVisibleInteractions: function () {
    var that = this;
    var posts = this.data.posts || [];
    if (!posts.length) return Promise.resolve();
    var userId = postService.getCurrentUserId(Bmob);
    var requestId = Date.now();
    this._interactionRequestId = requestId;
    var tasks = posts.map(function (post) {
      if (!post || !post.objectId) return Promise.resolve(null);
      return postService.refreshPostInteraction({
        Bmob: Bmob,
        postId: post.objectId,
        userId: userId
      }).then(function (state) {
        return {
          postId: post.objectId,
          state: state
        };
      }).catch(function () {
        return null;
      });
    });
    return Promise.all(tasks).then(function (results) {
      if (that._interactionRequestId !== requestId) return;
      var stateMap = {};
      (results || []).forEach(function (item) {
        if (item && item.postId) stateMap[item.postId] = item.state;
      });
      var nextPosts = that.data.posts.slice();
      nextPosts.forEach(function (post) {
        var state = post && stateMap[post.objectId];
        if (!state) return;
        post.likeCount = state.likeCount;
        post.commentCount = state.commentCount;
        post.liked = !!state.liked;
      });
      that.setData({ posts: nextPosts });
    });
  },

  measureTitleOverflow: function () {
    var that = this;
    var posts = this.data.posts || [];
    if (!posts.length) return;
    setTimeout(function () {
      var windowWidth = 375;
      try {
        var info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        windowWidth = info.windowWidth || windowWidth;
      } catch (e) {}
      var lineHeightPx = 44 * windowWidth / 750;
      var maxHeight = lineHeightPx * 3 + 2;
      wx.createSelectorQuery()
        .selectAll('.post-title-measure')
        .fields({ size: true, dataset: true }, function (rects) {
          if (!rects || !rects.length) return;
          var nextPosts = that.data.posts.slice();
          rects.forEach(function (rect, index) {
            var postIndex = rect && rect.dataset ? Number(rect.dataset.index) : index;
            if (isNaN(postIndex) || !nextPosts[postIndex]) return;
            var byHeight = rect && rect.height > maxHeight;
            var byLength = String(nextPosts[postIndex].titleText || '').length > 48;
            nextPosts[postIndex].showTitleFullAction = !!(byHeight || byLength);
          });
          that.setData({ posts: nextPosts });
        })
        .exec();
    }, 60);
  },

  onSearchInput: function (e) {
    this.setData({
      searchValue: (e.detail && e.detail.value) || ''
    });
  },

  onSearchConfirm: function () {
    this.loadFirstPage();
  },

  onClearSearch: function () {
    this.setData({ searchValue: '' });
    this.loadFirstPage();
  },

  onPublishTap: function () {
    var userId = postService.getCurrentUserId(Bmob);
    if (!userId) {
      wx.showModal({
        title: '提示',
        content: '登录后才能发帖',
        showCancel: false,
        confirmText: '知道了',
        success: function (res) {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/personal/personal'
            });
          }
        }
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/publishPost/publishPost',
      fail: function () {
        wx.showToast({
          title: '发布页打开失败',
          icon: 'none',
          duration: 1800
        });
      }
    });
  },

  navigateToDetailByIndex: function (index) {
    var item = this.data.posts[index];
    if (!item || !item.objectId) return;
    wx.navigateTo({
      url: '/pages/zhiyanDetail/zhiyanDetail?postId=' + item.objectId
    });
  },

  onCardTap: function (e) {
    this.navigateToDetailByIndex(e.currentTarget.dataset.index);
  },

  onFullTextTap: function (e) {
    this.navigateToDetailByIndex(e.currentTarget.dataset.index);
  },

  onCommentTap: function (e) {
    this.navigateToDetailByIndex(e.currentTarget.dataset.index);
  },

  onLikeTap: function (e) {
    var that = this;
    var index = e.currentTarget.dataset.index;
    var item = this.data.posts[index];
    if (!item || !item.objectId) return;
    if (this._likePending && this._likePending[item.objectId]) return;
    var userId = postService.getCurrentUserId(Bmob);
    if (!userId) {
      wx.showToast({ title: '请先登录后点赞', icon: 'none', duration: 1600 });
      return;
    }
    this._likePending = this._likePending || {};
    this._likePending[item.objectId] = true;
    postService.toggleLike({
      Bmob: Bmob,
      postId: item.objectId,
      userId: userId
    }).then(function (state) {
      var posts = that.data.posts.slice();
      if (posts[index]) {
        posts[index].liked = state.liked;
        posts[index].likeCount = state.likeCount;
      }
      that.setData({ posts: posts });
    }).catch(function (err) {
      console.error('职言点赞失败:', err);
      wx.showToast({ title: '操作失败，请稍后再试', icon: 'none', duration: 1800 });
    }).then(function () {
      that._likePending[item.objectId] = false;
    });
  },

  noop: function () {},

  onPreviewImage: function (e) {
    var index = e.currentTarget.dataset.index;
    var photoIndex = e.currentTarget.dataset.photoIndex;
    var item = this.data.posts[index];
    if (!item || !item.listPhotos || !item.listPhotos.length) return;
    wx.previewImage({
      current: item.listPhotos[photoIndex] || item.listPhotos[0],
      urls: item.listPhotos
    });
  },

  onShareAppMessage: function (res) {
    var index = res && res.target && res.target.dataset ? res.target.dataset.index : undefined;
    var item = this.data.posts[index] || {};
    return {
      title: item.titleText || '职言',
      path: item.objectId ? '/pages/zhiyanDetail/zhiyanDetail?postId=' + item.objectId : '/pages/zhiyan/zhiyan',
      imageUrl: item.listPhotos && item.listPhotos.length ? item.listPhotos[0] : undefined
    };
  }
});
