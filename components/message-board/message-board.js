var messageBoard = require('../../utils/messageBoard.js');

Component({
  properties: {
    targetType: {
      type: String,
      value: '',
    },
    targetId: {
      type: String,
      value: '',
    },
    detailMessageEnabled: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    messages: [],
    content: '',
    replyContent: '',
    activeReplyParentId: '',
    selectedImage: null,
    imageUploading: false,
    replySelectedImage: null,
    replyImageUploading: false,
    loading: false,
    loadingMore: false,
    submitting: false,
    pageIndex: 0,
    pageSize: messageBoard.PAGE_SIZE,
    hasMore: false,
    globalMessageBoardEnabled: true,
    finalEnabled: true,
    currentUser: null,
    isAdmin: false,
    muted: false,
    emojiOpen: false,
    replyEmojiOpen: false,
    emojis: ['😀', '😂', '😊', '😍', '👍', '🙏', '🎉', '💪', '🌟', '❤️'],
  },

  observers: {
    'targetType,targetId,detailMessageEnabled': function () {
      this.loadBoard();
    },
  },

  lifetimes: {
    attached: function () {
      this.loadBoard();
    },
  },

  methods: {
    loadBoard: function () {
      var that = this;
      if (!this.data.targetType || !this.data.targetId) return;
      var token = Date.now();
      this._loadToken = token;
      this.setData({
        loading: true,
        pageIndex: 0,
        hasMore: false,
        messages: [],
      });

      this.refreshCurrentUser().then(function () {
        return messageBoard.readSwitches(
          that.data.targetType,
          that.data.targetId,
          that.data.detailMessageEnabled
        );
      }).then(function (switches) {
        if (that._loadToken !== token) return;
        that.setData({
          globalMessageBoardEnabled: switches.globalMessageBoardEnabled,
          finalEnabled: switches.finalEnabled,
        });
        if (!switches.finalEnabled) {
          that.setData({ loading: false });
          return;
        }
        return that.loadMessages(true);
      }).catch(function (err) {
        console.error('留言板加载失败:', err);
        that.setData({ loading: false });
      });
    },

    refreshCurrentUser: function () {
      var that = this;
      return messageBoard.getCurrentUserProfile().then(function (user) {
        var admin = messageBoard.isAdminUser(user);
        that.setData({
          currentUser: user,
          isAdmin: admin,
        });
        if (!user || !user.objectId) {
          that.setData({ muted: false });
          return null;
        }
        return messageBoard.isMutedUser(user.objectId).then(function (muted) {
          that.setData({ muted: muted });
          return user;
        });
      });
    },

    loadMessages: function (reset) {
      var that = this;
      var pageIndex = reset ? 0 : this.data.pageIndex;
      var loadingKey = reset ? 'loading' : 'loadingMore';
      var state = {};
      state[loadingKey] = true;
      this.setData(state);

      return messageBoard.queryMainMessages(
        this.data.targetType,
        this.data.targetId,
        pageIndex,
        this.data.pageSize,
        this.data.currentUser && this.data.currentUser.objectId,
        this.data.isAdmin
      ).then(function (rows) {
        return messageBoard.attachReplies(
          rows,
          that.data.currentUser && that.data.currentUser.objectId,
          that.data.isAdmin
        );
      }).then(function (rows) {
        var nextMessages = reset ? rows : that.data.messages.concat(rows);
        var next = {
          messages: nextMessages,
          pageIndex: pageIndex + 1,
          hasMore: rows.length >= that.data.pageSize,
        };
        next[loadingKey] = false;
        that.setData(next);
      }).catch(function (err) {
        console.error('留言查询失败:', err);
        var next = {};
        next[loadingKey] = false;
        that.setData(next);
        wx.showToast({ title: '留言加载失败', icon: 'none', duration: 1800 });
      });
    },

    onLoadMore: function () {
      if (this.data.loadingMore || !this.data.hasMore) return;
      this.loadMessages(false);
    },

    onRefreshTap: function () {
      this.loadBoard();
    },

    onContentInput: function (e) {
      this.setData({ content: (e.detail && e.detail.value) || '' });
    },

    onReplyInput: function (e) {
      this.setData({ replyContent: (e.detail && e.detail.value) || '' });
    },

    toggleEmoji: function () {
      this.setData({
        emojiOpen: !this.data.emojiOpen,
        replyEmojiOpen: false,
      });
    },

    toggleReplyEmoji: function () {
      this.setData({
        replyEmojiOpen: !this.data.replyEmojiOpen,
        emojiOpen: false,
      });
    },

    onEmojiTap: function (e) {
      var emoji = e.currentTarget.dataset.emoji || '';
      if (!emoji) return;
      this.setData({ content: this.data.content + emoji });
    },

    onReplyEmojiTap: function (e) {
      var emoji = e.currentTarget.dataset.emoji || '';
      if (!emoji) return;
      this.setData({ replyContent: this.data.replyContent + emoji });
    },

    chooseMessageImage: function (uploadingKey, imageKey) {
      var that = this;
      if (this.data[uploadingKey]) return;
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: function (res) {
          var path = res.tempFilePaths && res.tempFilePaths[0];
          if (!path) return;
          var tempFile = res.tempFiles && res.tempFiles[0];
          var fallbackSize = tempFile && typeof tempFile.size === 'number' ? tempFile.size : undefined;
          var uploadingState = {};
          uploadingState[uploadingKey] = true;
          that.setData(uploadingState);
          messageBoard.prepareImage(path, fallbackSize).then(function (info) {
            console.log('留言图片校验通过:', info);
            return messageBoard.uploadImage(info);
          }).then(function (image) {
            var state = {};
            state[imageKey] = image;
            state[uploadingKey] = false;
            that.setData(state);
          }).catch(function (err) {
            var state = {};
            state[uploadingKey] = false;
            that.setData(state);
            console.error('留言图片处理失败:', err);
            var title = '图片处理失败，请重选';
            var code = err && (err.code || err.message);
            if (code === 'image_limit' || code === 'compress_unavailable' || code === 'compress_failed') {
              title = '图片需小于1MB且不超过1080x960';
            } else if (code === 'upload_failed') {
              title = '图片上传失败，请稍后重试';
            }
            wx.showToast({ title: title, icon: 'none', duration: 2200 });
          });
        },
      });
    },

    chooseImage: function () {
      this.chooseMessageImage('imageUploading', 'selectedImage');
    },

    chooseReplyImage: function () {
      this.chooseMessageImage('replyImageUploading', 'replySelectedImage');
    },

    removeSelectedImage: function () {
      if (this.data.imageUploading) return;
      this.setData({ selectedImage: null });
    },

    removeReplySelectedImage: function () {
      if (this.data.replyImageUploading) return;
      this.setData({ replySelectedImage: null });
    },

    previewSelectedImage: function () {
      var image = this.data.selectedImage;
      if (!image || !image.url) return;
      wx.previewImage({
        current: image.url,
        urls: [image.url],
      });
    },

    previewReplySelectedImage: function () {
      var image = this.data.replySelectedImage;
      if (!image || !image.url) return;
      wx.previewImage({
        current: image.url,
        urls: [image.url],
      });
    },

    previewMessageImage: function (e) {
      var url = e.currentTarget.dataset.url;
      if (!url) return;
      wx.previewImage({
        current: url,
        urls: [url],
      });
    },

    ensureCanSubmit: function () {
      if (!this.data.finalEnabled) {
        wx.showToast({ title: '暂不支持留言', icon: 'none', duration: 1800 });
        return false;
      }
      if (!this.data.currentUser || !this.data.currentUser.objectId) {
        wx.showToast({ title: '请先登录后留言', icon: 'none', duration: 1500 });
        setTimeout(function () {
          wx.switchTab({ url: '/pages/personal/personal' });
        }, 500);
        return false;
      }
      if (this.data.muted) {
        wx.showToast({ title: '当前不可使用留言功能', icon: 'none', duration: 1800 });
        return false;
      }
      return true;
    },

    submitPayload: function (parentId, content, image) {
      var that = this;
      var text = String(content || '').trim();
      if (!text && !image) {
        wx.showToast({ title: '请输入留言内容', icon: 'none', duration: 1500 });
        return;
      }
      if (this.data.submitting) return;

      this.setData({ submitting: true });
      this.refreshCurrentUser().then(function () {
        if (!that.ensureCanSubmit()) return Promise.reject(new Error('blocked'));
        return messageBoard.readSwitches(
          that.data.targetType,
          that.data.targetId,
          that.data.detailMessageEnabled
        );
      }).then(function (switches) {
        if (!switches.finalEnabled) return Promise.reject(new Error('disabled'));
        return messageBoard.readEnabledSensitiveWords();
      }).then(function (words) {
        var hitWord = messageBoard.hitSensitiveWord(text, words);
        return messageBoard.createMessage({
          targetType: that.data.targetType,
          targetId: that.data.targetId,
          parentId: parentId || '',
          content: text,
          image: image || null,
          user: that.data.currentUser,
          isHidden: !!hitWord,
          hiddenReason: hitWord ? 'sensitive_word' : '',
        }).then(function () {
          if (hitWord) {
            wx.showToast({ title: '留言已提交，内容需要审核', icon: 'none', duration: 2200 });
          } else {
            wx.showToast({ title: parentId ? '回复成功' : '留言成功', icon: 'success', duration: 1500 });
          }
          that.setData({
            content: '',
            replyContent: '',
            activeReplyParentId: '',
            selectedImage: null,
            replySelectedImage: null,
            emojiOpen: false,
            replyEmojiOpen: false,
          });
          return that.loadMessages(true);
        });
      }).catch(function (err) {
        if (err && err.message === 'blocked') return;
        if (err && err.message === 'disabled') {
          wx.showToast({ title: '暂不支持留言', icon: 'none', duration: 1800 });
          return;
        }
        console.error('留言提交失败:', err);
        wx.showToast({ title: '提交失败，请稍后重试', icon: 'none', duration: 1800 });
      }).then(function () {
        that.setData({ submitting: false });
      });
    },

    onSubmitMessage: function () {
      if (this.data.imageUploading) {
        wx.showToast({ title: '请等待图片上传完成', icon: 'none', duration: 1500 });
        return;
      }
      this.submitPayload('', this.data.content, this.data.selectedImage);
    },

    onReplyTap: function (e) {
      var id = e.currentTarget.dataset.id;
      this.setData({
        activeReplyParentId: this.data.activeReplyParentId === id ? '' : id,
        replyContent: '',
        replySelectedImage: null,
        emojiOpen: false,
        replyEmojiOpen: false,
      });
    },

    onSubmitReply: function (e) {
      var id = e.currentTarget.dataset.id;
      if (!id) return;
      if (this.data.replyImageUploading) {
        wx.showToast({ title: '请等待图片上传完成', icon: 'none', duration: 1500 });
        return;
      }
      this.submitPayload(id, this.data.replyContent, this.data.replySelectedImage);
    },

    onToggleReplies: function (e) {
      var id = e.currentTarget.dataset.id;
      var messages = this.data.messages.slice();
      messages.forEach(function (item) {
        if (item.objectId === id) item.repliesExpanded = !item.repliesExpanded;
      });
      this.setData({ messages: messages });
    },

    onDeleteMessage: function (e) {
      var that = this;
      var id = e.currentTarget.dataset.id;
      if (!id || !this.data.currentUser) return;
      wx.showModal({
        title: '删除留言',
        content: '确认删除这条留言？',
        confirmText: '删除',
        cancelText: '取消',
        success: function (res) {
          if (!res.confirm) return;
          messageBoard.deleteMessage(id, that.data.currentUser).then(function () {
            wx.showToast({ title: '删除成功', icon: 'success', duration: 1500 });
            that.loadMessages(true);
          }).catch(function (err) {
            console.error('留言删除失败:', err);
            wx.showToast({ title: '无权删除', icon: 'none', duration: 1800 });
          });
        },
      });
    },
  },
});
