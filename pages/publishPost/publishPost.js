var Bmob = wx.Bmob;
var imageUpload = require('../../utils/imageUpload');
var postService = require('../../services/postService');

var MAX_TITLE_LENGTH = 20;
var MAX_POST_PHOTOS = 6;
var MAX_PHOTO_BYTES = 3145728;
var ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
var DEFAULT_AUTHOR = {
  name: '昵称未填写',
  avatar: '/images/default_user_avatar.jpeg',
  metaText: '职业信息未填写'
};

Page({
  data: {
    statusBarHeight: 0,
    title: '',
    titleCount: 0,
    content: '',
    author: DEFAULT_AUTHOR,
    currentUserId: '',
    userLoaded: false,
    postPhotos: [],
    chooseImageBusy: false,
    submitting: false,
    canSubmit: false,
    emojiOpen: false,
    emojis: ['😀', '😂', '😊', '😍', '👍', '🙏', '🎉', '💪', '🌟', '❤️']
  },

  onLoad: function () {
    this._photoSeq = 0;
    this.setupLayout();
    this.refreshCurrentUser();
  },

  setupLayout: function () {
    var statusBarHeight = 0;
    try {
      var info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      statusBarHeight = info.statusBarHeight || 0;
    } catch (e) {}
    this.setData({ statusBarHeight: statusBarHeight });
  },

  refreshCurrentUser: function () {
    var that = this;
    var userId = postService.getCurrentUserId(Bmob);
    if (!userId) {
      this.setData({
        author: DEFAULT_AUTHOR,
        currentUserId: '',
        userLoaded: true,
        canSubmit: false
      });
      wx.showToast({ title: '请先登录后发布', icon: 'none', duration: 1800 });
      return Promise.resolve(null);
    }
    return postService.loadCurrentAuthor({
      Bmob: Bmob,
      userId: userId
    }).then(function (author) {
      that.setData({
        author: author || DEFAULT_AUTHOR,
        currentUserId: userId,
        userLoaded: true,
        canSubmit: that.canSubmitWith({ currentUserId: userId })
      });
      return author;
    }).catch(function (err) {
      console.error('职言发布页用户加载失败:', err);
      that.setData({
        author: DEFAULT_AUTHOR,
        currentUserId: userId,
        userLoaded: true,
        canSubmit: that.canSubmitWith({ currentUserId: userId })
      });
      return null;
    });
  },

  canSubmitWith: function (overrides) {
    var d = {};
    var key;
    for (key in this.data) d[key] = this.data[key];
    overrides = overrides || {};
    for (key in overrides) d[key] = overrides[key];
    return !!(
      d.currentUserId &&
      String(d.content || '').trim() &&
      this.photosReadyForSubmit(d.postPhotos) &&
      !d.submitting
    );
  },

  updateCanSubmit: function (overrides) {
    this.setData({ canSubmit: this.canSubmitWith(overrides || {}) });
  },

  onTitleInput: function (e) {
    var value = (e.detail && e.detail.value) || '';
    if (value.length > MAX_TITLE_LENGTH) value = value.slice(0, MAX_TITLE_LENGTH);
    this.setData({
      title: value,
      titleCount: value.length
    });
  },

  onContentInput: function (e) {
    var value = (e.detail && e.detail.value) || '';
    this.setData({
      content: value,
      canSubmit: this.canSubmitWith({ content: value })
    });
  },

  toggleEmoji: function () {
    this.setData({ emojiOpen: !this.data.emojiOpen });
  },

  onEmojiTap: function (e) {
    var emoji = e.currentTarget.dataset.emoji || '';
    if (!emoji) return;
    var content = this.data.content + emoji;
    this.setData({
      content: content,
      canSubmit: this.canSubmitWith({ content: content })
    });
  },

  nextPhotoId: function () {
    this._photoSeq = (this._photoSeq || 0) + 1;
    return 'post_photo_' + Date.now() + '_' + this._photoSeq;
  },

  onAddPhotos: function () {
    var that = this;
    if (this.data.chooseImageBusy) return;
    var remain = MAX_POST_PHOTOS - this.data.postPhotos.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多添加6张图片', icon: 'none', duration: 1600 });
      return;
    }
    this.setData({ chooseImageBusy: true, emojiOpen: false });
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var paths = (res && res.tempFilePaths) || [];
        var files = (res && res.tempFiles) || [];
        that.appendPhotos(paths, files);
      },
      fail: function () {
        that.setData({ chooseImageBusy: false });
      }
    });
  },

  appendPhotos: function (paths, files) {
    var that = this;
    var remain = MAX_POST_PHOTOS - this.data.postPhotos.length;
    var selected = (paths || []).slice(0, Math.max(0, remain));
    var seq = Promise.resolve();
    if (!selected.length) {
      this.setData({ chooseImageBusy: false });
      return;
    }
    selected.forEach(function (path, index) {
      seq = seq.then(function () {
        var file = files && files[index];
        var fallbackSize = file && typeof file.size === 'number' ? file.size : undefined;
        return that.addAndUploadPhoto(path, fallbackSize);
      });
    });
    seq.then(function () {}, function () {}).then(function () {
      that.setData({
        chooseImageBusy: false,
        canSubmit: that.canSubmitWith()
      });
    });
  },

  addAndUploadPhoto: function (filePath, fallbackSize) {
    var that = this;
    var id = this.nextPhotoId();
    var next = this.data.postPhotos.concat([{
      id: id,
      url: '',
      path: '',
      tempPath: filePath,
      uploading: true
    }]);
    this.setData({
      postPhotos: next,
      canSubmit: this.canSubmitWith({ postPhotos: next })
    });
    return imageUpload.prepareImage(filePath, {
      maxBytes: MAX_PHOTO_BYTES,
      allowedExt: ALLOWED_IMAGE_EXT,
      fallbackSize: fallbackSize
    }).then(function (imageInfo) {
      return imageUpload.uploadPreparedImage({
        Bmob: Bmob,
        imageInfo: imageInfo,
        prefix: 'post',
        slotIndex: id
      });
    }).then(function (photo) {
      var list = that.data.postPhotos.slice();
      var found = false;
      list.forEach(function (item) {
        if (item.id !== id) return;
        item.url = photo.url;
        item.path = photo.path;
        item.tempPath = '';
        item.uploading = false;
        found = true;
      });
      if (!found) return;
      that.setData({
        postPhotos: list,
        canSubmit: that.canSubmitWith({ postPhotos: list })
      });
    }).catch(function (err) {
      console.error('职言帖子图片上传失败:', err);
      var list = that.data.postPhotos.filter(function (item) {
        return item.id !== id;
      });
      that.setData({
        postPhotos: list,
        canSubmit: that.canSubmitWith({ postPhotos: list })
      });
      imageUpload.showImageError(err);
    });
  },

  onPreviewPhoto: function (e) {
    var id = e.currentTarget.dataset.id;
    var current = '';
    var urls = [];
    this.data.postPhotos.forEach(function (item) {
      var url = item.url || item.tempPath;
      if (!url) return;
      urls.push(url);
      if (item.id === id) current = url;
    });
    if (!urls.length) return;
    wx.previewImage({
      current: current || urls[0],
      urls: urls
    });
  },

  onRemovePhoto: function (e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    var list = this.data.postPhotos.filter(function (item) {
      return item.id !== id;
    });
    this.setData({
      postPhotos: list,
      canSubmit: this.canSubmitWith({ postPhotos: list })
    });
  },

  photosReadyForSubmit: function (photos) {
    photos = photos || this.data.postPhotos;
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].uploading) return false;
      if (photos[i].tempPath && !photos[i].path) return false;
    }
    return true;
  },

  buildPhotoImgsField: function () {
    var parts = [];
    this.data.postPhotos.forEach(function (photo) {
      if (photo.path) parts.push(photo.path);
    });
    return parts.join('|');
  },

  onSubmitTap: function () {
    var that = this;
    var content = String(this.data.content || '').trim();
    if (this.data.submitting) return;
    if (!this.data.currentUserId) {
      wx.showToast({ title: '请先登录后发布', icon: 'none', duration: 1800 });
      return;
    }
    if (!content) {
      wx.showToast({ title: '请填写正文', icon: 'none', duration: 1800 });
      return;
    }
    if (!this.photosReadyForSubmit()) {
      wx.showToast({ title: '请等待图片上传完成', icon: 'none', duration: 1800 });
      return;
    }
    this.setData({
      submitting: true,
      canSubmit: false,
      emojiOpen: false
    });
    postService.createPost({
      Bmob: Bmob,
      title: this.data.title,
      content: content,
      photoImgs: this.buildPhotoImgsField(),
      commitUid: this.data.currentUserId,
      commitUsername: this.data.author && this.data.author.name,
      active: 1
    }).then(function () {
      that.markListNeedsRefresh();
      wx.showToast({ title: '发布成功', icon: 'success', duration: 900 });
      setTimeout(function () {
        that.goBack();
      }, 500);
    }).catch(function (err) {
      console.error('职言帖子发布失败:', err);
      that.setData({
        submitting: false,
        canSubmit: that.canSubmitWith({ submitting: false })
      });
      var message = err && err.message === 'missing_content' ? '请填写正文' : '发布失败，请稍后再试';
      wx.showToast({ title: message, icon: 'none', duration: 1800 });
    });
  },

  markListNeedsRefresh: function () {
    var pages = getCurrentPages ? getCurrentPages() : [];
    var prev = pages && pages.length > 1 ? pages[pages.length - 2] : null;
    if (prev && prev.route === 'pages/zhiyan/zhiyan') {
      prev._needRefreshOnShow = true;
    }
  },

  hasDraft: function () {
    return !!(
      String(this.data.title || '').trim() ||
      String(this.data.content || '').trim() ||
      this.data.postPhotos.length
    );
  },

  onCloseTap: function () {
    var that = this;
    if (!this.hasDraft()) {
      this.goBack();
      return;
    }
    wx.showModal({
      title: '放弃发布？',
      content: '当前编辑内容不会保存',
      confirmText: '放弃',
      cancelText: '继续编辑',
      success: function (res) {
        if (res.confirm) that.goBack();
      }
    });
  },

  goBack: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () {
        wx.switchTab({ url: '/pages/zhiyan/zhiyan' });
      }
    });
  }
});
