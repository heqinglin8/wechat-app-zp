// pages/award/award.js
// JobSeeker（Bmob）：控制台 Class 须含 title education contact jobIntent recoIntro summary
// photoImgs（多张图 URL 半角 | 拼接）、commitUid（提交人 objectId）。
// 配图：最多 6 张；单张 ≤3MB（≤3145728 字节）；扩展名 jpg/jpeg/png/gif/webp/bmp；支持替换与删除；即选即传。

var Bmob = wx.Bmob;
var city = require('../../utils/city.js');
var imageUpload = require('../../utils/imageUpload.js');
var userRole = require('../../utils/userRole.js');

var MAX_RECOMMEND_PHOTOS = 6;
var MAX_PHOTO_BYTES = 3145728;
var WX_CHOOSE_IMAGE_MAX = 9;
var ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

Page({
  data: {
    title: '',
    contact: '',
    wxid: '',
    jobIntent: '',
    detPayMin: '',
    detPayMax: '',
    recoIntro: '',
    summary: '',
    educationOptions: ['初中及以下', '中专 / 高中', '大专', '本科', '硕士及以上'],
    educationIndex: 2,
    payTypeOptions: ['普通月结', '临时工'],
    payTypeIndex: 0,
    payType: 0,
    userLoaded: false,
    /** @type {{ url: string, tempPath: string, uploading: boolean }[]} */
    recommendPhotos: [],
    replacePhotoIndex: -1,
    formSubmitting: false,
    chooseImageBusy: false,
    currentCity: city.DEFAULT_CITY,
    currentCityText: city.fullDisplayText(city.DEFAULT_CITY),
  },

  onTitleInput: function (e) {
    this.setData({ title: (e.detail && e.detail.value) || '' });
  },
  onContactInput: function (e) {
    this.setData({ contact: (e.detail && e.detail.value) || '' });
  },
  onWxidInput: function (e) {
    this.setData({ wxid: (e.detail && e.detail.value) || '' });
  },
  onJobIntentInput: function (e) {
    this.setData({ jobIntent: (e.detail && e.detail.value) || '' });
  },

  onDetPayMinInput: function (e) {
    this.setData({ detPayMin: (e.detail && e.detail.value) || '' });
  },
  onDetPayMaxInput: function (e) {
    this.setData({ detPayMax: (e.detail && e.detail.value) || '' });
  },
  onRecoIntroInput: function (e) {
    this.setData({ recoIntro: (e.detail && e.detail.value) || '' });
  },
  onSummaryInput: function (e) {
    this.setData({ summary: (e.detail && e.detail.value) || '' });
  },
  onEducationChange: function (e) {
    var idx = parseInt(e.detail.value, 10);
    if (isNaN(idx)) return;
    this.setData({ educationIndex: idx });
  },
  onPayTypeChange: function (e) {
    var idx = parseInt(e.detail.value, 10);
    if (isNaN(idx)) return;
    this.setData({
      payTypeIndex: idx,
      payType: idx === 1 ? 1 : 0,
    });
  },

  onLoad: function () {
    this._objectId = '';
    this.refreshCurrentCity();
  },

  onShow: function () {
    var currentUser = Bmob.User.current();
    if (!currentUser) {
      this.handleUnloginRedirect();
      return;
    }
    this.refreshCurrentCity();
    this.loadCurrentUserProfile(currentUser.objectId);
  },

  refreshCurrentCity: function () {
    var currentCity = city.initCurrentCity();
    this.setData({
      currentCity: currentCity,
      currentCityText: city.fullDisplayText(currentCity),
    });
    return currentCity;
  },

  onReady: function () {
    
  },

  onShareAppMessage: function () {},

  isAllowedJobSeekerRole: function (role) {
    return userRole.canPublishJobSeeker(role);
  },

  handleUnloginRedirect: function () {
    var that = this;
    if (that._isHandlingLoginRedirect) {
      return;
    }
    that._isHandlingLoginRedirect = true;
    wx.showModal({
      title: '提示',
      content: '当前用户未登录，跳转到个人中心',
      showCancel: false,
      confirmText: '确定',
      success: function () {
        var pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack({
            delta: 1,
            complete: function () {
              wx.switchTab({
                url: '/pages/personal/personal'
              });
            }
          });
          return;
        }
        wx.switchTab({
          url: '/pages/personal/personal'
        });
      },
      complete: function () {
        that._isHandlingLoginRedirect = false;
      }
    });
  },

  handleJobSeekerRoleDenied: function () {
    var that = this;
    if (that._isHandlingRoleDenied) {
      return;
    }
    that._isHandlingRoleDenied = true;
    wx.showToast({
      title: '求职者才能发布求职信息',
      icon: 'none',
      duration: 2000
    });
    setTimeout(function () {
      var pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({
          delta: 1,
          complete: function () {
            that._isHandlingRoleDenied = false;
          }
        });
        return;
      }
      that._isHandlingRoleDenied = false;
      wx.switchTab({
        url: '/pages/index/index'
      });
    }, 1000);
  },

  loadCurrentUserProfile: function (objectId) {
    var that = this;
    var query = Bmob.Query('_User');
    query.equalTo('objectId', '==', objectId);
    query.find().then(function (results) {
      if (!results.length) {
        wx.showToast({ title: '未找到用户信息，请先登录', icon: 'none', duration: 2000 });
        that.handleUnloginRedirect();
        return;
      }
      var u = results[0];
      var role = u.role == null ? '' : String(u.role).trim();
      if (!that.isAllowedJobSeekerRole(role)) {
        that.setData({
          userLoaded: false
        });
        that.handleJobSeekerRoleDenied();
        return;
      }
      var phone = u.mobilePhoneNumber != null ? String(u.mobilePhoneNumber).trim() : '';
      if (!phone && u.userphone != null) {
        phone = String(u.userphone).trim();
      }
      var wxid = u.wxid != null ? String(u.wxid).trim() : '';
      that.setData({
        contact: phone,
        wxid: that.data.wxid || wxid,
        userLoaded: true,
      });
      that._objectId = objectId;
      that._nickname = u.nickname || '';
      that._avatarPath = u.avatarPath || '';
      that._currentUserRole = role;
    }).catch(function () {
      wx.showToast({ title: '用户信息加载失败', icon: 'none', duration: 2000 });
    });
  },

  validatePhotoPath: function (filePath) {
    return imageUpload.prepareImage(filePath, {
      maxBytes: MAX_PHOTO_BYTES,
      allowedExt: ALLOWED_IMAGE_EXT
    }).catch(function (error) {
      imageUpload.showImageError(error);
      return Promise.reject(error);
    });
  },

  /** Upload single temp file; returns promise with remote url */
  uploadOnePhotoFile: function (imageInfo, slotIndex) {
    var that = this;
    return imageUpload.uploadPreparedImage({
      Bmob: Bmob,
      imageInfo: imageInfo,
      prefix: 'rec',
      slotIndex: slotIndex
    }).then(function (photo) {
      var list = that.data.recommendPhotos.slice();
      var cur = list[slotIndex];
      if (!cur) return Promise.reject(new Error('slot'));
      list[slotIndex] = { url: photo.url, path: photo.path, tempPath: '', uploading: false };
      that.setData({ 
        recommendPhotos: list,
       });
      return photo.url;
    });
  },

  /** Run validations then upload for slot at index */
  startUploadForSlot: function (slotIndex, filePath, rollbackUrl) {
    var that = this;
    return this.validatePhotoPath(filePath)
      .then(function (imageInfo) {
        return that.uploadOnePhotoFile(imageInfo, slotIndex);
      })
      .catch(function () {
        var list = that.data.recommendPhotos.slice();
        var cur = list[slotIndex];
        if (!cur) return;
        if (rollbackUrl) {
          list[slotIndex] = { url: rollbackUrl, tempPath: '', uploading: false };
        } else {
          list.splice(slotIndex, 1);
        }
        that.setData({ recommendPhotos: list });
      });
  },

  appendPhotosAfterChoose: function (paths) {
    var that = this;
    var replaceIdx = this.data.replacePhotoIndex;
    var seq = Promise.resolve();

    if (replaceIdx >= 0) {
      var rp = paths[0];
      if (!rp) {
        this.setData({ replacePhotoIndex: -1, chooseImageBusy: false });
        return Promise.resolve();
      }
      var prevUrl = (this.data.recommendPhotos[replaceIdx] && this.data.recommendPhotos[replaceIdx].url) || '';
      var list = this.data.recommendPhotos.slice();
      list[replaceIdx] = { url: prevUrl, tempPath: rp, uploading: true };
      this.setData({ recommendPhotos: list, replacePhotoIndex: -1 });
      seq = seq.then(function () {
        return that.startUploadForSlot(replaceIdx, rp, prevUrl);
      });
      return seq.then(function () {}, function () {}).then(function () {
        that.setData({ chooseImageBusy: false });
      });
    }
    console.log('appendPhotosAfterChoose photos', paths);
    var remain = MAX_RECOMMEND_PHOTOS - this.data.recommendPhotos.length;
    var take = paths.slice(0, Math.max(0, remain));
    if (!take.length) {
      this.setData({ chooseImageBusy: false });
      return Promise.resolve();
    }
    take.forEach(function (p) {
      seq = seq.then(function () {
        return that.validatePhotoPath(p).then(function (imageInfo) {
          var next = that.data.recommendPhotos.concat([
            { url: '', tempPath: p, uploading: true },
          ]);
          var idx = next.length - 1;
          that.setData({ recommendPhotos: next });
          return that.uploadOnePhotoFile(imageInfo, idx).catch(function (error) {
            console.error('uploadOnePhotoFile fail!error:',error);
            var ls = that.data.recommendPhotos.slice();
            ls.splice(idx, 1);
            that.setData({ recommendPhotos: ls });
            wx.showToast({ title: '图片上传失败', icon: 'none', duration: 2000 });
          });
        });
      });
    });

    return seq.then(function () {}, function () {}).then(function () {
      that.setData({ chooseImageBusy: false });
    });
  },

  openChooseImage: function (count) {
    var that = this;
    if (this.data.chooseImageBusy) return;
    this.setData({ chooseImageBusy: true });
    wx.chooseImage({
      count: count,
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        console.log('choose image success', res);
        var paths = res.tempFilePaths || [];
        that.appendPhotosAfterChoose(paths);
      },
      fail: function () {
        console.error('choose image fail');
        that.setData({ chooseImageBusy: false, replacePhotoIndex: -1 });
      },
    });
  },

  onAddPhotos: function () {
    if (this.data.chooseImageBusy) return;
    var n = this.data.recommendPhotos.length;
    if (n >= MAX_RECOMMEND_PHOTOS) {
      wx.showToast({ title: '最多 6 张图片', icon: 'none', duration: 2000 });
      return;
    }
    this.setData({ replacePhotoIndex: -1 });
    var pick = Math.min(WX_CHOOSE_IMAGE_MAX, MAX_RECOMMEND_PHOTOS - n);
    this.openChooseImage(pick);
  },

  onReplacePhoto: function (e) {
    if (this.data.chooseImageBusy) return;
    var idx = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(idx) || idx < 0) return;
    this.setData({ replacePhotoIndex: idx });
    this.openChooseImage(1);
  },

  onRemovePhoto: function (e) {
    if (this.data.chooseImageBusy) return;
    var idx = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(idx) || idx < 0) return;
    var cur = this.data.recommendPhotos[idx];
    if (cur && cur.uploading) {
      wx.showToast({ title: '上传完成后可删除', icon: 'none', duration: 2000 });
      return;
    }
    var list = this.data.recommendPhotos.slice();
    list.splice(idx, 1);
    this.setData({ recommendPhotos: list });
  },

  validateForm: function () {
    var d = this.data;
    if (!(d.title && String(d.title).trim())) {
      wx.showToast({ title: '请填写标题', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.contact && String(d.contact).trim())) {
      wx.showToast({ title: '请填写电话', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    var phone = String(d.contact || '').trim();
    var mobileReg = /^1[3-9]\d{9}$/;
    var landlineReg = /^0\d{2,3}-?\d{7,8}(?:-\d{1,6})?$/;
    if (!mobileReg.test(phone) && !landlineReg.test(phone)) {
      wx.showToast({ title: '手机号或固话不正确', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.wxid && String(d.wxid).trim())) {
      wx.showToast({ title: '请填写微信号', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    if (!(d.jobIntent && String(d.jobIntent).trim())) {
      wx.showToast({ title: '请填写求职意向', image: '../../images/warning.png', duration: 2000 });
      return false;
    }
    
    var payMin = String(d.detPayMin || '').trim();
    var payMax = String(d.detPayMax || '').trim();
    if (!payMin || !payMax) {
      wx.showToast({ title: '请填写薪资范围', icon:  'none', duration: 2000 });
      return false;
    }
    if (Number(payMin) >= Number(payMax)) {
      wx.showToast({ title: '最低薪资须小于最高', icon: 'none', duration: 2000 });
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

  buildPhotoImgsField: function () {
    var parts = [];
    this.data.recommendPhotos.forEach(function (p) {
      if (p.path) parts.push(p.path);
    });
    return parts.join('|');
  },

  photosReadyForSubmit: function () {
    var photos = this.data.recommendPhotos;
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].uploading) return false;
      if (photos[i].tempPath && !photos[i].path) return false;
    }
    return true;
  },
  resolvePublishActive: function () {
    return userRole.resolvePublishActive(this._currentUserRole);
  },

  applyJobSeekerFields: function (row) {
    console.log("applyJobSeekerFields row:",row);
    var d = this.data;
    var edu = this.educationLabel();
    row.set('commitUid', this._objectId || '');
    row.set('commitNickname', String(this._nickname).trim());
    row.set('commitAvatar', this._avatarPath || '');
    row.set('title', String(d.title).trim());
    row.set('education', edu);
    row.set('contact', String(d.contact).trim());
    row.set('wxid', String(d.wxid).trim());
    row.set('jobIntent', String(d.jobIntent).trim());
    row.set('payType', Number(d.payType || 0));
    row.set('detPayMin', Number(d.detPayMin || ''));
    row.set('detPayMax', Number(d.detPayMax || ''));
    row.set('recoIntro', (d.recoIntro && String(d.recoIntro).trim()) || '');
    row.set('summary', (d.summary && String(d.summary).trim()) || '');
    row.set('photoImgs', this.buildPhotoImgsField());
    row.set('active', this.resolvePublishActive());
    var currentCity = city.normalizeCity(this.refreshCurrentCity());
    row.set('districtName', currentCity.districtName);
    row.set('districtCode', currentCity.districtCode);
  },

  put_infor: function () {
    var that = this;
    if (that.data.formSubmitting) return;
    if (!that.data.userLoaded || !that._objectId) {
      wx.showToast({ title: '请先登录后再推荐', image: '../../images/warning.png', duration: 2000 });
      return;
    }
    if (!that.validateForm()) {
      return;
    }
    if (!that.photosReadyForSubmit()) {
      wx.showToast({ title: '请等待图片上传完成', icon: 'none', duration: 2000 });
      return;
    }

    that.setData({ formSubmitting: true });

    var query = Bmob.Query('JobSeeker');
    query.equalTo('commitUid', '==', that._objectId);
    query.equalTo('title', '==', String(that.data.title).trim());
    query.equalTo('active', '==', 1);

    query.find().then(function (results) {
      console.log("查询 JobSeeker results:",results,!results.length);
      if (!results.length) {
        console.log("查询 JobSeeker 无记录，创建新推荐");
        var created = Bmob.Query('JobSeeker');
        that.applyJobSeekerFields(created);
        return created.save().then(function () {
          var isPendingReview = that.resolvePublishActive() === 0;
          wx.switchTab({ url: '../index/index' });
          setTimeout(function () {
            wx.showToast({
              title: isPendingReview ? '发布成功，将审核后展示' : '推荐成功',
              icon: 'success',
              duration: 2000
            });
          }, 320);
        });
      }
      console.log("查询 JobSeeker 有记录，更新档案");
      var row = results[0];
      return new Promise(function (resolve, reject) {
        wx.showModal({
          title: '提示',
          content: '已经有该条记录，你确认要更新？',
          confirmText: '确认',
          cancelText: '取消',
          success: function (res) {
            if (res.confirm) {
              resolve();
              return;
            }
            reject(new Error('cancel_update'));
          },
          fail: function (err) {
            reject(err || new Error('modal_fail'));
          },
        });
      }).then(function () {
        var updatedQuery = Bmob.Query('JobSeeker');
        return updatedQuery.get(row.objectId).then(function (existing) {
          if (String(existing.commitUid || '').trim() !== that._objectId) {
            wx.showToast({
              title: '无权编辑该求职',
              icon: 'none',
              duration: 1500
            });
            throw new Error('permission_denied');
          }
          that.applyJobSeekerFields(existing);
          return existing.save();
        });
      }).then(function () {
        var isPendingReview = that.resolvePublishActive() === 0;
        wx.switchTab({ url: '../index/index' });
        setTimeout(function () {
          wx.showToast({
            title: isPendingReview ? '发布成功，将在审核后展示' : '档案已更新',
            icon: 'success',
            duration: 2000
          });
        }, 320);
      });
    }).catch(function (e) {
      if (e && (e.message === 'cancel_update' || e.message === 'permission_denied')) {
        return;
      }
      console.error("提交失败,e:",e)
      wx.showToast({
        title: '提交失败，请稍后重试',
        icon: 'none',
        duration: 2000,
      });
    }).then(function () {
      that.setData({ formSubmitting: false });
    });
  },
  

});
