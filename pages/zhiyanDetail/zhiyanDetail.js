var Bmob = wx.Bmob;
var postService = require('../../services/postService');

Page({
  data: {
    postId: '',
    post: null,
    loading: true,
    notFound: false,
    detailMessageEnabled: true
  },

  onLoad: function (options) {
    var postId = options && options.postId ? options.postId : '';
    this.setData({ postId: postId });
    this.loadDetail();
  },

  onShow: function () {
    if (this.data.postId && this.data.post) {
      this.refreshInteraction();
    }
  },

  loadDetail: function () {
    var that = this;
    if (!this.data.postId) {
      this.setData({ loading: false, notFound: true });
      return;
    }
    this.setData({ loading: true, notFound: false });
    postService.loadPostDetail({
      Bmob: Bmob,
      postId: this.data.postId
    }).then(function (post) {
      if (!post) {
        that.setData({ loading: false, notFound: true, post: null });
        wx.showToast({ title: '帖子不存在', icon: 'none', duration: 1800 });
        return;
      }
      that.setData({
        post: post,
        loading: false,
        notFound: false
      });
    }).catch(function (err) {
      console.error('职言详情加载失败:', err);
      that.setData({ loading: false, notFound: true, post: null });
      wx.showToast({ title: '帖子加载失败', icon: 'none', duration: 1800 });
    });
  },

  refreshInteraction: function () {
    var that = this;
    var post = this.data.post || {};
    if (!post.objectId) return;
    postService.refreshPostInteraction({
      Bmob: Bmob,
      postId: post.objectId,
      userId: postService.getCurrentUserId(Bmob)
    }).then(function (state) {
      var nextPost = that.data.post;
      if (!nextPost) return;
      nextPost.likeCount = state.likeCount;
      nextPost.liked = state.liked;
      nextPost.commentCount = state.commentCount;
      that.setData({ post: nextPost });
    });
  },

  onLikeTap: function () {
    var that = this;
    var post = this.data.post || {};
    if (!post.objectId) return;
    if (this._likePending) return;
    var userId = postService.getCurrentUserId(Bmob);
    if (!userId) {
      wx.showToast({ title: '请先登录后点赞', icon: 'none', duration: 1600 });
      return;
    }
    this._likePending = true;
    postService.toggleLike({
      Bmob: Bmob,
      postId: post.objectId,
      userId: userId
    }).then(function (state) {
      var nextPost = that.data.post;
      if (!nextPost) return;
      nextPost.liked = state.liked;
      nextPost.likeCount = state.likeCount;
      that.setData({ post: nextPost });
    }).catch(function (err) {
      console.error('职言详情点赞失败:', err);
      wx.showToast({ title: '操作失败，请稍后再试', icon: 'none', duration: 1800 });
    }).then(function () {
      that._likePending = false;
    });
  },

  onCommentTap: function () {
    wx.pageScrollTo({
      selector: '#zhiyan-comments',
      duration: 250
    });
  },

  onPreviewImage: function (e) {
    var index = e.currentTarget.dataset.index || 0;
    var photos = this.data.post && this.data.post.detailPhotos ? this.data.post.detailPhotos : [];
    if (!photos.length) return;
    wx.previewImage({
      current: photos[index] || photos[0],
      urls: photos
    });
  },

  onShareAppMessage: function () {
    var post = this.data.post || {};
    return {
      title: post.titleText || '职言详情',
      path: post.objectId ? '/pages/zhiyanDetail/zhiyanDetail?postId=' + post.objectId : '/pages/zhiyan/zhiyan',
      imageUrl: post.detailPhotos && post.detailPhotos.length ? post.detailPhotos[0] : undefined
    };
  }
});
